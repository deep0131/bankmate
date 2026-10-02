"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  chunkTextForSpeech,
  cleanTextForSpeech,
  getExecutiveVoice,
} from "@/lib/voice-utils";

interface VoiceContextValue {
  voiceSessionActive: boolean;
  voiceMode: boolean;
  toggleVoiceSession: () => void;
  startVoiceSession: () => void;
  stopVoiceSession: () => void;
  isListening: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  speakingMessageId: string | null;
  supported: {
    stt: boolean;
    tts: boolean;
  };
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, messageId?: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
  const voiceSessionActiveRef = useRef(false);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState({ stt: false, tts: false });

  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isSpeakingRef = useRef(false);

  const recognitionRef = useRef<any>(null);
  const webSpeechFailedRef = useRef(false);
  const webSpeechTranscriptRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const listeningActiveRef = useRef(false);

  // Forward ref for circular dependency
  const startListeningRef = useRef<() => Promise<void>>(async () => {});

  // Initialize voice synthesis voices & feature support
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSTT = !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      navigator?.mediaDevices?.getUserMedia
    );
    const hasTTS = typeof window.speechSynthesis !== "undefined";
    setSupported({ stt: hasSTT, tts: hasTTS });

    if (hasTTS) {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) setVoices(available);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Stop speech playback
  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    isSpeakingRef.current = false;
    activeUtterancesRef.current = [];
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  // Full teardown — stops everything (used when toggling voice off or unmount)
  const teardownAll = useCallback(() => {
    listeningActiveRef.current = false;
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Restart mic for next turn — deferred to avoid race conditions
  const restartMic = useCallback(() => {
    if (!voiceSessionActiveRef.current) return;
    setTimeout(() => {
      if (
        voiceSessionActiveRef.current &&
        !isSpeakingRef.current &&
        !listeningActiveRef.current
      ) {
        console.log(
          "[BankMate Voice] ▶ Restarting mic for next conversational turn",
        );
        startListeningRef.current();
      }
    }, 400);
  }, []);

  // Handle recognized text — send to chat or interactive widget, then restart mic
  const handleRecognizedText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        restartMic();
        return;
      }

      console.log("[BankMate STT] ✓ Recognized text:", trimmed);

      // Try interactive widget first (e.g. PIN card)
      const evt = new CustomEvent("bankmate-voice-action", {
        detail: { text: trimmed },
        cancelable: true,
      });
      if (!window.dispatchEvent(evt)) {
        console.log(
          "[BankMate Voice] Widget handled action (PIN etc.), NOT sending to chat.",
        );
        restartMic();
        return;
      }

      // Send to chat
      window.dispatchEvent(
        new CustomEvent("bankmate-send-chat-prompt", {
          detail: { text: trimmed },
        }),
      );

      // Safety timeout: if speak() never fires (e.g. error in chat generation), restart mic after 12s
      setTimeout(() => {
        if (
          voiceSessionActiveRef.current &&
          !isSpeakingRef.current &&
          !listeningActiveRef.current
        ) {
          console.log(
            "[BankMate Voice] Safety restart (no speech callback fired)",
          );
          startListeningRef.current();
        }
      }, 12000);
    },
    [restartMic],
  );

  // Transcribe audio blob via Gemini backend
  const transcribeBlob = useCallback(
    async (blob: Blob) => {
      if (blob.size < 300) {
        console.log(
          `[BankMate STT] Audio blob too small (${blob.size} bytes), skipping.`,
        );
        restartMic();
        return;
      }

      setIsTranscribing(true);
      try {
        console.log(
          `[BankMate STT] Transcribing audio (${blob.size} bytes, ${blob.type}) via Gemini...`,
        );
        const fd = new FormData();
        fd.append("audio", blob, "voice-query.webm");
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const transcript = (data.transcript || "").trim();

        if (transcript) {
          console.log(
            "[BankMate STT] ✓ Gemini transcript received:",
            transcript,
          );
          handleRecognizedText(transcript);
        } else {
          console.log(
            "[BankMate STT] Empty transcript returned from Gemini, resuming listening.",
          );
          restartMic();
        }
      } catch (err: any) {
        console.error("[BankMate STT] Transcription error:", err);
        restartMic();
      } finally {
        setIsTranscribing(false);
      }
    },
    [handleRecognizedText, restartMic],
  );

  // ============ CORE: Start capturing audio =============
  const startListeningInternal = useCallback(async () => {
    if (typeof window === "undefined" || !voiceSessionActiveRef.current) return;
    if (listeningActiveRef.current) return; // prevent duplicate mic hooks

    console.log("[BankMate Voice] 🎙️ Starting mic capture...");
    listeningActiveRef.current = true;
    webSpeechTranscriptRef.current = "";
    audioChunksRef.current = [];
    setIsListening(true);

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
    } catch (err: any) {
      console.error("[BankMate STT] Mic access error:", err);
      listeningActiveRef.current = false;
      setIsListening(false);
      return;
    }

    // If voice session was turned off while awaiting permission
    if (!voiceSessionActiveRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      listeningActiveRef.current = false;
      setIsListening(false);
      return;
    }

    audioStreamRef.current = stream;

    let mimeType = "audio/webm;codecs=opus";
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }
    }

    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 128000,
    });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      console.log(
        "[BankMate Voice] Recorder stopped, chunks:",
        audioChunksRef.current.length,
      );
      listeningActiveRef.current = false;
      setIsListening(false);

      // Stop media tracks after recorder finalizes
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }

      if (!voiceSessionActiveRef.current) return;

      // 1. If Web Speech API captured text (instant in Chrome/Edge), prioritize it!
      const webText = webSpeechTranscriptRef.current.trim();
      if (webText) {
        console.log(
          "[BankMate STT] Using instant WebSpeech transcript:",
          webText,
        );
        handleRecognizedText(webText);
        return;
      }

      // 2. Otherwise transcribe recorded audio chunks via Gemini backend
      if (audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        transcribeBlob(blob);
      } else {
        restartMic();
      }
    };

    recorder.start(100);
    console.log("[BankMate Voice] 🎙️ Recorder started, listening...");

    // Helper to stop current capture cleanly
    const finalizeCapture = () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    };

    // ---- Silence + Barge-in detection via AudioContext ----
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) {
        const audioCtx = new AC();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const freqBuf = new Uint8Array(analyser.frequencyBinCount);
        const timeBuf = new Uint8Array(analyser.fftSize);

        let hasSpoken = false;
        let lastSpokenTime = Date.now();
        const sessionStartTime = Date.now();
        let bargeInFrames = 0;

        silenceTimerRef.current = setInterval(() => {
          if (!listeningActiveRef.current) return;

          if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
          }

          // Calculate time-domain RMS (amplitude)
          analyser.getByteTimeDomainData(timeBuf);
          let sumSquares = 0;
          for (let i = 0; i < timeBuf.length; i++) {
            const norm = (timeBuf[i] - 128) / 128;
            sumSquares += norm * norm;
          }
          const rms = Math.sqrt(sumSquares / timeBuf.length);

          // Calculate speech-band frequency peak (bins 3-45 corresponds to ~250Hz - 3800Hz)
          analyser.getByteFrequencyData(freqBuf);
          let speechBandMax = 0;
          for (let i = 3; i < 45 && i < freqBuf.length; i++) {
            if (freqBuf[i] > speechBandMax) speechBandMax = freqBuf[i];
          }

          const isVoiceActive = rms > 0.025 || speechBandMax > 28;

          // Barge-in: user speaks while agent is speaking
          if (isSpeakingRef.current) {
            if (isVoiceActive) {
              bargeInFrames++;
              if (bargeInFrames >= 2) {
                console.log(
                  "[BankMate Voice] ⚡ Barge-in! Cutting off agent speech.",
                );
                stopSpeaking();
                audioChunksRef.current = [];
                webSpeechTranscriptRef.current = "";
                hasSpoken = true;
                lastSpokenTime = Date.now();
                bargeInFrames = 0;
              }
            } else {
              bargeInFrames = 0;
              if (!hasSpoken && audioChunksRef.current.length > 3) {
                audioChunksRef.current = [];
              }
            }
            return;
          }

          // Normal speech detection
          const now = Date.now();
          if (isVoiceActive) {
            hasSpoken = true;
            lastSpokenTime = now;
          } else if (hasSpoken && now - lastSpokenTime > 1300) {
            console.log(
              "[BankMate STT] 1.3s pause detected → finalizing voice query",
            );
            finalizeCapture();
          } else if (hasSpoken && now - sessionStartTime > 10000) {
            console.log(
              "[BankMate STT] 10s max speech limit reached → finalizing voice query",
            );
            finalizeCapture();
          }
        }, 80);
      }
    } catch (err) {
      console.warn("[BankMate STT] AudioContext:", err);
    }

    // ---- Web Speech API (runs in parallel for instant transcription where supported) ----
    if (!webSpeechFailedRef.current) {
      const SRC =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SRC) {
        try {
          const rec = new SRC();
          rec.continuous = true;
          rec.interimResults = true;
          rec.maxAlternatives = 1;
          rec.lang = "en-IN";

          rec.onresult = (event: any) => {
            let final = "";
            let interim = "";
            for (let i = 0; i < event.results.length; i++) {
              const r = event.results[i];
              if (r.isFinal) final += r[0].transcript;
              else interim += r[0].transcript;
            }
            const combined = (final + interim).trim();
            if (combined) {
              if (isSpeakingRef.current) {
                console.log("[BankMate Voice] ⚡ Barge-in (WebSpeech)");
                stopSpeaking();
                audioChunksRef.current = [];
              }
              webSpeechTranscriptRef.current = combined;
            }
          };

          rec.onerror = (e: any) => {
            if (
              e.error === "network" ||
              e.error === "not-allowed" ||
              e.error === "service-not-allowed"
            ) {
              webSpeechFailedRef.current = true;
              try {
                rec.abort();
              } catch {}
              recognitionRef.current = null;
            }
          };

          rec.onend = () => {
            recognitionRef.current = null;
          };
          recognitionRef.current = rec;
          rec.start();
        } catch {
          webSpeechFailedRef.current = true;
        }
      }
    }
  }, [restartMic, stopSpeaking, transcribeBlob, handleRecognizedText]);

  // Keep ref in sync
  useEffect(() => {
    startListeningRef.current = startListeningInternal;
  }, [startListeningInternal]);

  // ============ TTS: Speak with chunking ============
  const speak = useCallback(
    (rawText: string, messageId?: string, onEnd?: () => void) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      stopSpeaking();

      const cleaned = cleanTextForSpeech(rawText);
      if (!cleaned.trim()) {
        onEnd?.();
        restartMic();
        return;
      }

      const chunks = chunkTextForSpeech(cleaned);
      if (chunks.length === 0) {
        onEnd?.();
        restartMic();
        return;
      }

      const currentVoices =
        voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      const executiveVoice = getExecutiveVoice(currentVoices);

      setIsSpeaking(true);
      isSpeakingRef.current = true;
      setSpeakingMessageId(messageId || null);

      let idx = 0;

      const onFinished = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        onEnd?.();
        audioChunksRef.current = [];
        webSpeechTranscriptRef.current = "";
        // *** Restart mic for next conversational turn ***
        restartMic();
      };

      const playNext = () => {
        if (!isSpeakingRef.current || idx >= chunks.length) {
          onFinished();
          return;
        }

        const utt = new SpeechSynthesisUtterance(chunks[idx]);
        if (executiveVoice) {
          utt.voice = executiveVoice;
          utt.lang = executiveVoice.lang;
        } else {
          utt.lang = "en-US";
        }
        utt.rate = 1.02;
        utt.pitch = 1.0;
        utt.volume = 1.0;

        utt.onend = () => {
          if (!isSpeakingRef.current) return;
          idx++;
          playNext();
        };

        utt.onerror = (e) => {
          if (e.error !== "interrupted" && e.error !== "canceled") {
            console.warn("Speech synthesis:", e.error);
          }
          if (idx + 1 < chunks.length && isSpeakingRef.current) {
            idx++;
            playNext();
          } else {
            onFinished();
          }
        };

        activeUtterancesRef.current = [utt];
        window.speechSynthesis.speak(utt);
      };

      // Start mic for barge-in detection while speaking
      if (voiceSessionActiveRef.current && !listeningActiveRef.current) {
        startListeningRef.current();
      }

      playNext();
    },
    [voices, stopSpeaking, restartMic],
  );

  // ============ Session controls ============
  const startVoiceSession = useCallback(() => {
    console.log("[BankMate Voice] 🟢 Voice session ON");
    voiceSessionActiveRef.current = true;
    setVoiceSessionActive(true);
    startListeningRef.current();
  }, []);

  const stopVoiceSession = useCallback(() => {
    console.log("[BankMate Voice] 🔴 Voice session OFF");
    voiceSessionActiveRef.current = false;
    setVoiceSessionActive(false);
    stopSpeaking();
    teardownAll();
  }, [stopSpeaking, teardownAll]);

  const toggleVoiceSession = useCallback(() => {
    if (voiceSessionActiveRef.current) stopVoiceSession();
    else startVoiceSession();
  }, [startVoiceSession, stopVoiceSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceSessionActiveRef.current = false;
      stopSpeaking();
      teardownAll();
    };
  }, [stopSpeaking, teardownAll]);

  return (
    <VoiceContext.Provider
      value={{
        voiceSessionActive,
        voiceMode: voiceSessionActive,
        toggleVoiceSession,
        startVoiceSession,
        stopVoiceSession,
        isListening,
        isTranscribing,
        isSpeaking,
        speakingMessageId,
        supported,
        startListening: startVoiceSession,
        stopListening: stopVoiceSession,
        speak,
        stopSpeaking,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
}
