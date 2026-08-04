/**
 * The written pages: method, scoring, contributing, protocol, policy, and the
 * decision log.
 *
 * All of them are generated from `docs/*.md`. Nothing here restates a document
 * in different words, because two copies of the scoring rules would eventually
 * disagree and the site would be the one that was wrong. What this file adds is
 * framing: an eyebrow, a title, a sentence saying why the page exists, and a
 * link to the source so a reader can check it against the repository.
 */

import { escapeHtml } from "./theme.js";
import { renderMarkdown, slug } from "@handrail/markdown";

const REPO = "https://github.com/amansoomro062/handrail";

export interface DocPageInput {
  eyebrow: string;
  title: string;
  lede: string;
  /** Raw contents of the source document. */
  markdown: string;
  /** Repo-relative path, shown and linked so the page can be checked. */
  sourcePath: string;
  /** Optional HTML placed between the lede and the document body. */
  intro?: string;
}

/**
 * A heading list, so a long document can be scanned before it is read.
 * Built from the same markdown the body is built from, never maintained by hand.
 */
function contents(markdown: string): string {
  const items = [...markdown.matchAll(/^##\s+(.+)$/gm)]
    .map((m) => (m[1] as string).trim())
    .filter((t) => t.length > 0);
  if (items.length < 3) return "";
  return `
<nav class="toc" aria-label="On this page">
  <p class="toc__h">On this page</p>
  <ol class="toc__list">
    ${items.map((t) => `<li><a href="#${slug(t)}">${escapeHtml(t)}</a></li>`).join("\n    ")}
  </ol>
</nav>`;
}

export function docPage(input: DocPageInput): string {
  const { eyebrow, title, lede, markdown, sourcePath, intro = "" } = input;
  return `
<div class="pagehead">
  <p class="eyebrow">${escapeHtml(eyebrow)}</p>
  <h1>${escapeHtml(title)}</h1>
  <p class="lede">${escapeHtml(lede)}</p>
</div>
${intro}
${contents(markdown)}
<div class="prose">
${renderMarkdown(markdown, { dropTitle: true })}
</div>
<p class="srcnote">
  This page is generated from
  <a href="${REPO}/blob/main/${sourcePath}"><code>${escapeHtml(sourcePath)}</code></a>
  in the repository. If the two ever disagree, the repository is right.
</p>`;
}

interface Decision {
  number: string;
  title: string;
  date: string;
  body: string;
}

/**
 * Splits the log into entries.
 *
 * Every entry is `## NNN, Title` followed by an italic date. Anything that does
 * not match that shape is left in the preamble rather than guessed at, so a
 * malformed entry shows up as missing instead of as a mangled card.
 */
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
    const dateMatch = /^\*([^*]+)\*\s*$/m.exec(body.split("\n")[0] ?? "");
    if (dateMatch) {
      date = (dateMatch[1] as string).trim();
      body = body.split("\n").slice(1).join("\n").trim();
    }
    decisions.push({ number, title, date, body });
  }

  return { preamble, decisions };
}

export interface DecisionsStats {
  /** Libraries with results, counted at build time rather than written down. */
  libraries: number;
  /** Assertions across every spec. */
  assertions: number;
}

export function decisionsPage(markdown: string, stats: DecisionsStats): string {
  const { preamble, decisions } = parseDecisions(markdown);
  const newest = decisions[0]?.date ?? "";

  const entries = decisions
    .map(
      (d) => `
<article class="dec" id="decision-${d.number}">
  <div class="dec__side">
    <span class="dec__n">${escapeHtml(d.number)}</span>
    ${d.date ? `<span class="dec__date">${escapeHtml(d.date)}</span>` : ""}
  </div>
  <div class="dec__main">
    <h2 class="dec__t"><a href="#decision-${d.number}">${escapeHtml(d.title)}</a></h2>
    <div class="prose">${renderMarkdown(d.body, { demote: 2, tableCaption: d.title })}</div>
  </div>
</article>`,
    )
    .join("\n");

  return `
<div class="pagehead">
  <p class="eyebrow">Decision log</p>
  <h1>Every call we made, including the wrong ones</h1>
  <p class="lede">
    A measurement is only as good as the judgements behind it. These are all of
    ours, dated, with the reasoning that produced them and the consequence when
    the reasoning turned out to be faulty.
  </p>
</div>

<div class="stats">
  <div class="stat"><span class="stat__n">${decisions.length}</span><span class="stat__l">decisions recorded</span></div>
  <div class="stat"><span class="stat__n">${stats.libraries}</span><span class="stat__l">libraries measured</span></div>
  <div class="stat"><span class="stat__n">${stats.assertions}</span><span class="stat__l">assertions, each citing a clause</span></div>
  ${newest ? `<div class="stat"><span class="stat__n" style="font-size:1.1rem;line-height:1.6">${escapeHtml(newest)}</span><span class="stat__l">most recent entry</span></div>` : ""}
</div>

<div class="note">
  <p class="note__t">Why this page exists</p>
  <p>
    Several entries below describe a result this project got wrong: a score far
    lower than the library deserved, a defect reported where none existed, a
    check that measured its own setup rather than its subject. Each was caught
    before publication by someone reading the output rather than by the system
    noticing. Publishing them is the only honest way to claim the rest is careful.
  </p>
</div>

${preamble ? `<div class="prose prose--intro">${renderMarkdown(preamble)}</div>` : ""}

<div class="declist">
${entries}
</div>

<p class="srcnote">
  Generated from
  <a href="${REPO}/blob/main/docs/DECISIONS.md"><code>docs/DECISIONS.md</code></a>.
  Library names are withheld from entries about unpublished results until the
  maintainer has been notified.
</p>`;
}
