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
import { isPublishable, renderBadge, scoreRun, type RunResult } from "@handrail/report";
import { getSpec, specs } from "@handrail/spec";
import { escapeHtml, layout } from "./theme.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const resultsDir = join(root, "results");
const outDir = join(root, "site", "dist");

const CEILING =
  "A high score means no violations were detected by automated testing. It does not mean the component is accessible. " +
  "Automated tests cannot judge whether a label is meaningful, whether a reading order makes sense, or whether the " +
  "experience is usable with a screen reader. Those need human judgement and disabled users. This is a floor, not a ceiling.";

interface Target {
  id: string;
  name: string;
  vendor?: string;
  homepage?: string;
  role: string;
  status: string;
  notes?: string;
}

const COMPONENT_ORDER = ["dialog", "combobox", "menu", "tabs", "accordion"];

function scoreCell(result: RunResult | undefined, href: string): string {
  if (!result) return `<span class="na mono">—</span>`;
  const s = scoreRun(result);
  if (s.value === null) {
    return `<a href="${href}"><span class="cell na"><b>n/a</b><small>not shipped</small></span></a>`;
  }
  const cls = s.blockersFailed > 0 || s.value < 100 ? "bad" : "ok";
  const sub =
    s.blockersFailed > 0
      ? `${s.blockersFailed} blocker${s.blockersFailed === 1 ? "" : "s"}`
      : `${s.counts.pass}/${s.counts.pass + s.counts.fail}`;
  return `<a href="${href}"><span class="cell ${cls}"><b>${s.value.toFixed(0)}%</b><small>${sub}</small></span></a>`;
}

function detailPage(target: Target, result: RunResult): string {
  const spec = getSpec(result.component);
  const s = scoreRun(result);
  const versions = Object.entries(result.target.versions)
    .map(([name, version]) => `${escapeHtml(name)}@${escapeHtml(version)}`)
    .join("<br>");

  const assertions = result.assertions
    .map((a) => {
      const statusClass = a.status === "pass" ? "ok" : a.status === "fail" ? "bad" : "na";
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
          ? `<div class="assertion__body">
               <p style="margin:0 0 .4rem">${escapeHtml(a.detail ?? "")}</p>
               <dl class="kv">
                 <dt>expected</dt><dd>${escapeHtml(a.expected ?? "—")}</dd>
                 <dt>actual</dt><dd>${escapeHtml(a.actual ?? "—")}</dd>
                 <dt>why</dt><dd>${escapeHtml(spec.assertions.find((x) => x.id === a.id)?.rationale ?? "")}</dd>
                 <dt>measured</dt><dd>${refs.join(" &middot; ")}</dd>
               </dl>
             </div>`
          : a.status === "not-applicable"
            ? `<div class="assertion__body">${escapeHtml(a.reason ?? "")}</div>`
            : "";
      return `<div class="assertion ${a.status === "fail" ? "assertion--fail" : ""}">
        <div class="assertion__head">
          <span class="assertion__status ${statusClass}">${a.status === "not-applicable" ? "n/a" : a.status}</span>
          <span class="assertion__id">${escapeHtml(a.id)}</span>
          <span class="assertion__sev">${escapeHtml(a.severity)}</span>
        </div>${body}
      </div>`;
    })
    .join("\n");

  const body = `
<header class="masthead">
  <p class="eyebrow">${escapeHtml(target.name)}</p>
  <h1>${escapeHtml(spec.title)}</h1>
  <p class="lede">${s.value === null ? "Not shipped by this library." : `${s.value.toFixed(0)}% — ${s.counts.pass} of ${s.counts.pass + s.counts.fail} checks passed${s.blockersFailed ? `, including ${s.blockersFailed} blocker-level failure${s.blockersFailed === 1 ? "" : "s"}` : ""}.`}</p>
</header>

<div class="meta-grid">
  <div><dt>Versions tested</dt><dd>${versions || "—"}</dd></div>
  <div><dt>Specification</dt><dd><a href="${escapeHtml(spec.apgPattern)}">W3C APG</a><br>spec v${escapeHtml(result.specVersion)}</dd></div>
  <div><dt>Browser</dt><dd>${escapeHtml(result.environment.browser)} ${escapeHtml(result.environment.browserVersion)}</dd></div>
  <div><dt>Run</dt><dd>${escapeHtml(result.startedAt.slice(0, 10))}<br>runner ${escapeHtml(result.environment.runnerVersion)}</dd></div>
</div>

${
  result.target.notes
    ? `<div class="note"><strong>How this was mounted</strong><p>${escapeHtml(result.target.notes)}</p></div>`
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
<p><a href="../api/results/${escapeHtml(target.id)}.${escapeHtml(result.component)}.json">Raw result JSON</a> &middot; <a href="../index.html">Back to the index</a></p>

<div class="note"><strong>What this cannot tell you</strong><p>${CEILING}</p></div>
`;
  return layout(
    `${target.name} — ${spec.title} — Handrail`,
    body,
    `<a href="../index.html">Handrail</a> / ${escapeHtml(target.name)} / ${escapeHtml(result.component)}`,
  );
}

