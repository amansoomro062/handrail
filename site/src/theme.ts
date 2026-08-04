/**
 * The site's visual identity and layout system.
 *
 * A site about accessibility has to be accessible itself, so this file is also
 * where those guarantees live: a skip link, real landmarks, focus that is
 * always visible at 3:1 against its surroundings, text at 4.5:1, status
 * conveyed by shape and word as well as colour, and motion that respects
 * prefers-reduced-motion.
 *
 * Safety yellow is the colour of real handrails and tactile paving, which is
 * where the name comes from. It is used for structure and emphasis only, never
 * to carry meaning on its own, because a colour nobody can distinguish is not
 * information.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * One stylesheet, shared by the public site and the private maintainer reports.
 * A report is the first thing a maintainer sees, so it should not look like a
 * lesser artefact than the page their score eventually appears on.
 */
export const CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "theme.css"),
  "utf8",
);

function nav(base: string): string {
  return `
<header class="masthead">
  <div class="shell masthead__inner">
    <a class="brand" href="${base}index.html">Handrail</a>
    <button type="button" class="themetoggle" data-theme-toggle aria-pressed="false">
      <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <span class="themetoggle__label">Dark</span>
    </button>
    <nav aria-label="Primary">
      <a href="${base}results.html">Results</a>
      <a href="https://github.com/amansoomro062/handrail/blob/main/docs/ADAPTERS.md">Add a library</a>
      <a href="https://github.com/amansoomro062/handrail/blob/main/docs/DECISIONS.md">Method</a>
      <a href="https://github.com/amansoomro062/handrail">GitHub</a>
    </nav>
  </div>
</header>`;
}

function foot(base: string): string {
  return `
<footer class="foot">
  <div class="shell">
    <div class="foot__grid">
      <div>
        <p class="foot__h">Handrail</p>
        <p style="font-size:0.9rem;color:var(--ink-2);margin:0;max-width:34ch">
          Continuous accessibility conformance testing for UI component libraries,
          measured against the W3C's own specification.
        </p>
      </div>
      <nav aria-label="Results">
        <p class="foot__h">Results</p>
        <a href="${base}results.html">Every library and component</a>
        <a href="${base}api/index.json">Machine-readable index</a>
      </nav>
      <nav aria-label="Method">
        <p class="foot__h">Method</p>
        <a href="https://github.com/amansoomro062/handrail/blob/main/docs/SCORING.md">How scoring works</a>
        <a href="https://github.com/amansoomro062/handrail/blob/main/docs/DECISIONS.md">Decision log</a>
        <a href="https://github.com/amansoomro062/handrail/blob/main/docs/HARNESS-PROTOCOL.md">Harness protocol</a>
      </nav>
      <nav aria-label="Contribute">
        <p class="foot__h">Contribute</p>
        <a href="https://github.com/amansoomro062/handrail/blob/main/docs/ADAPTERS.md">Write an adapter</a>
        <a href="https://github.com/amansoomro062/handrail">Source on GitHub</a>
      </nav>
    </div>
    <div class="foot__legal">
      Every score names an exact version and links to the clause it is measured against.
      Raw results are published as JSON beside each page. MIT licensed.
    </div>
  </div>
</footer>`;
}

export function layout(
  title: string,
  body: string,
  options: { description?: string; crumb?: string; base?: string } = {},
): string {
  const { description, crumb, base = "" } = options;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${description ? `<meta name="description" content="${description}">` : ""}
<meta name="color-scheme" content="light dark">
<script>
(function () {
  var saved = null;
  try { saved = localStorage.getItem("handrail-theme"); } catch (e) {}
  document.documentElement.setAttribute("data-theme", saved === "dark" ? "dark" : "light");
})();
</script>
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${nav(base)}
<main id="main">
  <div class="shell">
    ${crumb ? `<nav class="crumb" aria-label="Breadcrumb">${crumb}</nav>` : ""}
${body}
  </div>
</main>
${foot(base)}
<script>
(function () {
  var root = document.documentElement;
  var buttons = document.querySelectorAll("[data-theme-toggle]");
  function apply(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("handrail-theme", theme); } catch (e) {}
    buttons.forEach(function (b) {
      var dark = theme === "dark";
      b.setAttribute("aria-pressed", String(dark));
      // The label names the current theme; the accessible name says what
      // pressing it will do, which is what a screen reader user needs.
      b.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      var label = b.querySelector(".themetoggle__label");
      if (label) label.textContent = dark ? "Light" : "Dark";
    });
  }
  apply(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  });
})();
</script>
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
