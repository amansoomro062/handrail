# Decision log

Every methodological decision that could affect a published score goes here, with its reasoning and date. When a maintainer disputes a result, this file is the answer.

Format: `## NNN — Title` · date · **Decision** · **Reasoning** · **Consequence**

---

## 001 — Assertions are grounded in the W3C APG, not our own judgement
*3 August 2026*

**Decision.** Every assertion cites a clause of the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) or a WCAG success criterion. Assertions that cannot cite one are not published.

**Reasoning.** The central threat to this project is a maintainer successfully framing a result as "one person's opinion about accessibility". Grounding in APG means a dispute is with the W3C's documented pattern, not with us. It also constrains scope creep, since "would be nicer if" ideas have nowhere to attach.

**Consequence.** Some real accessibility problems are out of scope because APG does not cover them. Accepted. A narrow defensible instrument beats a broad contestable one.

---

## 002 — The accessibility tree is read via CDP, not inferred from the DOM
*3 August 2026*

**Decision.** Role, name, state and hidden-ness come from Chrome DevTools Protocol `Accessibility.getFullAXTree`.

**Reasoning.** DOM inspection cannot answer the questions that matter. "Is the background hidden from assistive technology" depends on computed accessibility-tree exposure — `aria-hidden`, `inert`, sibling visibility, browser heuristics — not on which attributes happen to be present. The accessibility tree is what assistive technology consumes, so it is what we should measure.

**Consequence.** v1 is Chromium-only. Documented prominently. Firefox and WebKit differ in real, interesting ways, and cross-browser divergence is a v2 feature rather than a v1 blocker.

---

## 003 — React Spectrum is a calibration control, not a subject
*3 August 2026*

**Decision.** React Spectrum is implemented first. Any assertion it fails is presumed wrong until proven otherwise, and no results for any library are published until it scores ≥ 95%.

**Reasoning.** We need a known-good reading to distinguish "this library is broken" from "our test is broken". Without one, the first published false positive is indistinguishable from a true finding, and the project's credibility is gone before it has any.

**Consequence.** Roughly two weeks before any subject library is measured. Worth it.

---

## 004 — Maintainers are notified before publication and get a right of reply
*3 August 2026*

**Decision.** Fourteen days' private notice with full results and adapter source. Responses published alongside scores. Pre-launch fixes are reflected in the published score.

**Reasoning.** Ethically correct, and strategically the strongest available move. It converts the most influential people in the space into collaborators before anything is public, makes the project impossible to characterise as a hit piece, and produces a better launch story than a league table: *libraries fixed bugs because this exists.*

**Consequence.** A slower launch, and some findings will already be fixed by publication day. Both are fine. The goal is fewer broken comboboxes, not a bigger scandal.

---

## 005 — Adapters mount libraries with default configuration
*3 August 2026*

**Decision.** Adapters use the library as its own documentation recommends. Where accessible behaviour requires opt-in, we mount without the opt-in and record it.

**Reasoning.** Defaults are what ships to real users. A library that can be made accessible with sufficient expertise, but is not accessible as documented, produces inaccessible applications at scale — and that is the outcome the project cares about.

**Consequence.** Some libraries will object that they support the correct behaviour. The `notes` field and the right of reply exist for exactly this, and "accessible behaviour is available but not the default" is itself a publishable, useful finding.

---

## 013 — Adapters use only what the library exports, with no hand-written ARIA
*3 August 2026*

**Decision.** An adapter may use any component, prop or configuration the library exports. It may not hand-write ARIA attributes, ids or relationships, even when the library's own documentation instructs the developer to.

**Reasoning.** Forced by MUI. Its documented examples have the developer write `aria-labelledby` onto `Dialog`, and `aria-haspopup` / `aria-controls` / `aria-expanded` onto a menu's trigger `Button`. If we transcribe those, the score measures how faithfully we copied MUI's documentation, and every library would eventually score 100% because a sufficiently diligent developer can bolt correct ARIA onto anything.

The question the index answers is *what do you get from the library*. Radix and React Spectrum wire these relationships for you; MUI leaves several to the developer. That difference is real, it is the kind of thing someone choosing a library would want to know, and it disappears entirely if the adapter fills the gap.

