/**
 * The scoring model, tested against the rules in docs/SCORING.md.
 *
 * These are the numbers that get published. If any of this is wrong, every page
 * on the index is wrong in a way nobody would notice by reading it.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { Severity } from "@railing-dev/spec";
import { score, isPublishable, renderBadge, formatScore, scoreRun } from "../src/index.js";
import type { AssertionResult, RunResult } from "../src/index.js";

function assertion(
  status: AssertionResult["status"],
  severity: Severity = "serious",
  id = `x.${status}-${severity}-${Math.abs(Math.round(performance.now() * 1000))}`,
): AssertionResult {
  return { id, title: "t", rationale: "r", status, severity, refs: {}, durationMs: 1, logs: [] };
}

function run(assertions: AssertionResult[], overrides: Partial<RunResult> = {}): RunResult {
  return {
    schemaVersion: 1,
    target: { id: "t", versions: { lib: "1.0.0" }, adapterVersion: "0.1.0" },
    component: "dialog",
    specVersion: "1.0.0",
    environment: { browser: "chromium", browserVersion: "1", platform: "linux", runnerVersion: "0.1.0" },
    startedAt: "2026-08-04T00:00:00.000Z",
    finishedAt: "2026-08-04T00:00:01.000Z",
    assertions,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ *
 * The formula
 * ------------------------------------------------------------------ */

test("all passing is 100%", () => {
  const s = score([assertion("pass", "blocker"), assertion("pass", "minor")]);
  assert.equal(s.value, 100);
  assert.equal(s.blockersFailed, 0);
});

test("all failing is 0%", () => {
  assert.equal(score([assertion("fail", "blocker"), assertion("fail", "minor")]).value, 0);
});

test("failures are weighted by severity, not counted equally", () => {
  // One blocker (10) failing out of blocker + minor (11) leaves 1/11.
  const heavy = score([assertion("fail", "blocker"), assertion("pass", "minor")]);
  // One minor (1) failing out of the same pool leaves 10/11.
  const light = score([assertion("pass", "blocker"), assertion("fail", "minor")]);
  assert.ok(heavy.value !== null && light.value !== null);
  assert.ok(heavy.value < light.value, "a failed blocker must cost more than a failed minor");
  assert.equal(Math.round(heavy.value), 9);
  assert.equal(Math.round(light.value), 91);
});

/* ------------------------------------------------------------------ *
 * What is excluded, and why it matters
 * ------------------------------------------------------------------ */

test("not-applicable is excluded from the denominator", () => {
  // A library that does not ship a component must not be scored down for it.
  const s = score([assertion("pass"), assertion("not-applicable")]);
  assert.equal(s.value, 100);
  assert.equal(s.counts["not-applicable"], 1);
});

test("a fully not-applicable run scores n/a rather than zero", () => {
  const s = score([assertion("not-applicable"), assertion("not-applicable")]);
  assert.equal(s.value, null, "n/a and 0% mean opposite things to a reader");
  assert.equal(formatScore(s), "n/a");
});

test("errors are excluded, because a check we could not run is our problem", () => {
  const s = score([assertion("pass"), assertion("error", "blocker")]);
  assert.equal(s.value, 100);
  assert.equal(s.incomplete, true);
});

test("blockers are counted separately from the score", () => {
  // Thirty passes and one failed blocker still scores well, and the component
  // is still unusable by keyboard. The count is what carries that.
  const many = Array.from({ length: 30 }, () => assertion("pass", "minor"));
  const s = score([...many, assertion("fail", "blocker")]);
  assert.ok(s.value !== null && s.value > 70, "the average hides it");
  assert.equal(s.blockersFailed, 1, "the count must not");
});

/* ------------------------------------------------------------------ *
 * Publication gate
 * ------------------------------------------------------------------ */

test("a run with a harness error is never publishable", () => {
  const verdict = isPublishable(run([], { harnessError: "adapter never signalled readiness" }));
  assert.equal(verdict.ok, false);
  assert.match(String(verdict.reason), /Harness error/);
});

test("a run with any errored assertion is never publishable", () => {
  const verdict = isPublishable(run([assertion("pass"), assertion("error")]));
  assert.equal(verdict.ok, false);
  assert.match(String(verdict.reason), /errored/);
});

test("an ordinary run with failures is publishable, because a failure is a result", () => {
  assert.equal(isPublishable(run([assertion("pass"), assertion("fail")])).ok, true);
});

/* ------------------------------------------------------------------ *
 * Badges
 * ------------------------------------------------------------------ */

test("a badge follows the shields.io endpoint schema", () => {
  const badge = renderBadge(run([assertion("pass")]));
  assert.equal(badge.schemaVersion, 1);
  assert.ok(typeof badge.label === "string" && typeof badge.message === "string");
});

test("a failed blocker turns the badge red however high the score", () => {
  const many = Array.from({ length: 30 }, () => assertion("pass", "minor"));
  const badge = renderBadge(run([...many, assertion("fail", "blocker")]));
  assert.equal(badge.color, "red", "a green badge over a blocker would be a lie in someone's README");
});

test("a clean run is green and a not-applicable run is grey", () => {
  assert.equal(renderBadge(run([assertion("pass")])).color, "brightgreen");
  assert.equal(renderBadge(run([assertion("not-applicable")])).message, "n/a");
});

/* ------------------------------------------------------------------ *
 * Rounding
 * ------------------------------------------------------------------ */

test("a score below 100 never displays as 100", () => {
  // 199 passes out of 200 rounds to 100% and would read as flawless.
  const nearly = [
    ...Array.from({ length: 199 }, () => assertion("pass", "minor")),
    assertion("fail", "minor"),
  ];
  const s = scoreRun(run(nearly));
  assert.ok(s.value !== null && s.value < 100);
  assert.notEqual(
    formatScore(s),
    "100%",
    "rounding up to 100% would present a failing component as perfect",
  );
});
