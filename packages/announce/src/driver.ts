/**
 * The step loop, separated from VoiceOver so it can be tested with a fake.
 *
 * The instrument interface is three verbs: press a key, read what was spoken
 * since the last clear, clear it. Everything above that, retries, windows,
 * matching, verdicts, is deterministic and lives here.
 */

import type { AnnounceCheckResult, AnnounceSpec } from "./types.js";
import { matchCheck } from "./match.js";

export interface Instrument {
  press(key: string): Promise<void>;
  /** Phrases spoken since the last clear(). */
  phrases(): Promise<string[]>;
  clear(): Promise<void>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runSteps(
  instrument: Instrument,
  spec: AnnounceSpec,
): Promise<AnnounceCheckResult[]> {
  const results: AnnounceCheckResult[] = [];

  for (const step of spec.steps) {
    const attempts = Math.max(1, step.upTo ?? 1);
    const heardAcrossAttempts: string[] = [];
    let verdicts: Array<{ ok: boolean; heard?: string }> = [];

    try {
      for (let attempt = 1; attempt <= attempts; attempt++) {
        await instrument.clear();
        await instrument.press(step.press);
        await sleep(step.waitMs ?? 800);
        const phrases = await instrument.phrases();
        heardAcrossAttempts.push(...phrases);

        // Checks are evaluated against everything heard during this step so
        // far. A control reached on the third Tab was still reached.
        verdicts = step.checks.map((check) => matchCheck(heardAcrossAttempts, check.mustHear));
        if (verdicts.every((v) => v.ok)) break;
      }

      step.checks.forEach((check, i) => {
        const verdict = verdicts[i] ?? { ok: false };
        results.push({
          id: check.id,
          title: check.title,
          rationale: check.rationale,
          status: verdict.ok ? "pass" : "fail",
          mustHear: check.mustHear,
          ...(verdict.heard !== undefined ? { heard: verdict.heard } : {}),
          phrases: heardAcrossAttempts,
        });
      });
    } catch (error) {
      // An instrument failure is our problem, never the library's. It is
      // recorded as an error, and an errored run is not publishable.
      for (const check of step.checks) {
        results.push({
          id: check.id,
          title: check.title,
          rationale: check.rationale,
          status: "error",
          mustHear: check.mustHear,
          phrases: heardAcrossAttempts,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return results;
}
