#!/usr/bin/env node
/**
 * Builds the private report each maintainer receives before anything is published.
 *
 * Decision 004 gives them fourteen days, their full results, and the adapter
 * source so they can tell us we measured them wrongly. That last part is the
 * point: the report is written to be argued with, not admired. It leads with
 * how to disagree, and it includes the code we ran so disagreeing is cheap.
 *
 *   node scripts/notify-bundle.mjs            all libraries
 *   node scripts/notify-bundle.mjs mui        one library
 *
 * Output lands in notifications/, which is untracked. These are findings that
 * nobody has seen yet.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const resultsDir = join(root, "results");
const outRoot = join(root, "notifications");

const PORTS = {
  radix: 5180,
  "react-spectrum": 5181,
  mui: 5182,
  headlessui: 5183,
  chakra: 5184,
  antd: 5185,
  shadcn: 5186,
};

const SEVERITY_MEANING = {
  blocker: "the task cannot be completed by that input method at all",
  serious: "the task is completable but confusing, or state is not communicated",
  moderate: "behaviour departs from the specified pattern; users are inconvenienced",
  minor: "technically non-conforming, low practical impact",
};

if (!existsSync(resultsDir)) {
  console.error("  No results/ directory. Run the specs first.");
  process.exit(1);
}

const targets = JSON.parse(readFileSync(join(root, "targets.json"), "utf8")).targets;
const only = process.argv[2];

const byTarget = new Map();
for (const file of readdirSync(resultsDir).filter((f) => f.endsWith(".json"))) {
  const r = JSON.parse(readFileSync(join(resultsDir, file), "utf8"));
  if (r.target.id === "_fixture-broken") continue;
  if (!byTarget.has(r.target.id)) byTarget.set(r.target.id, []);
  byTarget.get(r.target.id).push(r);
}

const score = (r) => {
  const w = { blocker: 10, serious: 5, moderate: 2, minor: 1 };
  let got = 0;
  let total = 0;
  for (const a of r.assertions) {
    if (a.status !== "pass" && a.status !== "fail") continue;
    total += w[a.severity];
    if (a.status === "pass") got += w[a.severity];
  }
  return total === 0 ? null : (got / total) * 100;
};
const show = (v) => (v === null ? "n/a" : `${v === 100 ? 100 : Math.floor(v)}%`);

function adapterSource(targetId) {
  const dir = join(root, "adapters", targetId, "src", "harnesses");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => ({ name: f, code: readFileSync(join(dir, f), "utf8") }));
}

function report(target, results) {
  const failing = results.flatMap((r) =>
    r.assertions.filter((a) => a.status === "fail").map((a) => ({ ...a, component: r.component })),
  );
  const versions = [...new Set(results.flatMap((r) => Object.entries(r.target.versions).map(([n, v]) => `${n}@${v}`)))];
  const env = results[0]?.environment;
  const port = PORTS[target.id] ?? 5180;

  const out = [];
  out.push(`# Accessibility conformance results for ${target.name}`);
  out.push("");
  out.push(
    "You are receiving this before anyone else, including before it is published. " +
      "Nothing below is public, and none of it will be for at least fourteen days.",
  );
  out.push("");
  out.push(
    "Handrail runs component libraries against the W3C ARIA Authoring Practices Guide and " +
      "publishes the results. Every check cites the clause it measures, every score names an " +
      "exact version, and every result is run repeatedly and discarded if the answer changes.",
  );
  out.push("");
  out.push("## The short version");
  out.push("");
  out.push("| Component | Score | Failing checks |");
  out.push("| --- | --- | --- |");
  for (const r of [...results].sort((a, b) => a.component.localeCompare(b.component))) {
    const f = r.assertions.filter((a) => a.status === "fail").length;
    out.push(`| ${r.component} | ${show(score(r))} | ${f === 0 ? "none" : f} |`);
  }
  out.push("");

  if (failing.length === 0) {
    out.push(
      `We found nothing to report. ${target.name} passes every check we run. ` +
        "We are telling you anyway, because you should hear about a public score from us rather " +
        "than find it, and because you may still think we measured something wrongly.",
    );
    out.push("");
  } else {
    out.push(`## The ${failing.length} finding${failing.length === 1 ? "" : "s"}`);
    out.push("");
    for (const a of failing) {
      out.push(`### \`${a.id}\``);
      out.push("");
      out.push(`**${a.title}**`);
      out.push("");
      out.push(`- **Component:** ${a.component}`);
      out.push(`- **Severity:** ${a.severity}, meaning ${SEVERITY_MEANING[a.severity] ?? ""}`);
      if (a.rationale) out.push(`- **Why it matters:** ${a.rationale}`);
      out.push(`- **Expected:** ${a.expected ?? "n/a"}`);
      out.push(`- **We measured:** ${a.actual ?? "n/a"}`);
      const refs = [];
      if (a.refs?.apg) refs.push(`[APG pattern](${a.refs.apg})`);
      if (a.refs?.wcag) refs.push(a.refs.wcagUrl ? `[WCAG ${a.refs.wcag}](${a.refs.wcagUrl})` : `WCAG ${a.refs.wcag}`);
      if (refs.length) out.push(`- **Measured against:** ${refs.join(" · ")}`);
      if (a.detail) {
        out.push("");
        out.push(`> ${a.detail}`);
      }
      out.push("");
    }
  }

  out.push("## How we tested it");
  out.push("");
  out.push(`- **Versions:** ${versions.join(", ") || "not recorded"}`);
  if (env) out.push(`- **Browser:** ${env.browser} ${env.browserVersion}`);
  if (results[0]?.target.notes) out.push(`- **Mounting notes:** ${results[0].target.notes}`);
  out.push(
    "- **Configuration:** default. We use only what the library exports and never hand-write ARIA, " +
      "even where the documentation instructs the developer to. If we did, the score would measure " +
      "how carefully we copied your docs rather than what ships in the box.",
  );
  out.push("");
  out.push("Reproduce any of it from a clone of the repository:");
  out.push("");
  out.push("```bash");
  out.push(`pnpm --filter @handrail/adapter-${target.id} run dev`);
  out.push(`pnpm handrail run --target ${target.id} --component <component> \\`);
  out.push(`  --base-url http://localhost:${port} --repeat 3`);
  out.push("```");
  out.push("");

  out.push("## Where we might be wrong");
  out.push("");
  out.push(
    "The most likely cause of a wrong result is our adapter, not your library. We have got this " +
      "wrong repeatedly: one library's first run scored 27% and almost all of it was a selector of " +
      "ours; another was reported as having a broken focus trap when the trap worked and our test " +
      "was reading focus too early.",
  );
  out.push("");
  out.push("So the adapter source is included below. Please tell us if we mounted your component in a way you would not recommend, or if a check misreads the specification. We will correct it and, if it has already been published, correct that too.");
  out.push("");

  out.push("## What happens next");
  out.push("");
  out.push("- You have **fourteen days** before anything about this library is published.");
  out.push("- If you reply, your response is published beside the score, in full and unedited.");
  out.push("- **If you ship a fix in that window, we publish the fixed score.** A finding that gets fixed before publication is the best outcome this project has, not a story we lost.");
  out.push("- If you would like longer, ask. The deadline is ours, not a rule.");
  out.push("");

  const sources = adapterSource(target.id);
  if (sources.length) {
    out.push("## The adapter we used");
    out.push("");
    out.push("This is the whole of the library-specific code. There is nothing else.");
    out.push("");
    for (const s of sources) {
      out.push(`<details><summary><code>${s.name}</code></summary>`);
      out.push("");
      out.push("```tsx");
      out.push(s.code.trimEnd());
      out.push("```");
      out.push("");
      out.push("</details>");
      out.push("");
    }
  }
  return out.join("\n");
}

function covering(target, results) {
  const failing = results.reduce((n, r) => n + r.assertions.filter((a) => a.status === "fail").length, 0);
  return `Subject: Accessibility conformance results for ${target.name}, before we publish them

Hello,

I run Handrail, an open source project that tests UI component libraries against
the W3C ARIA Authoring Practices Guide and publishes the results. ${target.name}
is one of the libraries measured.

${
  failing === 0
    ? `${target.name} passes every check. There is nothing to fix, and I am writing only because you should hear about a public score from us rather than come across it, and because you may still disagree with how we measured it.`
    : `We found ${failing} issue${failing === 1 ? "" : "s"}. Nothing is public yet, and nothing will be for fourteen days.`
}

The attached report has every check, the specification clause behind it, and the
complete adapter source so you can see exactly how your components were mounted.
If we got something wrong, that is the likeliest explanation and I would rather
hear it now than publish it. ${failing > 0 ? "If you ship a fix before we publish, we publish the fixed score." : ""}

Happy to give you longer than fourteen days if that helps.

Thanks for your time, and for the library.
`;
}

let made = 0;
for (const target of targets) {
  if (target.status === "planned") continue;
  if (only && target.id !== only) continue;
  const results = byTarget.get(target.id);
  if (!results || results.length === 0) {
    console.log(`  ${target.name}: no results, skipped`);
    continue;
  }
  const dir = join(outRoot, target.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "report.md"), `${report(target, results)}\n`, "utf8");
  writeFileSync(join(dir, "covering-message.txt"), covering(target, results), "utf8");
  const failing = results.reduce((n, r) => n + r.assertions.filter((a) => a.status === "fail").length, 0);
  console.log(`  ${target.name.padEnd(16)} ${String(failing).padStart(2)} finding(s)  ->  notifications/${target.id}/`);
  made++;
}

console.log("");
console.log(`  ${made} bundle(s) written to notifications/ (untracked)`);
console.log("  Record the date you send each one in targets.json as notifiedOn.");
console.log("");