async function main(): Promise<void> {
  if (!existsSync(resultsDir)) {
    console.error(`No results directory at ${resultsDir}. Run the specs first.`);
    process.exit(1);
  }

  const targets: Target[] = JSON.parse(await readFile(join(root, "targets.json"), "utf8")).targets;
  const files = (await readdir(resultsDir)).filter((f) => f.endsWith(".json"));

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

  const published = targets.filter((t) => t.status === "published");
  const drafts = targets.filter((t) => t.status === "draft" && byTarget.has(t.id));

  let pages = 0;
  let badges = 0;

  const rowFor = (t: Target) => {
    const results = byTarget.get(t.id);
    const cells = COMPONENT_ORDER.map((component) => {
      const r = results?.get(component);
      return `<td>${scoreCell(r, `${t.id}/${component}.html`)}</td>`;
    }).join("");
    const label = t.role === "control" ? ` <span class="pill pill--control">control</span>` : "";
    const name = t.homepage
      ? `<a href="${escapeHtml(t.homepage)}">${escapeHtml(t.name)}</a>`
      : escapeHtml(t.name);
    return `<tr><td>${name}${label}</td>${cells}</tr>`;
  };

  // Detail pages, raw JSON and badges for everything we have, drafts included —
  // a draft's page carries a warning rather than being hidden, so a link shared
  // anywhere still explains itself.
  for (const [targetId, results] of byTarget) {
    const target = targets.find((t) => t.id === targetId);
    if (!target) continue;
    await mkdir(join(outDir, targetId), { recursive: true });
    await mkdir(join(outDir, "api", "badge", targetId), { recursive: true });

    for (const [component, result] of results) {
      let html = detailPage(target, result);
      if (target.status === "draft") {
        html = html.replace(
          '<div class="meta-grid">',
          `<div class="note note--warn"><strong>Draft, not a published result</strong><p>${escapeHtml(
            target.notes ?? "This adapter has not been verified. Do not cite these numbers.",
          )}</p></div><div class="meta-grid">`,
        );
      }
      await writeFile(join(outDir, targetId, `${component}.html`), html, "utf8");
      await writeFile(
        join(outDir, "api", "results", `${targetId}.${component}.json`),
        `${JSON.stringify(result, null, 2)}\n`,
        "utf8",
      );
      // Drafts get no badge. A badge is a claim, and we are not making one yet.
      if (target.status !== "draft") {
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

  const indexBody = `
<header class="masthead">
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

<h2>Results</h2>
<div class="scroll-x">
<table>
  <thead><tr><th>Library</th>${COMPONENT_ORDER.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
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
<div class="scroll-x">
<table>
  <thead><tr><th>Library</th>${COMPONENT_ORDER.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
  <tbody>${drafts.map(rowFor).join("\n")}</tbody>
</table>
</div>`
    : ""
}

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

<div class="note"><strong>What this cannot tell you</strong><p>${CEILING}</p></div>

<h2>Badges</h2>
<p>Every published result has a <a href="https://shields.io/badges/endpoint-badge">shields.io endpoint</a>:</p>
<pre class="mono" style="background:var(--surface);border:1px solid var(--rule);padding:1rem;overflow-x:auto"><code>https://img.shields.io/endpoint?url=&lt;site&gt;/api/badge/radix/dialog.json</code></pre>
<p><a href="api/index.json">Machine-readable index</a> of every result.</p>
`;

  await writeFile(join(outDir, "index.html"), layout("Handrail", indexBody), "utf8");

  const apiIndex = {
    generated: new Date().toISOString().slice(0, 10),
    targets: [...byTarget].map(([id, results]) => {
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
  console.log(`  ${published.length} published targets, ${drafts.length} draft`);
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
