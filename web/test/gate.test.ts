/**
 * The publication gate.
 *
 * Decision 004: nobody learns about a finding from a public page. This is the
 * single rule the project cannot recover from breaking, so it is tested
 * directly rather than left to the build to get right.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { releasable, NOTICE_DAYS, type Target } from "../lib/data.js";

const target = (notifiedOn: string | null): Target => ({
  id: "x",
  name: "X",
  role: "subject",
  status: "published",
  notifiedOn,
});

const NOW = Date.parse("2026-08-04T00:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

test("a library nobody has been told about is never releasable", () => {
  const verdict = releasable(target(null), NOW);
  assert.equal(verdict.ok, false);
  assert.match(verdict.reason, /not been notified/);
});

test("the day the maintainer is notified is not the day we publish", () => {
  assert.equal(releasable(target(daysAgo(0)), NOW).ok, false);
});

test("thirteen days is not fourteen", () => {
  const verdict = releasable(target(daysAgo(NOTICE_DAYS - 1)), NOW);
  assert.equal(verdict.ok, false);
  assert.match(verdict.reason, /13 of 14/);
});

test("fourteen days releases it", () => {
  assert.equal(releasable(target(daysAgo(NOTICE_DAYS)), NOW).ok, true);
});

test("a date in the future does not release it", () => {
  // A typo in targets.json must fail closed, never open.
  assert.equal(releasable(target(daysAgo(-30)), NOW).ok, false);
});

test("an unparseable date does not release it", () => {
  assert.equal(releasable(target("not a date"), NOW).ok, false);
});

test("nothing in the repository is releasable right now", async () => {
  // A standing assertion about real data: if this ever fails, either a
  // notification genuinely went out and the date was recorded, or something
  // set a date that should not have been set.
  const { loadTargets } = await import("../lib/data.js");
  const targets = await loadTargets();
  const open = targets.filter((t) => releasable(t).ok).map((t) => t.name);
  assert.deepEqual(open, [], `these would publish: ${open.join(", ")}`);
});
