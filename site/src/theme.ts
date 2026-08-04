/**
 * The site's visual identity, in one place.
 *
 * Safety yellow is the colour of real handrails and tactile paving, which is
 * where the name comes from. Signage sans for headings, a textbook serif for
 * prose, mono for anything a reader might need to copy or compare. Semantic
 * colours for pass and fail are deliberately separate from the accent, so a
 * score never reads as decoration.
 */
export const CSS = `
:root {
  --paper: #F4F5F2;
  --surface: #FFFFFF;
  --ink: #1A1D1A;
  --ink-soft: #4A5148;
  --sage: #6B7269;
  --rule: #D9DCD5;
  --safety: #E0AC00;
  --safety-deep: #A87F00;
  --pass: #2E7150;
  --fail: #B4462F;
  --warn: #B07A16;
  --sans: "Avenir Next", "Helvetica Neue", "Segoe UI", system-ui, sans-serif;
  --serif: "Iowan Old Style", "Charter", "Palatino Linotype", Georgia, serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #14160F; --surface: #1C1F18; --ink: #ECEFE4; --ink-soft: #AFB6A6;
    --sage: #8C9484; --rule: #2E3329; --safety: #F5C233; --safety-deep: #F5C233;
    --pass: #5FBF8D; --fail: #E08063; --warn: #E0B25A;
  }
}
:root[data-theme="dark"] {
  --paper: #14160F; --surface: #1C1F18; --ink: #ECEFE4; --ink-soft: #AFB6A6;
  --sage: #8C9484; --rule: #2E3329; --safety: #F5C233; --safety-deep: #F5C233;
  --pass: #5FBF8D; --fail: #E08063; --warn: #E0B25A;
}
:root[data-theme="light"] {
  --paper: #F4F5F2; --surface: #FFFFFF; --ink: #1A1D1A; --ink-soft: #4A5148;
  --sage: #6B7269; --rule: #D9DCD5; --safety: #E0AC00; --safety-deep: #A87F00;
  --pass: #2E7150; --fail: #B4462F; --warn: #B07A16;
}

* { box-sizing: border-box; }
body {
  margin: 0; background: var(--paper); color: var(--ink);
  font-family: var(--serif); font-size: 1.0625rem; line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 1120px; margin: 0 auto; padding: 0 clamp(1rem, 4vw, 2.5rem) 5rem; }
a { color: inherit; text-decoration-color: var(--safety); text-underline-offset: 3px; }
a:focus-visible, button:focus-visible {
  outline: 3px solid var(--safety); outline-offset: 2px; border-radius: 2px;
}

h1, h2, h3, .eyebrow, th { font-family: var(--sans); }
h1 { font-size: clamp(2.2rem, 6vw, 3.2rem); line-height: 1; letter-spacing: -0.025em; margin: 0 0 1rem; font-weight: 700; }
h2 { font-size: 1.6rem; letter-spacing: -0.015em; margin: 3rem 0 0.8rem; font-weight: 700; text-wrap: balance; }
h3 { font-size: 1.15rem; margin: 2rem 0 0.5rem; font-weight: 600; }
p { margin: 0 0 1rem; max-width: 66ch; }
.eyebrow {
  font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.16em;
  font-weight: 600; color: var(--safety-deep); margin: 0 0 0.5rem;
}
.lede { font-size: 1.25rem; line-height: 1.45; color: var(--ink-soft); max-width: 60ch; }
code, .mono { font-family: var(--mono); font-size: 0.86em; }

header.masthead { padding: 3rem 0 1.5rem; border-bottom: 3px solid var(--safety); margin-bottom: 2rem; }
.crumb { font-family: var(--mono); font-size: 0.8rem; color: var(--sage); margin-bottom: 1rem; }

.scroll-x { overflow-x: auto; margin: 1.5rem 0; }
table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
th, td { border: 1px solid var(--rule); padding: 0.55rem 0.7rem; text-align: center; }
th {
  font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.09em;
  font-weight: 600; color: var(--ink-soft); background: var(--surface);
}
td:first-child, th:first-child { text-align: left; white-space: nowrap; }
tbody tr:hover td { background: color-mix(in oklab, var(--safety) 7%, transparent); }

.cell { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; font-family: var(--mono); }
.cell b { font-size: 0.95rem; font-weight: 600; }
.cell small { font-size: 0.66rem; letter-spacing: 0.04em; }
.ok { color: var(--pass); }
.bad { color: var(--fail); }
.na { color: var(--sage); }
.blockers { color: var(--fail); font-weight: 600; }

.pill {
  display: inline-block; font-family: var(--sans); font-size: 0.68rem;
  text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;
  padding: 0.15rem 0.45rem; border: 1px solid currentColor; border-radius: 2px;
}
.pill--draft { color: var(--warn); }
.pill--control { color: var(--sage); }

.note {
  border-left: 4px solid var(--safety);
  background: color-mix(in oklab, var(--safety) 9%, transparent);
  padding: 1rem 1.1rem; margin: 1.5rem 0;
}
.note--warn { border-left-color: var(--warn); background: color-mix(in oklab, var(--warn) 10%, transparent); }
.note p:last-child { margin-bottom: 0; }
.note strong { font-family: var(--sans); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.35rem; }

.assertion {
  border: 1px solid var(--rule); background: var(--surface);
  margin-bottom: 0.6rem; overflow: hidden;
}
.assertion__head {
  display: flex; align-items: baseline; gap: 0.7rem; flex-wrap: wrap;
  padding: 0.6rem 0.85rem;
}
.assertion--fail .assertion__head { background: color-mix(in oklab, var(--fail) 9%, transparent); }
.assertion__status {
  font-family: var(--sans); font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; min-width: 3.6rem;
}
.assertion__id { font-family: var(--mono); font-size: 0.84rem; }
.assertion__sev { font-family: var(--mono); font-size: 0.72rem; color: var(--sage); margin-left: auto; }
.assertion__body { padding: 0.7rem 0.85rem; border-top: 1px dashed var(--rule); font-size: 0.95rem; }
.kv { display: grid; grid-template-columns: 5.5rem 1fr; gap: 0.2rem 0.7rem; font-family: var(--mono); font-size: 0.82rem; margin-top: 0.5rem; }
.kv dt { color: var(--sage); }
.kv dd { margin: 0; word-break: break-word; }

.meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1px; background: var(--rule); border: 1px solid var(--rule); margin: 1.5rem 0; }
.meta-grid > div { background: var(--surface); padding: 0.7rem 0.85rem; }
.meta-grid dt { font-family: var(--sans); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sage); margin-bottom: 0.2rem; }
.meta-grid dd { margin: 0; font-family: var(--mono); font-size: 0.82rem; word-break: break-word; }

footer { border-top: 1px solid var(--rule); margin-top: 4rem; padding-top: 1.5rem; font-family: var(--mono); font-size: 0.8rem; color: var(--sage); }
ul.clean { list-style: none; padding: 0; max-width: 66ch; }
ul.clean li { padding-left: 1.4rem; position: relative; margin-bottom: 0.5rem; }
ul.clean li::before { content: ""; position: absolute; left: 0; top: 0.6em; width: 7px; height: 7px; background: var(--safety); }
`;

export function layout(title: string, body: string, crumb?: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
${crumb ? `<div class="crumb">${crumb}</div>` : ""}
${body}
<footer>
Handrail. Accessibility conformance testing for UI component libraries.<br>
Every score names an exact version and links to the clause it is measured against.
Raw results are published as JSON beside each page.
</footer>
</div>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
