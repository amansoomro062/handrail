#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { chromium } from "playwright";
import { getSpec } from "@railing/spec";
import { isPublishable, renderTerminal, scoreRun } from "@railing/report";
import { runSpec } from "./execute.js";

interface Args {
  target: string;
  component: string;
  baseUrl: string;
  outDir: string;
  headed: boolean;
  /** Run N times and fail if any assertion's status varies. */
  repeat: number;
  /** Path to a catalogue of expected statuses, see adapters/_fixture-broken. */
  expect?: string;
  /**
   * Run a single assertion by id. Reproduction mode: nothing is written, so a
   * partial run can never overwrite a full result.
   */
  only?: string;
}

interface ExpectationFile {
  components: Record<string, Record<string, string>>;
}

/**
 * Resolve a user-supplied path against the directory the command was invoked
 * from. `pnpm --filter` runs scripts with the cwd set to the package, so a path
 * the user typed relative to the repository root would otherwise resolve inside
 * packages/runner and either fail or write results somewhere surprising.
 */
function fromInvocationDir(path: string): string {
  if (isAbsolute(path)) return path;
  return resolve(process.env.INIT_CWD ?? process.cwd(), path);
}

/**
 * Compare a run against a catalogue of expected outcomes.
 *
 * This is how the runner's error rate becomes a measured number instead of an
 * assumption. Both directions are reported, because they mean different things:
 * a missed defect weakens the index, but a spurious failure would have us
 * accuse a maintainer of something that is not true.
 */
function compareToExpectations(
  result: { component: string; assertions: Array<{ id: string; status: string }> },
  file: ExpectationFile,
): { ok: boolean; lines: string[] } {
  const lines: string[] = [];
  const seen = new Set<string>();
  const expected = file.components[result.component];

  if (!expected) {
    const known = Object.keys(file.components).join(", ") || "none";
    return {
      ok: false,
      lines: [`  No catalogue for component "${result.component}". Catalogued: ${known}.`],
    };
  }

  for (const assertion of result.assertions) {
    seen.add(assertion.id);
    const want = expected[assertion.id];
    if (want === undefined) {
      lines.push(`  UNCATALOGUED  ${assertion.id}, got ${assertion.status}, no expectation recorded`);
      continue;
    }
    if (want !== assertion.status) {
      const direction =
        want === "fail" && assertion.status === "pass"
          ? "FALSE NEGATIVE, a catalogued defect went undetected"
          : want === "pass" && assertion.status === "fail"
            ? "FALSE POSITIVE, correct behaviour was reported as a violation"
            : "MISMATCH";
      lines.push(`  ${direction}\n    ${assertion.id}: expected ${want}, got ${assertion.status}`);
    }
  }

  for (const id of Object.keys(expected)) {
    if (!seen.has(id)) lines.push(`  MISSING  ${id}, expected but never ran`);
  }

  return { ok: lines.length === 0, lines };
}