**Consequence.** MUI's menu scores 78% and its accordion 97%, with most of the failures being absent ARIA that MUI documents as the developer's job. That is a *defensible* result but an easily *misread* one, so:

- every result carries adapter `notes` stating exactly this, and
- it is the first finding to raise with the maintainer in Phase 4, because "we deliberately did not write the ARIA your docs tell people to write" is a position they are entitled to argue with.

A library that documents the fix is genuinely better than one that does not. If MUI makes that case, the honest response is to publish it beside the score, not to change the adapter.

---

## 012 — A shared setup helper must not fail for the reason an assertion is testing
*3 August 2026*

**Decision.** Helpers that put a component into a state — `openMenu`, `openPopup`, `expandFirst` — try every route the APG permits. Only the assertion whose *subject* is a particular key pins that key.

**Reasoning.** MUI's menu scored **19%** on its first run. The actual defect was singular: its trigger does not open the menu on Down Arrow. But `openMenu` used Down Arrow, so nine further assertions failed with "the menu did not open" — none of them measuring what they claimed. Role, focus management, arrow navigation, Escape and focus restoration are all correct in MUI, and all were reported as failures.

With the fix, the same library scores **78%** and the four remaining failures are all real.

A 19% would have been catastrophically unfair, and nothing about it looked wrong: every failure message was specific and every one was, narrowly, true — the menu really had not opened.

**Consequence.** The same flaw existed in the combobox and accordion specs and was fixed in both before it produced a result. The general rule for spec authors: **if an assertion can fail because of setup rather than its subject, it is not measuring what its id says it measures.** Assertions must be independent, and shared helpers are where that independence quietly breaks.

---

## 011 — An APG "Optional" clause is not a requirement
*3 August 2026*

**Decision.** `accordion.panel-labelled-by-header` — asserting that an accordion panel has `role="region"` and takes its name from its header — has been removed. Assertions may only cite clauses the APG states as requirements.

**Reasoning.** It failed the React Spectrum control, which uses `role="group"` and no `aria-labelledby`. Under decision 003 that makes our assertion the suspect, and on checking, the APG lists both properties for this pattern under **Optional** — and explicitly warns against `role="region"` where it would proliferate landmarks in an accordion with many panels. Spectrum's choice is a correct reading of the specification.

The assertion was therefore our preference wearing the costume of a conformance result, which is exactly what decision 001 exists to prevent. Had it shipped, every library making the same legitimate choice would have carried a public failure for it.

**Consequence.** Accordion has 11 assertions rather than 12. More usefully, a rule for spec authors: when reading an APG pattern, the words *Optional*, *recommended* and *may* mark the boundary of what is publishable. Only *must*, *is* and *has* are assertable.

This is the first time the calibration control caught a defect in an assertion's *premise* rather than in its timing. The three earlier catches were all races; this one was a misreading of the specification, which no amount of waiting would have fixed.

---

## 010 — Anything that can change a result is pinned exactly
*3 August 2026*

**Decision.** Every library under test, plus `react`, `react-dom` and `playwright`, is pinned to an exact version in a pnpm catalog. Build and type tooling may use ranges. `pnpm check:versions` enforces it and must pass before publication.

**Reasoning.** The project had been running on caret ranges, and the drift was already large: `^1.1.4` was resolving to `1.1.23`, `^3.38.0` to `3.47.3`. Results were being written naming exact versions against a repository declaring ranges — so a clone a month later would install something different and produce a different score for what appeared to be the same commit. "Reproducible" was in the README as a claim rather than a property.

React and Playwright are on the exact list for the same reason as the subject libraries. Focus behaviour differs across React versions, and the accessibility tree is computed by the bundled browser. If two adapters ran different Reacts, a difference between two libraries would no longer be attributable to the libraries — which is the only thing the index is for.

**Consequence.** Upgrades become deliberate: bump the pin, re-run every affected spec, commit the results with the bump. The check specifically catches a **stale result** — a plausible-looking number describing a version nobody can install any more — which is the failure a human reviewer would never spot.

