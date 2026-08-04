/**
 * The front page.
 *
 * Every number on it is computed from the results rather than written down, so
 * it cannot drift from what the index actually says. If a library is added or a
 * score moves, this page moves with it.
 */

import { scoreRun, type RunResult } from "@handrail/report";
import { escapeHtml } from "./theme.js";

export interface LandingTarget {
  id: string;
  name: string;
  homepage?: string;
  role: string;
  status: string;
  unverified?: Record<string, string>;
}

export interface LandingInput {
  targets: LandingTarget[];
  results: Map<string, Map<string, RunResult>>;
  componentOrder: string[];
  specTitles: Record<string, string>;
  ceiling: string;
}

interface Finding {
  target: string;
  component: string;
  assertionId: string;
  severity: string;
  detail: string;
}

export function landing(input: LandingInput): string {
  const { targets, results, componentOrder, ceiling } = input;
  const published = targets.filter((t) => t.status === "published");

  /* Everything below is derived, never asserted. */
  let checksRun = 0;
  let componentsMeasured = 0;
  const findings: Finding[] = [];
  const byAssertion = new Map<string, string[]>();

  for (const target of published) {
    const perComponent = results.get(target.id);
    if (!perComponent) continue;
    for (const [component, result] of perComponent) {
      componentsMeasured += 1;
      checksRun += result.assertions.length;
      if (target.unverified?.[component]) continue;
      for (const a of result.assertions) {
        if (a.status !== "fail") continue;
        findings.push({
          target: target.name,
          component,
          assertionId: a.id,
          severity: a.severity,
          detail: a.detail ?? "",
        });
        byAssertion.set(a.id, [...(byAssertion.get(a.id) ?? []), target.name]);
      }
    }
  }

  // An assertion several libraries fail the same way is one fact about the
  // ecosystem, not several facts about libraries. Those are worth surfacing.
  const shared = [...byAssertion.entries()]
    .filter(([, libs]) => libs.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  const perfect = published.filter((t) => {
    const perComponent = results.get(t.id);
    if (!perComponent) return false;
    return [...perComponent].every(([component, result]) => {
      if (t.unverified?.[component]) return false;
      const s = scoreRun(result);
      return s.value === null || s.value === 100;
    });
  });

  const summaryRow = (t: LandingTarget) => {
    const perComponent = results.get(t.id);
    const cells = componentOrder.map((component) => {
      const result = perComponent?.get(component);
      if (!result) return `<td><span class="na mono">not run</span></td>`;
      const s = scoreRun(result);
      if (t.unverified?.[component]) {
        return `<td><a href="results.html"><span class="cell na"><b>${s.value === null ? "n/a" : Math.floor(s.value) + "%"}</b><small>unverified</small></span></a></td>`;
      }
      if (s.value === null) {
        return `<td><a href="results.html"><span class="cell na"><b>n/a</b><small>not shipped</small></span></a></td>`;
      }
      const cls = s.value === 100 ? "ok" : "bad";
      return `<td><a href="${t.id}/${component}.html"><span class="cell ${cls}"><b>${Math.floor(s.value)}%</b></span></a></td>`;
    });
    const control = t.role === "control" ? ` <span class="pill pill--control">control</span>` : "";
    return `<tr><td>${escapeHtml(t.name)}${control}</td>${cells.join("")}</tr>`;
  };

  return `
<header class="hero">
  <p class="eyebrow">Accessibility conformance testing</p>
  <h1>Which component library<br>actually works by keyboard?</h1>
  <p class="lede">
    Handrail runs ${published.length} component libraries against the W3C's own accessibility
    specification and publishes what it finds. ${checksRun.toLocaleString()} checks across
    ${componentsMeasured} components, every one citing the clause it measures.
  </p>
  <p class="hero__cta">
    <a class="button" href="results.html">See the results</a>
    <a class="button button--quiet" href="https://github.com/amansoomro062/handrail">Source and method</a>
  </p>
</header>

<section>
  <h2>You are choosing on vibes</h2>
  <p>
    Almost nobody builds a dialog from scratch. You install a component library and use its
    dialog, and a handful of libraries end up underneath a very large amount of the web.
  </p>
  <p>
    Nobody can currently tell you whether that library's combobox is operable by keyboard,
    whether its dialog traps focus correctly, or whether last week's upgrade quietly broke
    either. Those things are invisible to anyone using a mouse, which is why they survive for
    years.
  </p>
</section>

<section>
  <h2>What we found</h2>
  <div class="scroll-x">
    <table>
      <thead><tr><th>Library</th>${componentOrder.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
      <tbody>${published.map(summaryRow).join("\n")}</tbody>
    </table>
  </div>
  <p class="footnote">
    ${perfect.length} of ${published.length} libraries pass every check we run.
    <a href="results.html">Every check, and the clause behind it</a>.
  </p>

  ${
    shared.length > 0
      ? `<h3>The same gap, in several libraries</h3>
  <p>
    When more than one library fails the same check in the same way, that is one fact about the
    ecosystem rather than several facts about libraries.
  </p>
  <ul class="clean">
    ${shared
      .slice(0, 3)
      .map(
        ([assertionId, libs]) =>
          `<li><code>${escapeHtml(assertionId)}</code> fails in <strong>${libs.length} libraries</strong>: ${libs
            .map((l) => escapeHtml(l))
            .join(", ")}.</li>`,
      )
      .join("\n    ")}
  </ul>`
      : ""
  }
</section>

<section>
  <h2>How it works</h2>
  <div class="steps">
    <div class="step">
      <p class="step__n">Every library introduces itself the same way</p>
      <p>
        A dialog is written differently in every library, so no single test can drive them all.
        Instead each library gets a small adapter, about fifty lines, that mounts its components
        into a fixed harness at a fixed address. The runner visits that address and never learns
        which library it is testing.
      </p>
    </div>
    <div class="step">
      <p class="step__n">Every check cites the specification</p>
      <p>
        Each one points at a clause of the W3C ARIA Authoring Practices Guide or a WCAG success
        criterion. Disagree with a result and you are disagreeing with the standards body, not
        with us. Checks that cannot cite a clause do not ship.
      </p>
    </div>
    <div class="step">
      <p class="step__n">The tests are tested</p>
      <p>
        A known-good library is measured first, and if it fails a check we assume the check is
        wrong. A deliberately broken component is measured too, so the rate of missed defects is
        a number rather than a hope. Everything runs repeatedly and is discarded if the answer
        changes.
      </p>
    </div>
  </div>
</section>

<section>
  <h2>Before anything is published</h2>
  <p>
    Every maintainer gets their results privately, fourteen days ahead, with the exact code used
    to test them so they can tell us we did it wrong. If they ship a fix before we publish, we
    publish the fixed score. Results that have not been confirmed by hand are labelled and carry
    no badge.
  </p>
  <div class="note">
    <strong>What this cannot tell you</strong>
    <p>${escapeHtml(ceiling)}</p>
  </div>
</section>

<section>
  <h2>Add your library</h2>
  <p>
    An adapter is about fifty lines and needs no knowledge of the test engine. If you maintain a
    library and want it measured, or think we measured it wrongly, that is the most useful thing
    you can send.
  </p>
  <p>
    <a class="button" href="https://github.com/amansoomro062/handrail/blob/main/docs/ADAPTERS.md">Write an adapter</a>
    <a class="button button--quiet" href="https://github.com/amansoomro062/handrail/blob/main/docs/DECISIONS.md">Read the decision log</a>
  </p>
</section>
`;
}
