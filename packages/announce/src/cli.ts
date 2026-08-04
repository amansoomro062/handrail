#!/usr/bin/env node
/**
 * Runs an announcement spec against a harness with real VoiceOver.
 *
 *   pnpm announce --target radix --component dialog --base-url http://localhost:5180
 *
 * macOS only, headed only, and it will briefly take over the machine: a
 * browser window comes to the front and VoiceOver speaks. That is not a
 * limitation so much as the point, the instrument is the actual screen
 * reader, and what it captures is what it actually said.
 *
 * Results land in results/announce/, which sits inside results/ and therefore
 * inside the same publication gate as everything else. These are observations
 * beside the score, never part of it. See docs/DECISIONS.md 021.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { chromium } from "playwright";
import { voiceOver } from "@guidepup/guidepup";
import { META_GLOBAL, READY_ATTRIBUTE } from "@handrail/spec";
import { announceSpecs } from "./specs.js";
import { runSteps, type Instrument } from "./driver.js";
import { ANNOUNCE_SCHEMA_VERSION, type AnnounceResult } from "./types.js";

const GUIDEPUP_VERSION = "0.31.0";

function fromInvocationDir(path: string): string {
  if (isAbsolute(path)) return path;
  return resolve(process.env.INIT_CWD ?? process.cwd(), path);
}

function parseArgs(argv: string[]): { target: string; component: string; baseUrl: string; outDir: string } {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token?.startsWith("--") && argv[i + 1] && !argv[i + 1]!.startsWith("--")) {
      args[token.slice(2)] = argv[i + 1]!;
      i++;
    }
  }
  const missing = ["target", "component", "base-url"].filter((k) => !args[k]);
  if (missing.length > 0) {
    console.error(
      [
        "",
        "  handrail announce --target <id> --component <id> --base-url <url>",
        "",
        `  Missing: ${missing.map((m) => `--${m}`).join(", ")}`,
        "",
        "  macOS only. VoiceOver will start, speak, and stop. The browser runs headed.",
        "",
      ].join("\n"),
    );
    process.exit(2);
  }
  return {
    target: args.target!,
    component: args.component!,
    baseUrl: args["base-url"]!,
    outDir: args.out ?? "results",
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2).filter((a) => a !== "announce"));

  if (process.platform !== "darwin") {
    console.error("\n  VoiceOver only exists on macOS. This command cannot run here.\n");
    process.exit(2);
  }

  const spec = announceSpecs[args.component];
  if (!spec) {
    console.error(
      `\n  No announcement spec for "${args.component}" yet. Available: ${Object.keys(announceSpecs).join(", ")}\n`,
    );
    process.exit(2);
  }

  const startedAt = new Date().toISOString();
  const macos = execSync("sw_vers -productVersion").toString().trim();

  const browser = await chromium.launch({ headless: false });
  try {
    const page = await browser.newPage();
    await page.goto(`${args.baseUrl.replace(/\/$/, "")}/harness/${args.component}`);
    await page.waitForSelector(`[${READY_ATTRIBUTE}="true"]`, { timeout: 15_000 });
    const meta = (await page.evaluate(
      (key) => (window as unknown as Record<string, { libraryVersions?: Record<string, string> }>)[key],
      META_GLOBAL,
    )) ?? {};
    await page.bringToFront();

    try {
      await voiceOver.start();
    } catch (error) {
      console.error(
        [
          "",
          "  VoiceOver could not be controlled. On this machine, two switches decide that:",
          "",
          "  1. VoiceOver Utility (Cmd+F5 to start VoiceOver, then VO+F8), General:",
          '     tick "Allow VoiceOver to be controlled with AppleScript".',
          "  2. System Settings, Privacy & Security, Accessibility and Automation:",
          "     allow the terminal running this command when macOS prompts.",
          "",
          `  Underlying error: ${error instanceof Error ? error.message : String(error)}`,
          "",
        ].join("\n"),
      );
      process.exit(2);
    }

    const instrument: Instrument = {
      press: (key) => voiceOver.press(key),
      phrases: () => voiceOver.spokenPhraseLog(),
      clear: () => voiceOver.clearSpokenPhraseLog(),
    };

    let checks;
    let fullLog: string[] = [];
    try {
      checks = await runSteps(instrument, spec);
      fullLog = await voiceOver.spokenPhraseLog();
    } finally {
      await voiceOver.stop();
    }

    const result: AnnounceResult = {
      schemaVersion: ANNOUNCE_SCHEMA_VERSION,
      instrument: {
        screenReader: "voiceover",
        macos,
        guidepup: GUIDEPUP_VERSION,
        browser: "chromium",
        browserVersion: browser.version(),
      },
      target: { id: args.target, versions: meta.libraryVersions ?? {} },
      component: args.component,
      specVersion: spec.version,
      startedAt,
      finishedAt: new Date().toISOString(),
      checks,
      spokenPhraseLog: fullLog,
    };

    const outDir = join(fromInvocationDir(args.outDir), "announce");
    await mkdir(outDir, { recursive: true });
    const path = join(outDir, `${args.target}.${args.component}.json`);
    await writeFile(path, `${JSON.stringify(result, null, 2)}\n`, "utf8");

    console.log("");
    for (const check of checks) {
      const mark = check.status === "pass" ? "HEARD " : check.status === "fail" ? "SILENT" : "ERROR ";
      console.log(`  ${mark} ${check.id}`);
      if (check.status === "pass" && check.heard) console.log(`         "${check.heard}"`);
      if (check.status === "fail") console.log(`         wanted: ${check.mustHear.join(" + ")}`);
      if (check.error) console.log(`         ${check.error}`);
    }
    console.log(`\n  Observation written to ${path}`);
    console.log("  Observations sit beside the score. They are never part of it.\n");

    if (checks.some((c) => c.status === "error")) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
