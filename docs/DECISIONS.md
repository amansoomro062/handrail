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

## 007 — Focus assertions wait; they never sample once
*3 August 2026*

**Decision.** Every assertion about where focus has landed polls until it arrives or a timeout expires (`waitForFocus`, `waitForFocusWithin`). Reading `document.activeElement` a single time immediately after an interaction is forbidden.

**Reasoning.** Found the hard way on the very first run. `dialog.focus-restored-on-close` reported a failure against Radix, which restores focus correctly — the runner was simply reading focus before Radix had finished, because restoration happens after the exit transition rather than synchronously with the close.

Had that shipped, we would have published a false accusation against a well-built library in our first result set, which is precisely the failure mode this project cannot survive.

**Consequence.** Assertions take marginally longer. Irrelevant. The generalised lesson is broader than focus: **any assertion about state following an interaction must wait for it.** Libraries are entitled to be asynchronous, and a test that assumes otherwise is measuring its own impatience.

---

## 006 — The headline unit is a component, not a library
*3 August 2026*

**Decision.** Scores are presented per component. Library-level aggregates are shown only as secondary, always beside a blocker count.

**Reasoning.** Averaging across components of very different maturity produces a number that is technically computed and practically meaningless. It also invites exactly the sports-league framing that would make maintainers defensive rather than cooperative.

**Consequence.** Less shareable than a single ranked table. Accepted deliberately.
