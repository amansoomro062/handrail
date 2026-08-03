#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { chromium } from "playwright";
import { getSpec } from "@handrail/spec";
import { isPublishable, renderTerminal, scoreRun } from "@handrail/report";
import { runSpec } from "./execute.js";

interface Args {
  target: string;
  component: string;
  baseUrl: string;
  outDir: string;
  headed: boolean;
  /** Path to a catalogue of expected statuses — see adapters/_fixture-broken. */
  expect?: string;
}

interface ExpectationFile {
  component: string;
  expected: Record<string, string>;
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
  result: { assertions: Array<{ id: string; status: string }> },
  expectations: ExpectationFile,
): { ok: boolean; lines: string[] } {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const assertion of result.assertions) {
    seen.add(assertion.id);
    const want = expectations.expected[assertion.id];
    if (want === undefined) {
      lines.push(`  UNCATALOGUED  ${assertion.id} — got ${assertion.status}, no expectation recorded`);
      continue;
    }
    if (want !== assertion.status) {
      const direction =
        want === "fail" && assertion.status === "pass"
          ? "FALSE NEGATIVE — a catalogued defect went undetected"
          : want === "pass" && assertion.status === "fail"
            ? "FALSE POSITIVE — correct behaviour was reported as a violation"
            : "MISMATCH";
      lines.push(`  ${direction}\n    ${assertion.id}: expected ${want}, got ${assertion.status}`);
    }
  }

  for (const id of Object.keys(expectations.expected)) {
    if (!seen.has(id)) lines.push(`  MISSING  ${id} — expected but never ran`);
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
        "  handrail run --target <id> --component <id> --base-url <url>",
        "",
        `  Missing: ${missing.map((m) => `--${m}`).join(", ")}`,
        "",
        "  Example:",
        "    pnpm handrail run --target radix --component dialog \\",
        "      --base-url http://localhost:5180",
        "",
        "  Options:",
        "    --out <dir>      Where to write result JSON (default: results)",
        "    --headed         Show the browser",
        "    --expect <file>  Compare against a catalogue of expected statuses",
        "",
      ].join("\n"),
    );
    process.exit(2);
  }

  return {
    target: args.target as string,
    component: args.component as string,
    baseUrl: args["base-url"] as string,
    outDir: (args.out as string) ?? "results",
    headed: args.headed === true,
    ...(typeof args.expect === "string" ? { expect: args.expect } : {}),
  };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2).filter((a) => a !== "run");
  const args = parseArgs(argv);
  const spec = getSpec(args.component);

  const browser = await chromium.launch({ headless: !args.headed });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    const result = await runSpec({
      page,
      baseUrl: args.baseUrl,
      spec,
      targetId: args.target,
    });

    console.log(renderTerminal(result));

    const outDir = fromInvocationDir(args.outDir);
    await mkdir(outDir, { recursive: true });
    const filename = `${args.target}.${args.component}.json`;
    const path = join(outDir, filename);
    await writeFile(path, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(`  Result written to ${path}\n`);

    if (args.expect) {
      const expectations = JSON.parse(
        await readFile(fromInvocationDir(args.expect), "utf8"),
      ) as ExpectationFile;
      const { ok, lines } = compareToExpectations(result, expectations);
      if (ok) {
        console.log(
          `  Calibration passed — all ${result.assertions.length} assertions matched the catalogue.\n`,
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
      console.error(`  NOT PUBLISHABLE — ${publishable.reason}\n`);
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
