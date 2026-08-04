/**
 * The Markdown renderer that generates most of the site.
 *
 * Every page except the landing and the results index is produced from a file
 * in docs/. A renderer bug is therefore a site-wide content bug, and the kind
 * that looks fine in a diff: swallowed prose, an unclosed list, a link that
 * turned into text. These check the cases the docs actually contain.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown, slug } from "../src/index.js";

/* ------------------------------------------------------------------ *
 * Inline
 * ------------------------------------------------------------------ */

test("a code span survives a number elsewhere in the line", () => {
  // Spans are swapped out for sentinels while the rest is formatted. If the
  // sentinel were a bare number, prose like "14 days" would match on the way
  // back and swallow the words around it.
  const html = renderMarkdown("Maintainers get `14` days, and 14 is the number.");
  assert.match(html, /<code>14<\/code>/);
  assert.match(html, /and 14 is the number/);
  assert.doesNotMatch(html, /undefined/);
});

test("markup inside a code span is not treated as markup", () => {
  const html = renderMarkdown("Use `a * b` and `snake_case_name` verbatim.");
  assert.match(html, /<code>a \* b<\/code>/);
  assert.match(html, /<code>snake_case_name<\/code>/);
  assert.doesNotMatch(html, /<em>/);
});

test("html in the source is escaped rather than emitted", () => {
  const html = renderMarkdown("A <script>alert(1)</script> tag and `<div>`.");
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<code>&lt;div&gt;<\/code>/);
});

test("bold, italic and links render", () => {
  const html = renderMarkdown("**Decision.** See _the log_ at [APG](https://w3.org/apg).");
  assert.match(html, /<strong>Decision\.<\/strong>/);
  assert.match(html, /<em>the log<\/em>/);
  assert.match(html, /<a href="https:\/\/w3\.org\/apg" rel="noopener">APG<\/a>/);
});

test("an internal link gets no rel, an external one does", () => {
  assert.doesNotMatch(renderMarkdown("[x](DECISIONS.md)"), /rel=/);
  assert.match(renderMarkdown("[x](https://example.com)"), /rel="noopener"/);
});

/* ------------------------------------------------------------------ *
 * Blocks
 * ------------------------------------------------------------------ */

test("headings are demoted and given ids", () => {
  const html = renderMarkdown("## How scoring works", { demote: 1 });
  assert.match(html, /<h3 id="how-scoring-works">How scoring works<\/h3>/);
});

test("the document title can be dropped so the page can state its own", () => {
  const html = renderMarkdown("# Decision log\n\n## 001, A thing", { dropTitle: true });
  assert.doesNotMatch(html, /<h1/);
  assert.match(html, /001, A thing/);
});

test("a fenced code block is escaped and never reformatted", () => {
  const html = renderMarkdown("```bash\npnpm run --filter x\n**not bold**\n```");
  assert.match(html, /<pre data-lang="bash"><code>/);
  assert.match(html, /\*\*not bold\*\*/);
  assert.doesNotMatch(html, /<strong>/);
});

test("lists close before the next block opens", () => {
  const html = renderMarkdown("- one\n- two\n\nAfter.");
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(html, /<p>After\.<\/p>/);
});

test("ordered and unordered lists do not merge into one another", () => {
  const html = renderMarkdown("- bullet\n\n1. first\n2. second");
  assert.match(html, /<ul><li>bullet<\/li><\/ul>/);
  assert.match(html, /<ol><li>first<\/li><li>second<\/li><\/ol>/);
});

test("a wrapped list item keeps its continuation", () => {
  const html = renderMarkdown("- a claim that runs on\n  and continues here\n- second");
  assert.match(html, /<li>a claim that runs on and continues here<\/li>/);
  assert.match(html, /<li>second<\/li>/);
});

test("a table gets a row header and column scopes", () => {
  const html = renderMarkdown("| Library | Findings |\n| --- | --- |\n| MUI | 5 |");
  assert.match(html, /<th scope="col">Library<\/th>/);
  assert.match(html, /<th scope="row">MUI<\/th>/);
  assert.match(html, /<td>5<\/td>/);
  // Wide content must scroll inside its own container, never the page body.
  assert.match(html, /<div class="tablewrap">/);
});

test("a pipe outside a table is not a table", () => {
  const html = renderMarkdown("Run `a | b` in a shell.");
  assert.doesNotMatch(html, /<table>/);
});

test("paragraphs, rules and quotes render", () => {
  const html = renderMarkdown("First para.\n\n---\n\n> A quotation.");
  assert.match(html, /<p>First para\.<\/p>/);
  assert.match(html, /<hr class="rule">/);
  assert.match(html, /<blockquote><p>A quotation\.<\/p><\/blockquote>/);
});

test("consecutive lines join into one paragraph", () => {
  const html = renderMarkdown("A sentence\nwrapped across lines.");
  assert.match(html, /<p>A sentence wrapped across lines\.<\/p>/);
});

/* ------------------------------------------------------------------ *
 * Slugs
 * ------------------------------------------------------------------ */

test("slugs strip punctuation and collapse whitespace", () => {
  assert.equal(slug("012, A shared setup helper"), "012-a-shared-setup-helper");
  assert.equal(slug("What this cannot tell you"), "what-this-cannot-tell-you");
});

/* ------------------------------------------------------------------ *
 * The real documents
 * ------------------------------------------------------------------ */

test("every doc the site renders produces balanced, non-empty output", async () => {
  const { readFile } = await import("node:fs/promises");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const docs = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "docs");

  for (const name of ["DECISIONS", "SCORING", "ADAPTERS", "ARCHITECTURE", "NOTIFICATIONS"]) {
    const html = renderMarkdown(await readFile(join(docs, `${name}.md`), "utf8"), {
      demote: 1,
      dropTitle: true,
    });
    assert.ok(html.length > 200, `${name} rendered almost nothing`);
    assert.doesNotMatch(html, /undefined/, `${name} rendered undefined`);
    for (const tag of ["p", "li", "ul", "ol", "table", "pre", "code", "blockquote"]) {
      const open = (html.match(new RegExp(`<${tag}[ >]`, "g")) ?? []).length;
      const close = (html.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
      assert.equal(open, close, `${name} has unbalanced <${tag}>`);
    }
  }
});

/* ------------------------------------------------------------------ *
 * Link resolution
 * ------------------------------------------------------------------ */

test("the resolver reaches links in every block type", () => {
  // Paragraphs, list items, headings, tables and quotes each render through a
  // separate call. An earlier version threaded the resolver into only some of
  // them, so links in body copy silently kept their repo-relative target.
  const src = [
    "## A [heading link](DECISIONS.md)",
    "",
    "A paragraph with a [body link](SCORING.md).",
    "",
    "- a [list link](ADAPTERS.md)",
    "",
    "> a [quoted link](PLAN.md)",
    "",
    "| [row link](A.md) | [cell link](B.md) |",
    "| --- | --- |",
    "| [body row](C.md) | x |",
  ].join("\n");

  const html = renderMarkdown(src, { resolveLink: (h) => `/resolved/${h}` });
  const unresolved = [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1] ?? "")
    .filter((h) => !h.startsWith("/resolved/"));
  assert.deepEqual(unresolved, [], "these links never reached the resolver");
});
