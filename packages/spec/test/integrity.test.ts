/**
 * The project's own rules, enforced.
 *
 * Most of these are written down in docs/DECISIONS.md, where they rely on a
 * reviewer remembering them. A rule that only exists in prose gets broken the
 * first time someone is in a hurry, so the ones that can be checked mechanically
 * are checked here.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { SEVERITY_WEIGHT, specs, getSpec, harnessPath, testIdSelector } from "../src/index.js";

const allSpecs = Object.values(specs);
const allAssertions = allSpecs.flatMap((spec) =>
  spec.assertions.map((assertion) => ({ spec, assertion })),
);

test("there are specs to check at all", () => {
  assert.ok(allSpecs.length >= 5, `expected at least 5 specs, found ${allSpecs.length}`);
  assert.ok(allAssertions.length >= 60, `expected at least 60 assertions, found ${allAssertions.length}`);
});

/* ------------------------------------------------------------------ *
 * Decision 001: every assertion cites a normative source
 * ------------------------------------------------------------------ */

test("every assertion cites an APG clause or a WCAG success criterion", () => {
  const uncited = allAssertions
    .filter(({ assertion }) => !assertion.refs.apg && !assertion.refs.wcag && !assertion.refs.aria)
    .map(({ assertion }) => assertion.id);

  assert.deepEqual(
    uncited,
    [],
    "An assertion without a citation is our opinion, and opinions are not publishable as " +
      "conformance results. See docs/DECISIONS.md 001.",
  );
});

test("every cited URL points at w3.org", () => {
  const foreign: string[] = [];
  for (const { assertion } of allAssertions) {
    for (const url of [assertion.refs.apg, assertion.refs.aria, assertion.refs.wcagUrl]) {
      if (url && !/^https:\/\/www\.w3\.org\//.test(url)) foreign.push(`${assertion.id}: ${url}`);
    }
  }
  assert.deepEqual(foreign, [], "Citations must resolve to the specification, not to a blog post.");
});

/* ------------------------------------------------------------------ *
 * Identity and structure
 * ------------------------------------------------------------------ */

test("assertion ids are unique across every spec", () => {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  for (const { spec, assertion } of allAssertions) {
    const previous = seen.get(assertion.id);
    if (previous) duplicates.push(`${assertion.id} in both ${previous} and ${spec.id}`);
    else seen.set(assertion.id, spec.id);
  }
  assert.deepEqual(duplicates, [], "Ids appear in published results and must identify one check.");
});

test("assertion ids are namespaced to their component", () => {
  const wrong = allAssertions
    .filter(({ spec, assertion }) => !assertion.id.startsWith(`${spec.id}.`))
    .map(({ spec, assertion }) => `${assertion.id} should start with "${spec.id}."`);
  assert.deepEqual(wrong, []);
});

test("assertion ids are stable-looking: lowercase, dot and dash only", () => {
  const malformed = allAssertions
    .map(({ assertion }) => assertion.id)
    .filter((id) => !/^[a-z]+\.[a-z0-9-]+$/.test(id));
  assert.deepEqual(malformed, []);
});

test("every assertion has a title and a rationale written for a person", () => {
  const thin = allAssertions
    .filter(({ assertion }) => assertion.title.length < 10 || assertion.rationale.length < 30)
    .map(({ assertion }) => assertion.id);
  assert.deepEqual(
    thin,
    [],
    "The rationale is published beside the failure. It has to explain what a person cannot do.",
  );
});

test("every severity is one the scoring model knows", () => {
  const unknown = allAssertions
    .filter(({ assertion }) => !(assertion.severity in SEVERITY_WEIGHT))
    .map(({ assertion }) => `${assertion.id}: ${assertion.severity}`);
  assert.deepEqual(unknown, []);
});

/* ------------------------------------------------------------------ *
 * Harness contract
 * ------------------------------------------------------------------ */

test("every spec declares the elements its adapters must provide", () => {
  for (const spec of allSpecs) {
    assert.ok(spec.requiredElements.length > 0, `${spec.id} declares no required elements`);
    for (const element of spec.requiredElements) {
      assert.match(
        element.testId,
        /^hr-[a-z0-9-]+$/,
        `${spec.id}: "${element.testId}" does not follow the hr- prefix the protocol specifies`,
      );
      assert.ok(element.description.length > 5, `${spec.id}: ${element.testId} has no useful description`);
    }
  }
});

test("required element ids are unique within a spec", () => {
  for (const spec of allSpecs) {
    const ids = spec.requiredElements.map((e) => e.testId);
    assert.equal(new Set(ids).size, ids.length, `${spec.id} declares a duplicate element id`);
  }
});

test("every spec has at least one element present at load", () => {
  for (const spec of allSpecs) {
    assert.ok(
      spec.requiredElements.some((e) => e.requiredAtLoad),
      `${spec.id} would let an adapter render nothing and still be considered valid`,
    );
  }
});

test("every spec names the APG pattern it derives from", () => {
  for (const spec of allSpecs) {
    assert.match(spec.apgPattern, /^https:\/\/www\.w3\.org\/WAI\/ARIA\/apg\//, spec.id);
    assert.match(spec.version, /^\d+\.\d+\.\d+$/, `${spec.id} has no usable spec version`);
  }
});

/* ------------------------------------------------------------------ *
 * Lookup and protocol helpers
 * ------------------------------------------------------------------ */

test("getSpec returns specs by id and refuses unknown ones by name", () => {
  for (const spec of allSpecs) assert.equal(getSpec(spec.id).id, spec.id);
  assert.throws(() => getSpec("carousel"), /Unknown component spec "carousel"/);
});

test("harness paths and selectors match the documented protocol", () => {
  assert.equal(harnessPath("dialog"), "/harness/dialog");
  assert.equal(testIdSelector("hr-trigger"), '[data-testid="hr-trigger"]');
});

test("severity weights are ordered by how much a failure costs a user", () => {
  assert.ok(SEVERITY_WEIGHT.blocker > SEVERITY_WEIGHT.serious);
  assert.ok(SEVERITY_WEIGHT.serious > SEVERITY_WEIGHT.moderate);
  assert.ok(SEVERITY_WEIGHT.moderate > SEVERITY_WEIGHT.minor);
  assert.ok(SEVERITY_WEIGHT.minor > 0);
});

/* ------------------------------------------------------------------ *
 * Cross-spec sanity
 * ------------------------------------------------------------------ */

test("tabs and accordion assert opposite tab-sequence behaviour", () => {
  // These two patterns look identical to a sighted user and have opposite
  // keyboard contracts. Copying one into the other is a real defect, and the
  // pair only catches it while both assertions exist.
  const tabs = getSpec("tabs").assertions.map((a) => a.id);
  const accordion = getSpec("accordion").assertions.map((a) => a.id);
  assert.ok(tabs.includes("tabs.tablist-is-one-tab-stop"));
  assert.ok(accordion.includes("accordion.headers-are-tab-stops"));
});

test("no spec asserts arrow-key navigation for accordions", () => {
  // The APG lists Up, Down, Home and End for accordions under Optional.
  // Requiring them would be our preference rather than the specification's.
  const arrowAssertions = getSpec("accordion")
    .assertions.map((a) => a.id)
    .filter((id) => /arrow|home|end/.test(id));
  assert.deepEqual(arrowAssertions, [], "See docs/DECISIONS.md 011.");
});
