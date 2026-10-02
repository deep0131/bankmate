/**
 * Parses spoken voice input into a 6-digit PIN string.
 * Supports spoken digit words ("one two three four five six"),
 * double/triple prefixes ("double one double two double three"),
 * compound numbers ("twelve thirty four fifty six", "twenty one"),
 * direct digits ("1 2 3 4 5 6", "123456"), and conversational phrases ("my pin is 123456").
 */
export function parseSpokenPin(raw: string): string | null {
  if (!raw) return null;
  let text = raw.toLowerCase().trim();

  // Normalize punctuation and spoken fillers
  text = text
    .replace(/[,.-]/g, " ")
    .replace(
      /\b(pin|code|password|passcode|number|digits?|is|my|the|it's|its)\b/g,
      " ",
    );

  // Normalize double and triple phrasing (e.g. "double one" -> "one one", "triple five" -> "five five five")
  text = text
    .replace(/\bdouble\s+([a-z0-9]+)\b/g, "$1 $1")
    .replace(/\btriple\s+([a-z0-9]+)\b/g, "$1 $1 $1");

  // Check if string contains direct consecutive 6 digits (e.g., "123456")
  const directMatch = text.match(/\b\d{6}\b/);
  if (directMatch) {
    return directMatch[0];
  }

  // Single digit units map with common STT phonetic variations
  const unitsMap: Record<string, number> = {
    zero: 0,
    oh: 0,
    o: 0,
    nil: 0,
    nought: 0,
    null: 0,
    one: 1,
    won: 1,
    two: 2,
    to: 2,
    too: 2,
    tu: 2,
    three: 3,
    tree: 3,
    tri: 3,
    four: 4,
    for: 4,
    fore: 4,
    five: 5,
    fiv: 5,
    six: 6,
    sex: 6,
    seven: 7,
    eight: 8,
    ate: 8,
    nine: 9,
  };

  // Teens map
  const teensMap: Record<string, string> = {
    ten: "10",
    eleven: "11",
    twelve: "12",
    thirteen: "13",
    fourteen: "14",
    fifteen: "15",
    sixteen: "16",
    seventeen: "17",
    eighteen: "18",
    nineteen: "19",
  };

  // Tens map
  const tensMap: Record<string, number> = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };

  const tokens = text.split(/\s+/).filter(Boolean);
  let digitAccumulator = "";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Case 1: Raw numeric string (e.g. "1", "12", "123456")
    if (/^\d+$/.test(token)) {
      digitAccumulator += token;
      continue;
    }

    // Case 2: Teens word (e.g. "twelve" -> "12")
    if (teensMap[token] !== undefined) {
      digitAccumulator += teensMap[token];
      continue;
    }

    // Case 3: Tens word (e.g. "twenty", "thirty four")
    if (tensMap[token] !== undefined) {
      const baseTen = tensMap[token];
      const nextToken = tokens[i + 1];

      // Check if next token is a unit (1-9), e.g. "thirty" + "four" = "34"
      if (
        nextToken &&
        unitsMap[nextToken] !== undefined &&
        unitsMap[nextToken] > 0
      ) {
        digitAccumulator += String(baseTen + unitsMap[nextToken]);
        i++; // Consume next token
      } else {
        digitAccumulator += String(baseTen);
      }
      continue;
    }

    // Case 4: Single unit word (e.g. "one" -> "1", "six" -> "6")
    if (unitsMap[token] !== undefined) {
      digitAccumulator += String(unitsMap[token]);
    }
  }

  // If we collected exactly 6 digits
  if (digitAccumulator.length === 6) {
    return digitAccumulator;
  }

  // If more than 6 digits were accumulated, take first 6
  if (digitAccumulator.length > 6) {
    return digitAccumulator.slice(0, 6);
  }

  return null;
}
