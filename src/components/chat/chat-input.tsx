"use client";

import {
  ArrowUpIcon,
  Loader2Icon,
  MicIcon,
  MicOffIcon,
  SquareIcon,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { useVoice } from "@/context/voice-context";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isBusy: boolean;
  onStop: () => void;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isBusy,
  onStop,
}: ChatInputProps) {
  const charCount = input.length;
  const maxChars = 3000;
  const {
    voiceSessionActive,
    toggleVoiceSession,
    isListening,
    isTranscribing,
    isSpeaking,
  } = useVoice();

  return (
    <footer className="shrink-0 p-4">
      <div className="max-w-[1000px] mx-auto w-full">
        <form onSubmit={onSubmit} className="w-full">
          <InputGroup>
            <InputGroupTextarea
              aria-label="Chat input"
              placeholder={
                voiceSessionActive
                  ? isTranscribing
                    ? "Transcribing your voice with Gemini AI..."
                    : isSpeaking
                      ? "BankMate is speaking... (talk anytime to interrupt, tap mic to end)..."
                      : isBusy
                        ? "BankMate is thinking..."
                        : "Voice conversation active... Speak your query (pause to send, tap mic to end)..."
                  : "Ask BankMate about balances, statements, loans..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              maxLength={maxChars}
            />
            <InputGroupAddon align="block-end" className="justify-end">
              <div className="flex items-center gap-2 w-full justify-between">
                {/* Left: status indicator */}
                <div className="flex items-center gap-2">
                  {voiceSessionActive ? (
                    isTranscribing ? (
                      <div
                        className="flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "rgba(99, 102, 241, 0.12)",
                          border: "1px solid rgba(99, 102, 241, 0.35)",
                          color: "#6366F1",
                        }}
                      >
                        <Loader2Icon
                          className="animate-spin"
                          style={{ width: 12, height: 12 }}
                        />
                        <span>Transcribing voice...</span>
                      </div>
                    ) : isSpeaking ? (
                      <div
                        className="flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer"
                        title="BankMate is speaking. Talk anytime to interrupt or click to stop."
                        style={{
                          backgroundColor: "rgba(59, 130, 246, 0.12)",
                          border: "1px solid rgba(59, 130, 246, 0.35)",
                          color: "#2563EB",
                        }}
                      >
                        <span
                          className="flex items-center gap-0.5"
                          style={{ height: 12 }}
                        >
                          <span
                            className="rounded-full animate-bounce"
                            style={{
                              width: 2,
                              height: 10,
                              backgroundColor: "#2563EB",
                              animationDelay: "-0.3s",
                            }}
                          />
                          <span
                            className="rounded-full animate-bounce"
                            style={{
                              width: 2,
                              height: 14,
                              backgroundColor: "#2563EB",
                              animationDelay: "-0.15s",
                            }}
                          />
                          <span
                            className="rounded-full animate-bounce"
                            style={{
                              width: 2,
                              height: 8,
                              backgroundColor: "#2563EB",
                            }}
                          />
                        </span>
                        <span>BankMate speaking • (Talk to interrupt)</span>
                      </div>
                    ) : isBusy ? (
                      <div
                        className="flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          color: "#059669",
                        }}
                      >
                        <span
                          className="rounded-full animate-pulse"
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: "#10B981",
                          }}
                        />
                        <span>BankMate thinking...</span>
                      </div>
                    ) : isListening ? (
                      <div
                        className="flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium animate-pulse"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#DC2626",
                        }}
                      >
                        <span
                          className="rounded-full animate-ping"
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: "#EF4444",
                          }}
                        />
                        <span>Voice Mode • Listening...</span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          color: "#059669",
                        }}
                      >
                        <span
                          className="rounded-full"
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: "#10B981",
                          }}
                        />
                        <span>Voice Conversation Active</span>
                      </div>
                    )
                  ) : (
                    <span
                      className="text-[11px] tabular-nums"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {charCount} / {maxChars.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Right: microphone toggle + send/stop */}
                <div className="flex items-center gap-2">
                  {/* Conversational Microphone Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceSession}
                    title={
                      voiceSessionActive
                        ? "Voice conversation is active. Click to turn off voice mode."
                        : "Start voice conversation (continuous hands-free dialog)"
                    }
                    className="flex items-center justify-center rounded-md transition-all cursor-pointer"
                    style={{
                      width: 28,
                      height: 28,
                      ...(voiceSessionActive
                        ? {
                            backgroundColor: "#EF4444",
                            color: "#FFFFFF",
                            boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.35)",
                          }
                        : {
                            backgroundColor: "transparent",
                            color: "#64748B",
                          }),
                    }}
                  >
                    {voiceSessionActive ? (
                      <MicOffIcon style={{ width: 16, height: 16 }} />
                    ) : (
                      <MicIcon style={{ width: 16, height: 16 }} />
                    )}
                  </button>

                  {isBusy ? (
                    <InputGroupButton
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={onStop}
                      aria-label="Stop generating"
                    >
                      <SquareIcon className="fill-current" />
                    </InputGroupButton>
                  ) : (
                    <InputGroupButton
                      type="submit"
                      variant="default"
                      size="icon-sm"
                      disabled={!input.trim()}
                    >
                      <ArrowUpIcon />
                      <span className="sr-only">Send</span>
                    </InputGroupButton>
                  )}
                </div>
              </div>
            </InputGroupAddon>
          </InputGroup>
        </form>
        <div
          className="mt-2 text-center text-[11px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          BankMate may generate inaccurate information about transactions or
          rates. Model: Gemini Flash
        </div>
      </div>
    </footer>
  );
}