---

## 009 — Not shipping a component scores `n/a`, never zero
*3 August 2026*

**Decision.** An adapter may announce `supported: false` for a component its library does not provide. Every assertion is then recorded as `not-applicable`, excluded from the denominator, and the target scores `n/a`.

**Reasoning.** Radix has no combobox primitive. Its Select implements the APG *select-only* pattern, which has different requirements — running the combobox spec against it would measure the wrong thing, and scoring a zero would say something false about Radix's accessibility. Choosing not to ship a component is a scope decision.

**Consequence.** The index has gaps, and gaps are honest. The guard against abuse is that this may not be used for a component the library does ship but implements badly; adapter review is where that is caught.

---

## 008 — Harness ids may be stamped onto elements the adapter does not control
*3 August 2026*

**Decision.** `stampTestIds` attaches `data-testid` attributes by structural selector, maintained by a `MutationObserver`. It may place markers only — never ARIA attributes, roles, labels or event handlers.

**Reasoning.** Forced by React Spectrum's combobox: `data-testid` lands on a wrapper rather than the `input[role="combobox"]` the spec must address, and the listbox and options are portalled in only when the popup opens. Without stamping, whole categories of library are untestable, and "we could not adapt it" would quietly become "we only test libraries with convenient DOM".

**Consequence.** This is the sharpest tool in the project for producing a dishonest pass, so adapters using it get the closest review, and selectors must be structural rather than class-based. A structural selector fails loudly if the library stops producing that element; a cosmetic one may silently match the wrong node and measure something that is not the component at all.

---

## 007 — Focus assertions wait; they never sample once
*3 August 2026*

**Decision.** Every assertion about where focus has landed polls until it arrives or a timeout expires (`waitForFocus`, `waitForFocusWithin`). Reading `document.activeElement` a single time immediately after an interaction is forbidden.

**Reasoning.** Found the hard way on the very first run. `dialog.focus-restored-on-close` reported a failure against Radix, which restores focus correctly — the runner was simply reading focus before Radix had finished, because restoration happens after the exit transition rather than synchronously with the close.

Had that shipped, we would have published a false accusation against a well-built library in our first result set, which is precisely the failure mode this project cannot survive.

**Consequence.** Assertions take marginally longer. Irrelevant. The generalised lesson is broader than focus: **any assertion about state following an interaction must wait for it.** Libraries are entitled to be asynchronous, and a test that assumes otherwise is measuring its own impatience.

**Recurrence, same day.** The combobox spec reproduced this exactly: `combobox.enter-selects-active-option` failed against React Spectrum because the input's value was read the instant Enter was released, before selection had committed. React Spectrum was correct; the runner was impatient again. Fixed with `waitForValue`.

Twice in one day, in the same shape, in code written by someone who had already written this entry. Treat "read state immediately after a keypress" as a defect on sight during review, not as something to catch by testing.

**Third recurrence — and the most serious.** `menu.arrow-moves-between-items` reported a **blocker** against Radix's dropdown menu: "Down Arrow did not move to a different item". Radix moves roving focus in an effect rather than synchronously in the keydown handler, and the runner read the active item before it moved. With the wait, Radix scores 13/13.

This one would have published a blocker-level accusation, against a named library, in the first result set that contained a finding at all. It was caught only because a calibration control existed to make the result suspicious. Nothing about the failure looked wrong on its face — the message was specific, the expected and actual were populated, and the claim was plausible.

The generalisation now has teeth: **an assertion that reads state after an interaction without waiting is broken, whether or not it currently passes.** The three that have appeared so far were found by luck and discipline, not by design. Auditing the remaining specs for this pattern is worth more than adding new assertions.

---

## 006 — The headline unit is a component, not a library
*3 August 2026*

**Decision.** Scores are presented per component. Library-level aggregates are shown only as secondary, always beside a blocker count.

**Reasoning.** Averaging across components of very different maturity produces a number that is technically computed and practically meaningless. It also invites exactly the sports-league framing that would make maintainers defensive rather than cooperative.

**Consequence.** Less shareable than a single ranked table. Accepted deliberately.
