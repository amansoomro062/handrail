/**
 * The deciding half of the instrument: matching and the step loop.
 *
 * Tested with a fake screen reader, because this logic converts phrases into
 * verdicts about other people's libraries and must not depend on VoiceOver
 * being present to be verified.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { matchCheck } from "../src/match.js";
import { runSteps, type Instrument } from "../src/driver.js";
import type { AnnounceSpec } from "../src/types.js";

/* ------------------------------------------------------------------ *
 * Matching
 * ------------------------------------------------------------------ */

test("matching is case-insensitive and whitespace-tolerant", () => {
  const verdict = matchCheck(["Open   Dialog, button"], ["open dialog", "button"]);
  assert.equal(verdict.ok, true);
  assert.equal(verdict.heard, "Open   Dialog, button");
});

test("needles may land across separate phrases", () => {
  // VoiceOver splits announcements differently between versions. Where the
  // split falls is not the library's doing.
  assert.equal(matchCheck(["Handrail test dialog", "web dialog"], ["Handrail test dialog", "dialog"]).ok, true);
});

test("a missing needle fails the check", () => {
  assert.equal(matchCheck(["button"], ["Open dialog", "button"]).ok, false);
});

test("no phrases means nothing was heard", () => {
  assert.equal(matchCheck([], ["anything"]).ok, false);
});

/* ------------------------------------------------------------------ *
 * The step loop
 * ------------------------------------------------------------------ */

function fake(script: Record<string, string[][]>): Instrument & { presses: string[] } {
  const counts: Record<string, number> = {};
  let window: string[] = [];
  const instrument = {
    presses: [] as string[],
    async press(key: string) {
      instrument.presses.push(key);
      const n = counts[key] ?? 0;
      counts[key] = n + 1;
      window = script[key]?.[n] ?? [];
    },
    async phrases() {
      return window;
    },
    async clear() {
      window = [];
    },
  };
  return instrument;
}

const spec = (upTo?: number): AnnounceSpec => ({
  component: "dialog",
  version: "test",
  steps: [
    {
      press: "Tab",
      ...(upTo !== undefined ? { upTo } : {}),
      waitMs: 1,
      checks: [
        {
          id: "t.trigger",
          title: "t",
          rationale: "r",
          mustHear: ["Open dialog", "button"],
        },
      ],
    },
  ],
});

test("a control reached on the third Tab still passes", async () => {
  const instrument = fake({
    Tab: [["Content outside the dialog"], ["some link, link"], ["Open dialog, button"]],
  });
  const results = await runSteps(instrument, spec(6));
  assert.equal(results[0]?.status, "pass");
  assert.equal(instrument.presses.length, 3, "stops pressing once heard");
});

test("running out of attempts fails, with everything heard kept as evidence", async () => {
  const instrument = fake({ Tab: [["one"], ["two"]] });
  const results = await runSteps(instrument, spec(2));
  assert.equal(results[0]?.status, "fail");
  assert.deepEqual(results[0]?.phrases, ["one", "two"]);
});

test("an instrument failure is an error, never a fail", async () => {
  // An error is our problem and unpublishable. A fail is a claim about the
  // library. The two must not be confusable.
  const broken: Instrument = {
    press: async () => {
      throw new Error("VoiceOver went away");
    },
    phrases: async () => [],
    clear: async () => {},
  };
  const results = await runSteps(broken, spec());
  assert.equal(results[0]?.status, "error");
  assert.match(results[0]?.error ?? "", /went away/);
});
