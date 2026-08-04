/**
 * Builds the public index from results/*.json.
 *
 * Three rules this generator enforces, because they are easier to keep in code
 * than in a reviewer's head:
 *
 *  1. A target whose status is not `published` never appears in the main table.
 *     Drafts are listed separately and labelled, so an unverified number can
 *     never be mistaken for a finding.
 *  2. A result that is not publishable (a harness error, or any errored
 *     assertion) is skipped entirely and reported to stdout.
 *  3. Every page states the ceiling of automated testing. Not in a footnote.
 */

import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { displayScore, isPublishable, renderBadge, scoreRun, type RunResult } from "@handrail/report";
import { getSpec, specs } from "@handrail/spec";
import { escapeHtml, layout } from "./theme.js";
import { landing } from "./landing.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const resultsDir = join(root, "results");
const outDir = join(root, "site", "dist");

const CEILING =
  "A high score means no violations were detected by automated testing. It does not mean the component is accessible. " +
  "Automated tests cannot judge whether a label is meaningful, whether a reading order makes sense, or whether the " +
  "experience is usable with a screen reader. Those need human judgement and disabled users. This is a floor, not a ceiling.";

/** Days a maintainer has with their results before anything is published. */
const NOTICE_DAYS = 14;

/**
 * May this library's results go on the site yet?
 *
 * Decision 004: nobody learns about a finding from a public page. This is
 * enforced here rather than trusted to whoever runs the build, because the
 * cost of getting it wrong is the one thing the project cannot buy back.
 */
function releasable(target: Target): { ok: boolean; reason: string } {
  if (!target.notifiedOn) {
    return { ok: false, reason: "maintainer has not been notified" };
  }
  const days = (Date.now() - Date.parse(target.notifiedOn)) / 86_400_000;
  if (days < NOTICE_DAYS) {
    return {
      ok: false,
      reason: `notified ${Math.floor(days)} of ${NOTICE_DAYS} days ago`,
    };
  }
  return { ok: true, reason: "" };
}

interface Target {
  id: string;
  name: string;
  vendor?: string;
  homepage?: string;
  role: string;
  status: string;
  notes?: string;
  /** ISO date the maintainer received their results privately, or null. */
  notifiedOn?: string | null;
  /** Components measured but not confirmed by hand, keyed by component id. */
  unverified?: Record<string, string>;
}

const COMPONENT_ORDER = ["dialog", "combobox", "menu", "tabs", "accordion"];

function scoreCell(result: RunResult | undefined, href: string, unverified = false): string {
  if (!result) return `<span class="chip chip--na"><span class="chip__dot"></span>not run</span>`;
  const s = scoreRun(result);
  if (s.value === null) {
    return `<a href="${href}" class="chip chip--na"><span class="chip__dot"></span>n/a</a>`;
  }
  if (unverified) {
    return `<a href="${href}" class="chip chip--warn"><span class="chip__dot"></span>${displayScore(s.value)} unverified</a>`;
  }
  const failing = s.counts.fail > 0;
  const cls = failing ? "chip--fail" : "chip--pass";
  const suffix = failing
    ? ` ${s.counts.fail} failing`
    : "";
  return `<a href="${href}" class="chip ${cls}"><span class="chip__dot"></span>${displayScore(s.value)}${suffix}</a>`;
}