function parseArgs(argv: string[]): Args {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token?.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }

  const required = ["target", "component", "base-url"] as const;
  const missing = required.filter((key) => typeof args[key] !== "string");
  if (missing.length > 0) {
    console.error(
      [
        "",
        "  railing run --target <id> --component <id> --base-url <url>",
        "",
        `  Missing: ${missing.map((m) => `--${m}`).join(", ")}`,
        "",
        "  Example:",
        "    pnpm railing run --target radix --component dialog \\",
        "      --base-url http://localhost:5180",
        "",
        "  Options:",
        "    --out <dir>      Where to write result JSON (default: results)",
        "    --headed         Show the browser",
        "    --expect <file>  Compare against a catalogue of expected statuses",
        "    --repeat <n>     Run n times and fail if any assertion is unstable",
        "    --only <id>      Run a single assertion, e.g. menu.arrow-moves-between-items.",
        "                     Prints the outcome and writes nothing.",
        "",
      ].join("\n"),
    );
    process.exit(2);
  }

  if (typeof args.only === "string" && typeof args.expect === "string") {
    console.error("\n  --only and --expect cannot be combined: calibration needs the full catalogue.\n");
    process.exit(2);
  }

  return {
    target: args.target as string,
    component: args.component as string,
    baseUrl: args["base-url"] as string,
    outDir: (args.out as string) ?? "results",
    headed: args.headed === true,
    repeat: Math.max(1, Number(args.repeat ?? 1) || 1),
    ...(typeof args.expect === "string" ? { expect: args.expect } : {}),
    ...(typeof args.only === "string" ? { only: args.only } : {}),
  };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2).filter((a) => a !== "run");
  const args = parseArgs(argv);
  let spec = getSpec(args.component);

  // Reproduction mode: one assertion, nothing written. This is the command a
  // report puts under every finding, so a maintainer replays exactly the check
  // that failed rather than sitting through the whole spec.
  if (args.only) {
    const match = spec.assertions.filter(
      (a) => a.id === args.only || a.id === `${args.component}.${args.only}`,
    );
    if (match.length === 0) {
      console.error(`\n  No assertion "${args.only}" in the ${args.component} spec. Available:\n`);
      for (const a of spec.assertions) console.error(`    ${a.id}`);
      console.error("");
      process.exit(2);
    }
    spec = { ...spec, assertions: match };
  }

  const browser = await chromium.launch({ headless: !args.headed });
  try {
    const context = await browser.newContext();

    // Trace the run that gets published, and only that run. The stability
    // repeats are deliberately outside the chunk: what the trace replays must
    // be what was scored, not three interleaved copies of it.
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    await context.tracing.startChunk({
      title: `${args.target} ${args.component}${args.only ? ` (${args.only})` : ""}`,
    });

    const page = await context.newPage();

    const result = await runSpec({
      page,
      baseUrl: args.baseUrl,
      spec,
      targetId: args.target,
    });

    const outDir = fromInvocationDir(args.outDir);
    const traceRelative = args.only
      ? join("traces", `${args.target}.${args.component}.only.zip`)
      : join("traces", `${args.target}.${args.component}.zip`);
    const tracePath = join(outDir, traceRelative);
    await mkdir(join(outDir, "traces"), { recursive: true });
    await context.tracing.stopChunk({ path: tracePath });
    if (!args.only) result.trace = traceRelative;

    console.log(renderTerminal(result));

    // Repeat the run and report any assertion whose status varies. An
    // intermittent result is worse than a failing one: it is indistinguishable
    // from a real finding, and whichever run happened to be published is the one
    // a maintainer has to argue with. Run this before publishing anything.
    if (args.repeat > 1) {
      const statuses = new Map<string, Set<string>>();
      for (const assertion of result.assertions) {
        statuses.set(assertion.id, new Set([assertion.status]));
      }
      for (let run = 2; run <= args.repeat; run++) {
        const again = await runSpec({ page, baseUrl: args.baseUrl, spec, targetId: args.target });
        for (const assertion of again.assertions) {
          statuses.get(assertion.id)?.add(assertion.status);
        }
      }
      const unstable = [...statuses].filter(([, seen]) => seen.size > 1);
      if (unstable.length === 0) {
        console.log(`  Stable across ${args.repeat} runs.\n`);
      } else {
        console.error(`  UNSTABLE across ${args.repeat} runs, not publishable\n`);
        for (const [id, seen] of unstable) {
          console.error(`    ${id}: ${[...seen].join(" / ")}`);
        }
        console.error("");
        process.exitCode = 1;
        return;
      }
    }

    // Reproduction mode ends here. A single-assertion run must never overwrite
    // a full result, and its outcome is the terminal output plus the trace.
    if (args.only) {
      console.log(`  Reproduction run, nothing written. Trace: ${tracePath}\n`);
      return;
    }

    await mkdir(outDir, { recursive: true });
    const filename = `${args.target}.${args.component}.json`;
    const path = join(outDir, filename);
    const serialised = `${JSON.stringify(result, null, 2)}\n`;
    await writeFile(path, serialised, "utf8");

    // The latest file is what the site and the reports read, but on its own it
    // is amnesiac: the weekly re-run overwrites it, and with it the one thing
    // no single audit can produce, which version a regression arrived in. The
    // archive keeps every run, dated; the versions it measured are inside the
    // file, so the history can be keyed by whatever a future view needs.
    const day = result.startedAt.slice(0, 10);
    const historyDir = join(outDir, "history", `${args.target}.${args.component}`);
    await mkdir(historyDir, { recursive: true });
    await writeFile(join(historyDir, `${day}.json`), serialised, "utf8");

    console.log(`  Result written to ${path}`);
    console.log(`  Archived to history/${args.target}.${args.component}/${day}.json`);
    console.log(`  Trace written to ${tracePath}, open with: npx playwright show-trace ${tracePath}\n`);

    if (args.expect) {
      const expectations = JSON.parse(
        await readFile(fromInvocationDir(args.expect), "utf8"),
      ) as ExpectationFile;
      const { ok, lines } = compareToExpectations(result, expectations);
      if (ok) {
        console.log(
          `  Calibration passed, all ${result.assertions.length} assertions matched the catalogue.\n`,
        );
      } else {
        console.error("  CALIBRATION FAILED\n");
        console.error(lines.join("\n"));
        console.error("");
        process.exitCode = 1;
      }
      return;
    }

    const publishable = isPublishable(result);
    if (!publishable.ok) {
      console.error(`  NOT PUBLISHABLE, ${publishable.reason}\n`);
      process.exitCode = 1;
      return;
    }

    // Exit code reflects whether the run completed, not whether the library
    // passed. A failing library is a valid result, not a broken run.
    const s = scoreRun(result);
    if (s.counts.fail > 0) {
      console.log(`  ${s.counts.fail} violation(s) detected. This is a result, not an error.\n`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
