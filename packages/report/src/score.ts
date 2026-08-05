import { SEVERITY_WEIGHT, type AssertionStatus } from "@railing-dev/spec";
import type { AssertionResult, RunResult, Score } from "./types.js";

/**
 * score = 100 × (weight of passed) / (weight of applicable)
 *
 * Deliberately simple enough to verify by hand from the published JSON. A
 * scoring model nobody can check is a scoring model nobody should trust.
 *
 * `not-applicable` and `error` are excluded from the denominator. If we could
 * not run a check, that is our problem, and we do not get to score a library
 * down for it.
 */
export function score(assertions: AssertionResult[]): Score {
  const counts: Record<AssertionStatus, number> = {
    pass: 0,
    fail: 0,
    "not-applicable": 0,
    error: 0,
  };

  let passedWeight = 0;
  let applicableWeight = 0;
  let blockersFailed = 0;

  for (const a of assertions) {
    counts[a.status] += 1;
    if (a.status === "pass" || a.status === "fail") {
      const weight = SEVERITY_WEIGHT[a.severity];
      applicableWeight += weight;
      if (a.status === "pass") passedWeight += weight;
      else if (a.severity === "blocker") blockersFailed += 1;
    }
  }

  return {
    value: applicableWeight === 0 ? null : (passedWeight / applicableWeight) * 100,
    passedWeight,
    applicableWeight,
    counts,
    blockersFailed,
    incomplete: counts.error > 0,
  };
}

export function scoreRun(result: RunResult): Score {
  return score(result.assertions);
}

/**
 * Whether a result may be published.
 *
 * Both conditions are non-negotiable: an incomplete run tells us nothing, and a
 * harness error means we tested our own bug rather than someone's library.
 */
export function isPublishable(result: RunResult): { ok: boolean; reason?: string } {
  if (result.harnessError) {
    return { ok: false, reason: `Harness error: ${result.harnessError}` };
  }
  const s = scoreRun(result);
  if (s.incomplete) {
    return { ok: false, reason: `${s.counts.error} assertion(s) errored; resolve before publishing.` };
  }
  return { ok: true };
}

/**
 * Round a score down, never up.
 *
 * toFixed(0) turns 99.6% into "100%", so a component failing a check would be
 * presented as flawless and a reader would have no reason to open the failures.
 * Only a genuine 100 may display as 100%.
 */
export function displayScore(value: number | null): string {
  if (value === null) return "n/a";
  return `${value === 100 ? 100 : Math.floor(value)}%`;
}

export function formatScore(s: Score): string {
  return displayScore(s.value);
}