function detailPage(target: Target, result: RunResult): string {
  const spec = getSpec(result.component);
  const s = scoreRun(result);
  const versions = Object.entries(result.target.versions)
    .map(([name, version]) => `${escapeHtml(name)}@${escapeHtml(version)}`)
    .join("<br>");

  const assertions = result.assertions
    .map((a) => {
      const statusClass = a.status === "pass" ? "chip--pass" : a.status === "fail" ? "chip--fail" : "chip--na";
      const refs: string[] = [];
      if (a.refs.apg) refs.push(`<a href="${escapeHtml(a.refs.apg)}">APG pattern</a>`);
      if (a.refs.wcag) {
        refs.push(
          a.refs.wcagUrl
            ? `<a href="${escapeHtml(a.refs.wcagUrl)}">WCAG ${escapeHtml(a.refs.wcag)}</a>`
            : `WCAG ${escapeHtml(a.refs.wcag)}`,
        );
      }
      const body =
        a.status === "fail"
          ? `<div class="check__body">
               <p style="margin:0 0 .4rem">${escapeHtml(a.detail ?? "")}</p>
               <dl class="kv">
                 <dt>expected</dt><dd>${escapeHtml(a.expected ?? "not recorded")}</dd>
                 <dt>actual</dt><dd>${escapeHtml(a.actual ?? "not recorded")}</dd>
                 <dt>why</dt><dd>${escapeHtml(spec.assertions.find((x) => x.id === a.id)?.rationale ?? "")}</dd>
                 <dt>measured</dt><dd>${refs.join(" &middot; ")}</dd>
               </dl>
             </div>`
          : a.status === "not-applicable"
            ? `<div class="check__body">${escapeHtml(a.reason ?? "")}</div>`
            : "";
      return `<div class="check ${a.status === "fail" ? "check--fail" : ""}">
        <div class="check__head">
          <span class="chip ${statusClass}"><span class="chip__dot"></span>${a.status === "not-applicable" ? "n/a" : a.status}</span>
          <span class="check__id">${escapeHtml(a.id)}</span>
          <span class="check__sev">${escapeHtml(a.severity)}</span>
        </div>${body}
      </div>`;
    })
    .join("\n");

  const body = `
<header class="pagehead">
  <p class="eyebrow">${escapeHtml(target.name)}</p>
  <h1>${escapeHtml(spec.title)}</h1>
  <p class="lede">${s.value === null ? "Not shipped by this library." : `${displayScore(s.value)}. ${s.counts.pass} of ${s.counts.pass + s.counts.fail} checks passed${s.blockersFailed ? `, including ${s.blockersFailed} blocker-level failure${s.blockersFailed === 1 ? "" : "s"}` : ""}.`}</p>
</header>

<div class="meta">
  <div><dt>Versions tested</dt><dd>${versions || "not recorded"}</dd></div>
  <div><dt>Specification</dt><dd><a href="${escapeHtml(spec.apgPattern)}">W3C APG</a><br>spec v${escapeHtml(result.specVersion)}</dd></div>
  <div><dt>Browser</dt><dd>${escapeHtml(result.environment.browser)} ${escapeHtml(result.environment.browserVersion)}</dd></div>
  <div><dt>Run</dt><dd>${escapeHtml(result.startedAt.slice(0, 10))}<br>runner ${escapeHtml(result.environment.runnerVersion)}</dd></div>
</div>

${
  result.target.notes
    ? `<div class="note"><p class="note__t">How this was mounted</p><p>${escapeHtml(result.target.notes)}</p></div>`
    : ""
}

<h2>Every check</h2>
<p>Each one cites the clause it measures. Nothing here is our opinion about accessibility.</p>
${assertions}

<h2>Reproduce this</h2>
<p>From a clone of the repository, with the versions above installed:</p>
<pre class="mono" style="background:var(--surface);border:1px solid var(--rule);padding:1rem;overflow-x:auto"><code>pnpm --filter @handrail/adapter-${escapeHtml(target.id)} run dev
pnpm handrail run --target ${escapeHtml(target.id)} --component ${escapeHtml(result.component)} \\
  --base-url http://localhost:5180 --repeat 3</code></pre>
<p><a href="../api/results/${escapeHtml(target.id)}.${escapeHtml(result.component)}.json">Raw result JSON</a> &middot; <a href="../results.html">Back to the results</a></p>

<div class="note"><p class="note__t">What this cannot tell you</p><p>${CEILING}</p></div>
`;
  return layout(`${target.name}: ${spec.title} | Handrail`, body, {
    description: `Accessibility conformance results for ${target.name}'s ${spec.title.toLowerCase()}, measured against the W3C ARIA Authoring Practices Guide.`,
    crumb: `<a href="../index.html">Handrail</a> / <a href="../results.html">Results</a> / ${escapeHtml(target.name)} / ${escapeHtml(result.component)}`,
    base: "../",
  });
}

