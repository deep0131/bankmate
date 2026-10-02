/**
 * Voice utilities for BankMate
 * Handles text sanitization, Indian currency normalization,
 * executive voice selection, and sentence chunking for speech synthesis.
 */

/**
 * Converts Indian currency numbers into clear, spoken words.
 * E.g., "3,45,210.50" -> "3 lakh 45 thousand 210 rupees and 50 paise"
 */
export function formatIndianCurrencyToWords(amountStr: string): string {
  const clean = amountStr.replace(/,/g, "").trim();
  const num = parseFloat(clean);
  if (Number.isNaN(num)) return amountStr;

  const parts = clean.split(".");
  let intPart = parseInt(parts[0], 10);
  const decPart = parts[1] ? parseInt(parts[1].slice(0, 2), 10) : 0;

  if (intPart === 0 && decPart === 0) return "zero rupees";

  let result = "";
  if (intPart >= 10000000) {
    const crore = Math.floor(intPart / 10000000);
    intPart %= 10000000;
    result += `${crore} crore `;
  }
  if (intPart >= 100000) {
    const lakh = Math.floor(intPart / 100000);
    intPart %= 100000;
    result += `${lakh} lakh `;
  }
  if (intPart >= 1000) {
    const thousand = Math.floor(intPart / 1000);
    intPart %= 1000;
    result += `${thousand} thousand `;
  }
  if (intPart > 0) {
    result += `${intPart} `;
  }

  result = `${result.trim()} rupees`;
  if (decPart > 0) {
    result += ` and ${decPart} paise`;
  }
  return result;
}

/**
 * Strips raw markdown, code blocks, mermaid charts, tables,
 * and normalizes banking acronyms and currency for clear speech synthesis.
 */
export function cleanTextForSpeech(rawMarkdown: string): string {
  if (!rawMarkdown) return "";

  let text = rawMarkdown;

  // 1. Remove code blocks and mermaid diagrams
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`([^`]+)`/g, "$1");

  // 2. Remove markdown tables (lines containing |)
  text = text.replace(/^\|[^\n]+\|\r?\n?/gm, "");

  // 3. Remove markdown headers (#, ##, etc.)
  text = text.replace(/^#+\s+/gm, "");

  // 4. Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");

  // 5. Remove markdown images and links: ![alt](url) or [text](url) -> text
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 6. Remove bold/italics markers
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // 7. Remove list bullet points (e.g. "* ", "- ", "1. ")
  text = text.replace(/^[\s*•-]+\s+/gm, "");
  text = text.replace(/^\d+\.\s+/gm, "");

  // 8. Remove blockquotes
  text = text.replace(/^>\s+/gm, "");

  // 9. Remove HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // 10. Normalize Indian currency notations
  // Matches ₹1,50,000 or INR 50,000 or Rs. 10,000
  text = text.replace(
    /(?:₹|INR|Rs\.?)\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
    (_, amt) => formatIndianCurrencyToWords(amt),
  );

  // 11. Normalize percentages
  text = text.replace(/(\d+(?:\.\d+)?)\s*%/g, "$1 percent");

  // 12. Normalize Banking Acronyms for clear natural pronunciation
  text = text.replace(/\bA\/C\b/gi, "account");
  text = text.replace(/\bAcct\b/gi, "account");
  text = text.replace(/\bFD\b/g, "fixed deposit");
  text = text.replace(/\bFDs\b/g, "fixed deposits");
  text = text.replace(/\bRD\b/g, "recurring deposit");
  text = text.replace(/\bEMI\b/g, "E M I");
  text = text.replace(/\bEMIs\b/g, "E M Is");
  text = text.replace(/\bIFSC\b/g, "I F S C");
  text = text.replace(/\bUPI\b/g, "U P I");
  text = text.replace(/\bNEFT\b/g, "N E F T");
  text = text.replace(/\bRTGS\b/g, "R T G S");
  text = text.replace(/\bIMPS\b/g, "I M P S");
  text = text.replace(/\bTxn\b/gi, "transaction");
  text = text.replace(/\bTxns\b/gi, "transactions");
  text = text.replace(/\bRef\s*#?:?\s*/gi, "Reference ");
  text = text.replace(/\bCR\b/g, "credit");
  text = text.replace(/\bDR\b/g, "debit");

  // 13. Mask/spell long account numbers gracefully (e.g. 100000000000 -> account ending in 0000)
  text = text.replace(
    /\b(\d{4,8})(\d{4})\b/g,
    (_, _front, end) => `ending in ${end.split("").join(" ")}`,
  );

  // 14. Collapse excessive whitespaces and empty lines
  text = text.replace(/\n+/g, ". ");
  text = text.replace(/\s+/g, " ").trim();

  // 15. Ensure sentence ending punctuation
  if (text.length > 0 && !/[.!?]$/.test(text)) {
    text += ".";
  }

  return text;
}

/**
 * Splits text into natural sentence chunks of ~150-180 characters.
 * This completely avoids the Chromium/WebKit 15-second speech synthesis cutoff bug!
 */
export function chunkTextForSpeech(text: string, maxLen = 160): string[] {
  if (!text || text.length <= maxLen) return text ? [text] : [];

  const chunks: string[] = [];
  // Split on sentence boundaries: periods, question marks, exclamation marks, or commas
  const sentences = text.match(/[^.!?]+[.!?]+|\S+/g) || [text];

  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (!currentChunk) {
      currentChunk = trimmed;
    } else if (currentChunk.length + trimmed.length + 1 <= maxLen) {
      currentChunk += ` ${trimmed}`;
    } else {
      chunks.push(currentChunk);
      currentChunk = trimmed;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Selects an authoritative, polished executive voice from available system voices.
 * Prioritizes Microsoft Natural, Google Natural, and Apple Enhanced voices.
 */
export function getExecutiveVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // Executive priority list
  const preferredVoiceNames = [
    // Microsoft Natural Online (Windows / Edge)
    "Microsoft Christopher Online (Natural)",
    "Microsoft Guy Online (Natural)",
    "Microsoft Aria Online (Natural)",
    "Microsoft Jenny Online (Natural)",
    "Microsoft Ryan Online (Natural)",
    "Microsoft Eric Online (Natural)",
    // Google Chrome Natural
    "Google UK English Male",
    "Google UK English Female",
    "Google US English",
    "Google English",
    // Apple macOS / iOS Natural
    "Daniel (Enhanced)",
    "Samantha (Enhanced)",
    "Alex",
    "Fred",
    // Local Windows English
    "Microsoft David Desktop",
    "Microsoft Mark Desktop",
    "Microsoft David",
    "Microsoft Mark",
  ];

  for (const prefName of preferredVoiceNames) {
    const match = voices.find((v) =>
      v.name.toLowerCase().includes(prefName.toLowerCase()),
    );
    if (match) return match;
  }

  // Fallback 1: English (IN) or English (GB) or English (US)
  const englishVoice = voices.find(
    (v) =>
      v.lang.startsWith("en-") ||
      v.lang === "en" ||
      v.name.toLowerCase().includes("english"),
  );
  if (englishVoice) return englishVoice;

  // Fallback 2: Default voice
  return voices.find((v) => v.default) || voices[0];
}
