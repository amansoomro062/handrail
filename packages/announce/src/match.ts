/**
 * Matching spoken phrases against expectations.
 *
 * Pure functions, because this is the part of the instrument that decides
 * pass or fail and therefore the part that must be testable without a screen
 * reader running.
 */

/** Case-insensitive containment, with whitespace collapsed on both sides. */
function contains(phrase: string, needle: string): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return clean(phrase).includes(clean(needle));
}

/**
 * A check passes when every needle is heard somewhere in the step's phrases.
 * The needles may land in one phrase or across several: VoiceOver splits or
 * merges announcements differently between versions, and where the split
 * falls is not the library's doing.
 */
export function matchCheck(
  phrases: string[],
  mustHear: string[],
): { ok: boolean; heard?: string } {
  const missing = mustHear.filter((needle) => !phrases.some((p) => contains(p, needle)));
  if (missing.length > 0) return { ok: false };
  // Report the phrase carrying the first needle, as the representative quote.
  const first = mustHear[0];
  const heard = first === undefined ? phrases[0] : phrases.find((p) => contains(p, first));
  return { ok: true, ...(heard !== undefined ? { heard } : {}) };
}