async function main(): Promise<void> {
  const haveResults = existsSync(resultsDir);
  if (!haveResults) {
    console.log("");
    console.log("  No results on disk. Building the pre-release site from targets.json.");
  }

  const targets: Target[] = JSON.parse(await readFile(join(root, "targets.json"), "utf8")).targets;
  const files = haveResults
    ? (await readdir(resultsDir)).filter((f) => f.endsWith(".json"))
    : [];

  const byTarget = new Map<string, Map<string, RunResult>>();
  const skipped: string[] = [];

  for (const file of files) {
    const result: RunResult = JSON.parse(await readFile(join(resultsDir, file), "utf8"));
    // The fixture exists to test the runner. It is never a library.
    if (result.target.id === "_fixture-broken") continue;
    const verdict = isPublishable(result);
    if (!verdict.ok) {
      skipped.push(`${file}: ${verdict.reason}`);
      continue;
    }
    if (!byTarget.has(result.target.id)) byTarget.set(result.target.id, new Map());
    byTarget.get(result.target.id)!.set(result.component, result);
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, "api", "results"), { recursive: true });
  await mkdir(join(outDir, "api", "badge"), { recursive: true });

  const releasableTargets = targets.filter((t) => t.status === "published" && releasable(t).ok);
  // Measured-but-unreleased is a registry fact. A library stays listed as
  // withheld whether or not its result files are present locally.
  const withheld = targets.filter(
    (t) => t.status !== "planned" && !releasable(t).ok,
  );
  const published = releasableTargets;
  const drafts = targets.filter(
    (t) => t.status === "draft" && byTarget.has(t.id) && releasable(t).ok,
  );

  let pages = 0;
  let badges = 0;
  const withheldNote: string[] = [];

  const rowFor = (t: Target) => {
    const results = byTarget.get(t.id);
    const cells = COMPONENT_ORDER.map((component) => {
      const r = results?.get(component);
      return `<td>${scoreCell(r, `${t.id}/${component}.html`, Boolean(t.unverified?.[component]))}</td>`;
    }).join("");
    const label = t.role === "control" ? ` <span class="tag">control</span>` : "";
    const name = t.homepage
      ? `<a href="${escapeHtml(t.homepage)}">${escapeHtml(t.name)}</a>`
      : escapeHtml(t.name);
    return `<tr><th scope="row"><span class="libname">${name}${label}</span></th>${cells}</tr>`;
  };

  // Detail pages, raw JSON and badges for everything we have, drafts included.
  // a draft's page carries a warning rather than being hidden, so a link shared
  // anywhere still explains itself.
  for (const [targetId, results] of byTarget) {
    const target = targets.find((t) => t.id === targetId);
    if (!target) continue;
    const gate = releasable(target);
    if (!gate.ok) {
      withheldNote.push(`${target.name}: ${gate.reason}`);
      continue;
    }
    await mkdir(join(outDir, targetId), { recursive: true });
    await mkdir(join(outDir, "api", "badge", targetId), { recursive: true });

    for (const [component, result] of results) {
      let html = detailPage(target, result);
      const unverifiedReason = target.unverified?.[component];
      if (unverifiedReason) {
        html = html.replace(
          '<div class="meta">',
          `<div class="note note--warn"><p class="note__t">Not verified, do not cite</p><p>${escapeHtml(
            unverifiedReason,
          )}</p></div><div class="meta">`,
        );
      }
      if (target.status === "draft") {
        html = html.replace(
          '<div class="meta">',
          `<div class="note note--warn"><p class="note__t">Draft, not a published result</p><p>${escapeHtml(
            target.notes ?? "This adapter has not been verified. Do not cite these numbers.",
          )}</p></div><div class="meta">`,
        );
      }
      await writeFile(join(outDir, targetId, `${component}.html`), html, "utf8");
      await writeFile(
        join(outDir, "api", "results", `${targetId}.${component}.json`),
        `${JSON.stringify(result, null, 2)}\n`,
        "utf8",
      );
      // Drafts get no badge. A badge is a claim, and we are not making one yet.
      const unverified = target.unverified?.[component];
      if (target.status !== "draft" && !unverified) {
        await writeFile(
          join(outDir, "api", "badge", targetId, `${component}.json`),
          `${JSON.stringify(renderBadge(result), null, 2)}\n`,
          "utf8",
        );
        badges++;
      }
      pages++;
    }
  }

  const withheldSection =
    withheld.length > 0
      ? `<h2>Withheld pending maintainer notice</h2>
<p>
  These have been measured, but their maintainers have not yet had the fourteen days that
  decision 004 gives them. Nothing about a library is published before then, including a
  passing score.
</p>
<div class="tablewrap">
<table>
  <caption>Measured, not yet released.</caption>
  <thead><tr><th scope="col">Library</th><th scope="col">Status</th></tr></thead>
  <tbody>${withheld
    .map(
      (t) =>
        `<tr><th scope="row"><span class="libname">${escapeHtml(t.name)}</span></th><td><span class="chip chip--na"><span class="chip__dot"></span>${escapeHtml(releasable(t).reason)}</span></td></tr>`,
    )
    .join("")}</tbody>
</table>
</div>`
      : "";

  const indexBody = `
<header class="pagehead">
  <h1>Handrail</h1>
  <p class="lede">
    Every major UI component library, run against the W3C's own accessibility
    specification, on every release.
  </p>
</header>

<p>
  Pick a component library today and you are choosing on vibes. Nobody can tell you whether its
  combobox is operable by keyboard, whether its dialog traps focus correctly, or whether last
  week's upgrade quietly broke either. This is that, measured.
</p>

${published.length === 0 ? "" : "<h2>Results</h2>"}
<div class="tablewrap">
<table>
  <caption>Conformance by library and component. Each cell links to every check behind it.</caption>
  <thead><tr><th scope="col">Library</th>${COMPONENT_ORDER.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>
  <tbody>${published.map(rowFor).join("\n")}</tbody>
</table>
</div>
<p style="font-size:0.92rem;color:var(--ink-soft)">
  Each cell links to every check behind it. <span class="ok mono">n/a</span> means the library does
  not ship that component, which is a scope decision and not a failure.
</p>

${
  drafts.length > 0
    ? `<h2>Not yet published</h2>
