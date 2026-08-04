/**
 * The front page.
 *
 * Every number is computed from the results rather than written down, so the
 * page cannot drift from what the index actually says.
 */

import { displayScore, scoreRun, type RunResult } from "@handrail/report";
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
  ceiling: string;
}

interface Row {
  target: LandingTarget;
  overall: number | null;
  passed: number;
  failed: number;
  unverifiedCount: number;
}

export function landing(input: LandingInput): string {
  const { targets, results, componentOrder, ceiling } = input;
  const published = targets.filter((t) => t.status === "published");

  let checksRun = 0;
  let componentsMeasured = 0;
  let findings = 0;
  const byAssertion = new Map<string, string[]>();
  const rows: Row[] = [];

  for (const target of published) {
    const perComponent = results.get(target.id);
    if (!perComponent) continue;
    let passed = 0;
    let failed = 0;
    let unverifiedCount = 0;
    let weighted = 0;
    let counted = 0;

    for (const [component, result] of perComponent) {
      componentsMeasured += 1;
      checksRun += result.assertions.length;
      if (target.unverified?.[component]) {
        unverifiedCount += 1;
        continue;
      }
      const s = scoreRun(result);
      if (s.value !== null) {
        weighted += s.value;
        counted += 1;
      }
      passed += s.counts.pass;
      failed += s.counts.fail;
      for (const a of result.assertions) {
        if (a.status !== "fail") continue;
        findings += 1;
        byAssertion.set(a.id, [...(byAssertion.get(a.id) ?? []), target.name]);
      }
    }
    rows.push({
      target,
      overall: counted > 0 ? weighted / counted : null,
      passed,
      failed,
      unverifiedCount,
    });
  }

  rows.sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));

  const shared = [...byAssertion.entries()]
    .filter(([, libs]) => libs.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  const clean = rows.filter((r) => r.failed === 0 && r.overall !== null).length;

  const boardRow = (r: Row) => {
    const pct = r.overall ?? 0;
    const isClean = r.failed === 0;
    const fillClass = r.overall === null ? "meter__fill--na" : isClean ? "" : "meter__fill--part";
    const label =
      r.overall === null
        ? "not scored"
        : `${displayScore(r.overall)}, ${r.failed === 0 ? "no failures" : `${r.failed} failing check${r.failed === 1 ? "" : "s"}`}`;
    // Decision 006: a library-level aggregate is never shown on its own. The
    // failing-check count sits beside it, because an average across components
    // can look healthy while one component is unusable.
    const sub = isClean
      ? `${r.passed} checks, none failing`
      : `${r.failed} failing check${r.failed === 1 ? "" : "s"}`;
    return `
      <div class="board__row">
        <span class="board__name">
          <a href="./results.html">${escapeHtml(r.target.name)}</a>
          <span class="board__sub ${isClean ? "" : "board__sub--fail"}">${sub}</span>
        </span>
        <span class="meter" role="img" aria-label="${escapeHtml(r.target.name)}: ${label}">
          <span class="meter__fill ${fillClass}" style="width:${Math.max(2, pct)}%"></span>
        </span>
        <span class="board__score">${r.overall === null ? "n/a" : displayScore(r.overall)}</span>
      </div>`;
  };

  return `
<section class="hero" aria-labelledby="hero-h">
  <div class="hero__grid">
    <div>
      <p class="eyebrow">Accessibility conformance testing</p>
      <h1 id="hero-h">Does your component library actually work by keyboard?</h1>
      <p class="lede">
        Handrail measures ${published.length} React component libraries against the W3C's own
        accessibility specification and publishes every result, with the clause behind it.
      </p>
      <div class="btn-row">
        <a class="btn" href="./results.html">See all results</a>
        <a class="btn btn--ghost" href="https://github.com/amansoomro062/handrail">Read the method</a>
      </div>
    </div>

    <div class="board">
      <div class="board__head">
        <span>Conformance by library</span>
        <span>${componentOrder.length} components each</span>
      </div>
      ${rows.map(boardRow).join("")}
    </div>
  </div>
</section>

<section aria-labelledby="stats-h">
  <h2 id="stats-h" class="section-head">Measured, not asserted</h2>
  <div class="stats">
    <div class="stat"><span class="stat__n">${published.length}</span><span class="stat__l">libraries measured</span></div>
    <div class="stat"><span class="stat__n">${componentsMeasured}</span><span class="stat__l">components tested</span></div>
    <div class="stat"><span class="stat__n">${checksRun.toLocaleString("en-GB")}</span><span class="stat__l">checks run</span></div>
    <div class="stat"><span class="stat__n">${findings}</span><span class="stat__l">confirmed failures</span></div>
    <div class="stat"><span class="stat__n">${clean}</span><span class="stat__l">libraries with none</span></div>
  </div>
</section>

<section class="prose" aria-labelledby="why-h">
  <div class="section-head">
    <h2 id="why-h">You are choosing on vibes</h2>
  </div>
  <div class="grid-3">
    <div class="card">
      <span class="card__mark" aria-hidden="true"></span>
      <h3>Nobody checks the parts</h3>
      <p>
        Almost nobody builds a dialog from scratch. You install a library and use its dialog, and
        a handful of libraries sit underneath a very large amount of the web.
      </p>
    </div>
    <div class="card">
      <span class="card__mark" aria-hidden="true"></span>
      <h3>The failures are invisible</h3>
      <p>
        Whether a combobox is operable by keyboard, or a dialog holds focus, looks identical to
        anyone using a mouse. That is why these defects survive for years.
      </p>
    </div>
    <div class="card">
      <span class="card__mark" aria-hidden="true"></span>
      <h3>Fixing one part fixes thousands of apps</h3>
      <p>
        Testing individual websites is retail. Testing the libraries they are built from is
        wholesale, including the apps whose teams will never run an audit.
      </p>
    </div>
  </div>
</section>

${
  shared.length > 0
    ? `<section class="prose" aria-labelledby="shared-h">
  <div class="section-head">
    <h2 id="shared-h">The same gap, in more than one library</h2>
    <p>
      When several libraries fail the same check the same way, that is one fact about the
      ecosystem rather than several facts about libraries.
    </p>
  </div>
  <ul class="clean">
    ${shared
      .slice(0, 4)
      .map(
        ([id, libs]) =>
          `<li><code>${escapeHtml(id)}</code> fails in <strong>${libs.length}</strong>: ${libs.map(escapeHtml).join(", ")}</li>`,
      )
      .join("\n    ")}
  </ul>
</section>`
    : ""
}

<section class="prose" aria-labelledby="how-h">
  <div class="section-head">
    <h2 id="how-h">How it works</h2>
    <p>
      Three things make a result worth publishing: it measures the same thing everywhere, it
      cites a specification, and it has been checked for being wrong.
    </p>
  </div>
  <div class="grid-3">
    <div class="card">
      <span class="card__mark" aria-hidden="true"></span>
      <h3>Every library introduces itself the same way</h3>
      <p>
        A dialog is written differently in every library, so no single test can drive them all.
        Each library gets a small adapter that mounts its components into a fixed harness. The
        runner never learns which library it is testing.
      </p>
    </div>
    <div class="card">
      <span class="card__mark" aria-hidden="true"></span>
      <h3>Every check cites a clause</h3>
      <p>
        Each one points at the W3C ARIA Authoring Practices Guide or a WCAG success criterion.
        Disagree with a result and you are disagreeing with the standards body. Checks that
        cannot cite a clause do not ship.
      </p>
    </div>
    <div class="card">
      <span class="card__mark" aria-hidden="true"></span>
      <h3>The tests are tested</h3>
      <p>
        A known-good library is measured first, and a failure there is assumed to be our bug. A
        deliberately broken component is measured too, so missed defects are a number rather
        than a hope. Everything runs repeatedly and is discarded if the answer changes.
      </p>
    </div>
  </div>
</section>

<section class="prose" aria-labelledby="fair-h">
  <div class="section-head"><h2 id="fair-h">Nobody gets ambushed</h2></div>
  <p>
    Every maintainer receives their results privately, fourteen days before publication, with the
    exact adapter used to test them so they can tell us we measured it wrongly. If they ship a fix
    first, we publish the fixed score. Results not yet confirmed by hand are labelled and carry no
    badge.
  </p>
  <div class="note">
    <p class="note__t">What this cannot tell you</p>
    <p>${escapeHtml(ceiling)}</p>
  </div>
</section>

<section class="prose" aria-labelledby="add-h">
  <div class="section-head">
    <h2 id="add-h">Add your library</h2>
    <p>
      An adapter is about fifty lines and needs no knowledge of the test engine. If you maintain a
      library and want it measured, or think we measured it wrongly, that is the most useful thing
      you can send.
    </p>
  </div>
  <div class="btn-row" style="margin-top:0">
    <a class="btn" href="https://github.com/amansoomro062/handrail/blob/main/docs/ADAPTERS.md">Write an adapter</a>
    <a class="btn btn--ghost" href="https://github.com/amansoomro062/handrail/blob/main/docs/DECISIONS.md">Read the decision log</a>
  </div>
</section>
`;
}
