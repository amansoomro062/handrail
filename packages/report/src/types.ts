import type { AssertionStatus, Refs, Severity } from "@handrail/spec";

/**
 * The published result schema.
 *
 * Everything needed to reproduce, dispute or re-score a result lives in this
 * file. Nothing may exist only on the website.
 */
export const RESULT_SCHEMA_VERSION = 1;

export interface AssertionResult {
  id: string;
  title: string;
  status: AssertionStatus;
  severity: Severity;
  refs: Refs;
  /** Human-readable outcome. Required for anything that is not a pass. */
  detail?: string;
  expected?: string;
  actual?: string;
  /** Populated only for `not-applicable`. */
  reason?: string;
  /** Populated only for `error` — a runner or harness fault, never scored. */
  error?: string;
  durationMs: number;
  logs: string[];
}

export interface RunEnvironment {
  browser: string;
  browserVersion: string;
  platform: string;
  runnerVersion: string;
}

export interface RunResult {
  schemaVersion: number;
  target: {
    id: string;
    /** Resolved package versions, read from the adapter. Never semver ranges. */
    versions: Record<string, string>;
    adapterVersion: string;
    /** How the library was mounted, including any non-default configuration. */
    notes?: string;
  };
  component: string;
  specVersion: string;
  environment: RunEnvironment;
  startedAt: string;
  finishedAt: string;
  /**
   * Set when the harness itself was invalid — a missing required element, a
   * protocol mismatch, a page that never signalled readiness. A run with this
   * set is an adapter bug and is never scored: a library must not lose points
   * because of an incomplete adapter.
   */
  harnessError?: string;
  assertions: AssertionResult[];
}

export interface Score {
  /** 0–100, or null when nothing was applicable. */
  value: number | null;
  passedWeight: number;
  applicableWeight: number;
  counts: Record<AssertionStatus, number>;
  /**
   * Surfaced separately and always shown beside the score. A library with one
   * blocker and thirty passes scores well and is still unusable to someone
   * navigating by keyboard; an average cannot express that.
   */
  blockersFailed: number;
  /** True when any assertion errored, making the run ineligible for publication. */
  incomplete: boolean;
}