<p>These have been measured but not verified. A first run against a new library tells you your
adapter is wrong more often than it tells you anything about the library, so nothing here is a
finding until each failure has been confirmed by hand.</p>
<div class="tablewrap">
<table>
  <caption>Measured but not yet verified. These numbers must not be cited.</caption>
  <thead><tr><th scope="col">Library</th>${COMPONENT_ORDER.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>
  <tbody>${drafts.map(rowFor).join("\n")}</tbody>
</table>
</div>`
    : ""
}

${withheldSection}

<h2>How this works</h2>
<p>
  Every library provides a small adapter that mounts its components into a fixed harness at a fixed
  URL. The runner visits that URL and executes a specification. It never learns which library it is
  testing, and it must not be able to tell.
</p>
<ul class="clean">
  <li><strong>Every check cites a clause</strong> of the W3C ARIA Authoring Practices Guide or a WCAG success criterion. Nothing here is our opinion about accessibility.</li>
  <li><strong>Every score names an exact version.</strong> Install that version and you will get this number.</li>
  <li><strong>Every result is run repeatedly</strong> and discarded if the answer changes. An intermittent result is worse than a wrong one.</li>
  <li><strong>A known-good library is measured first.</strong> If it fails a check, the check is presumed wrong until proven otherwise. That assumption has been correct every time so far.</li>
  <li><strong>Maintainers are told before anything is published</strong>, with fourteen days and the adapter source, so they can tell us we measured them wrongly.</li>
</ul>

<div class="note"><p class="note__t">What this cannot tell you</p><p>${CEILING}</p></div>

<h2>Badges</h2>
<p>Every published result has a <a href="https://shields.io/badges/endpoint-badge">shields.io endpoint</a>:</p>
<pre class="mono" style="background:var(--surface);border:1px solid var(--rule);padding:1rem;overflow-x:auto"><code>https://img.shields.io/endpoint?url=&lt;site&gt;/api/badge/radix/dialog.json</code></pre>
<p><a href="api/index.json">Machine-readable index</a> of every result.</p>
`;

  await writeFile(
    join(outDir, "results.html"),
    layout("Results | Handrail", indexBody, { description: "Accessibility conformance results for every measured component library, with the specification clause behind each check." }),
    "utf8",
  );

  await writeFile(
    join(outDir, "index.html"),
    layout("Handrail: does your component library work by keyboard?", landing({
      withheld,
      targets: releasableTargets,
      results: byTarget,
      componentOrder: COMPONENT_ORDER,
      ceiling: CEILING,
    }), { description: "Handrail measures React component libraries against the W3C ARIA Authoring Practices Guide and publishes every result with the clause behind it." }),
    "utf8",
  );

  const apiIndex = {
    generated: new Date().toISOString().slice(0, 10),
    targets: [...byTarget]
      .filter(([id]) => {
        const t = targets.find((x) => x.id === id);
        return t ? releasable(t).ok : false;
      })
      .map(([id, results]) => {
      const target = targets.find((t) => t.id === id);
      return {
        id,
        name: target?.name ?? id,
        status: target?.status ?? "unknown",
        role: target?.role ?? "subject",
        components: [...results].map(([component, result]) => {
          const s = scoreRun(result);
          return {
            component,
            score: s.value,
            blockersFailed: s.blockersFailed,
            passed: s.counts.pass,
            failed: s.counts.fail,
            notApplicable: s.counts["not-applicable"],
            versions: result.target.versions,
            result: `api/results/${id}.${component}.json`,
            badge: target?.status === "draft" ? null : `api/badge/${id}/${component}.json`,
          };
        }),
      };
    }),
  };
  await writeFile(join(outDir, "api", "index.json"), `${JSON.stringify(apiIndex, null, 2)}\n`, "utf8");

  console.log("");
  console.log(`  ${pages} detail pages`);
  console.log(`  ${badges} badge endpoints`);
  console.log(`  ${published.length} released targets, ${drafts.length} draft`);
  if (withheldNote.length > 0) {
    console.log("");
    console.log("  Withheld pending maintainer notice:");
    for (const w of withheldNote) console.log(`    ${w}`);
  }
  console.log(`  ${Object.keys(specs).length} specs covered`);
  if (skipped.length > 0) {
    console.log("");
    console.log("  Skipped as not publishable:");
    for (const s of skipped) console.log(`    ${s}`);
  }
  console.log("");
  console.log(`  Output: ${outDir}`);
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
