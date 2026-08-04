/**
 * Splits the decision log into entries.
 *
 * Every entry is `## NNN, Title` followed by an italic date. Anything not
 * matching that shape is left in the preamble rather than guessed at, so a
 * malformed entry shows up as missing instead of as a mangled card.
 */

export interface Decision {
  number: string;
  title: string;
  date: string;
  body: string;
  /** First sentence of the reasoning, for the cards on the landing page. */
  summary: string;
}

/** Strips inline markup so a card can show plain text. */
function plain(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_]/g, "")
    .trim();
}

export function parseDecisions(markdown: string): { preamble: string; decisions: Decision[] } {
  const parts = markdown.split(/^##\s+(\d+),\s*(.+)$/m);
  const preamble = (parts[0] ?? "")
    .replace(/^#\s+.*$/m, "")
    // A note about the file's own layout is for whoever edits it, not for a
    // reader who will never see the file.
    .replace(/^Format:.*$/m, "")
    .replace(/^---\s*$/m, "")
    .trim();

  const decisions: Decision[] = [];
  for (let i = 1; i < parts.length; i += 3) {
    const number = parts[i] as string;
    const title = (parts[i + 1] as string).trim();
    let body = (parts[i + 2] ?? "").replace(/\n---\s*$/, "").trim();
    let date = "";

    const first = body.split("\n")[0] ?? "";
    const dateMatch = /^\*([^*]+)\*\s*$/.exec(first);
    if (dateMatch) {
      date = (dateMatch[1] as string).trim();
      body = body.split("\n").slice(1).join("\n").trim();
    }

    const reasoning = /\*\*Reasoning\.\*\*\s*([\s\S]*?)(?:\n\n|$)/.exec(body);
    const source = plain(reasoning?.[1] ?? body);
    const sentences = source.split(/(?<=\.)\s+/).slice(0, 2).join(" ");

    decisions.push({ number, title, date, body, summary: sentences });
  }

  return { preamble, decisions };
}
