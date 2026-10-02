export async function POST(req: Request) {
  try {
    let audioBuffer: Buffer;
    let mimeType = "audio/webm";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("audio") as File | null;
      if (!file) {
        return Response.json(
          { error: "No audio file provided in form data" },
          { status: 400 },
        );
      }
      mimeType = file.type || "audio/webm";
      const arrayBuffer = await file.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    } else {
      const json = await req.json();
      if (!json.audio) {
        return Response.json(
          { error: "No audio payload provided" },
          { status: 400 },
        );
      }
      mimeType = json.mimeType || "audio/webm";
      const raw = json.audio as string;
      const base64Data = raw.includes(",") ? raw.split(",")[1] : raw;
      audioBuffer = Buffer.from(base64Data, "base64");
    }

    if (audioBuffer.length === 0) {
      return Response.json({ transcript: "" });
    }

    // Strip codec parameters (e.g. "audio/webm;codecs=opus" -> "audio/webm")
    const cleanMimeType = (mimeType.split(";")[0] || "audio/webm").trim();
    const base64Audio = audioBuffer.toString("base64");

    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    if (!apiKey) {
      return Response.json(
        { error: "No Gemini API key configured for audio transcription." },
        { status: 500 },
      );
    }

    // Call Google Generative AI REST API directly with gemini-2.0-flash for blazing sub-second speed
    const prompt =
      "You are a specialized speech transcriber for a premier banking application. " +
      "Transcribe the user's spoken audio query verbatim into clear English text. " +
      "The speaker may speak in Indian English and mention banking terminology (transfer money, fixed deposit, FD, balance, statement, transactions, UPI, loan, EMI, credit card, account, lakhs). " +
      "When the user recites digits, numbers, or a transaction PIN (e.g., '1 2 3 4 5 6', 'one two three four five six', or '123456'), ensure all digits/numbers are transcribed accurately and completely without dropping any digit. " +
      "Output ONLY the complete exact words or numbers spoken. Do not truncate or cut off sentences. Do not add quotes, markdown formatting, prefixes, or explanations. If silent or unintelligible, return an empty string.";

    const modelsToTry = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
    ];
    let transcript = "";
    let lastErrorDetails = "";

    for (const modelId of modelsToTry) {
      try {
        console.log(
          `[Transcribe] Attempting transcription with ${modelId}... (audio size: ${audioBuffer.length} bytes, mime: ${cleanMimeType})`,
        );
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: cleanMimeType,
                        data: base64Audio,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0,
                maxOutputTokens: 256,
              },
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const rawText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          transcript = rawText.trim().replace(/^["']|["']$/g, "");
          console.log(`[Transcribe] ✓ ${modelId} success: "${transcript}"`);
          if (transcript) break; // Success!
        } else {
          const errText = await response.text();
          lastErrorDetails = `Model ${modelId} returned ${response.status}: ${errText.slice(0, 150)}`;
          console.warn(`[Transcribe] ${lastErrorDetails}`);
        }
      } catch (err: any) {
        lastErrorDetails = `Model ${modelId} fetch error: ${err?.message}`;
        console.warn(`[Transcribe] ${lastErrorDetails}`);
      }
    }

    return Response.json({ transcript });
  } catch (error: any) {
    console.error("[Transcribe Route Fatal Error]:", error);
    return Response.json(
      { error: error?.message || "Failed to transcribe audio." },
      { status: 500 },
    );
  }
}
