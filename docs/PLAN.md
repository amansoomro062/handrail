# Curb Cut — end-to-end plan

Written 3 August 2026. Assumes evenings and weekends, roughly 8–12 hours a week, one person, with contributors arriving only after launch.

The plan is built around one constraint that shapes everything else:

> **Credibility is the only asset this project has.** One unfair result, published early, destroys it permanently and cannot be recovered by being right afterwards. Every phase below is ordered to protect that.

---

## Phase 0 — Foundations
**Weeks 1–2 · 3–16 August · ~20 hours**

Prove the architecture works end to end on the narrowest possible slice: one component, one library.

- [x] Monorepo, workspace, TypeScript config
- [x] Harness protocol defined and documented
- [x] Runner engine: Playwright driver, CDP accessibility-tree access, keyboard primitives
- [x] Dialog spec — 12 assertions grounded in APG
- [x] Radix reference adapter
- [x] Scoring and JSON report output
- [x] `pnpm install` clean, Chromium installed, full run green locally
- [x] Broken fixture (`adapters/_fixture-broken`) with a catalogued defect list
- [x] `--expect` calibration mode, reporting false positives and false negatives separately

**Exit criteria — met.** `curbcut run --target radix --component dialog` scores 12/12, and the broken fixture produces exactly the 8 catalogued failures with no false positives.

Two findings worth carrying forward:

**The first run reported a Radix failure that was our bug.** `dialog.focus-restored-on-close` failed because the runner sampled focus the instant the dialog hid, before Radix had restored it. Focus movement is frequently asynchronous — after an exit transition, or a microtask later. Every focus assertion now waits rather than sampling once, via `waitForFocus` / `waitForFocusWithin`.

This is the whole reason Phase 1 exists, and it appeared within minutes of the first run against a well-built library. Assume there are more.

**The broken fixture is vanilla HTML with no framework.** That was not a shortcut — it is the standing proof that the harness protocol is genuinely HTTP and HTML rather than React-shaped, which is what will let Vue and Web Component adapters slot in later without touching the engine.

---

## Phase 1 — Calibration
**Weeks 3–4 · 17–30 August · ~20 hours**

This is the most important phase in the plan and the easiest to skip. Do not skip it.

- [ ] Build the **React Spectrum** adapter as a calibration control
- [ ] Run the Dialog spec against it
- [ ] Investigate *every single failure* by hand

React Spectrum is widely regarded as the accessibility gold standard. If it fails an assertion, the overwhelmingly likely explanation is that **our assertion is wrong**, not that Adobe is wrong. Each failure gets one of three resolutions, recorded in `docs/DECISIONS.md`:

1. The assertion is over-strict → soften or remove it
2. The adapter is wrong → fix the adapter
3. It is a genuine defect → open an issue upstream, keep the assertion

- [ ] Build a **deliberately broken reference adapter** (`adapters/_fixture-broken`) with known, catalogued defects, and assert the runner detects exactly those and no others

**Exit criteria:** React Spectrum scores ≥ 95% on Dialog, every remaining failure has a written justification, and the broken fixture produces the exact expected failure set. False positives are now measurable, not hypothetical.

---

## Phase 2 — Coverage
**Weeks 5–8 · 31 August – 27 September · ~45 hours**

Widen along both axes. Specs first, then adapters, because a spec bug found after six adapters exist costs six times as much.

**Specs** (in this order — most commonly broken first):
- [ ] Combobox — the hardest and most frequently wrong pattern in the industry
- [ ] Menu (menu button + menu)
- [ ] Tabs
- [ ] Accordion / Disclosure

**Adapters:**
- [ ] shadcn/ui — pin both the CLI version and the generation date
- [ ] MUI
- [ ] Headless UI
- [ ] Chakra UI
- [ ] Ant Design

Run each new spec against React Spectrum first, as in Phase 1, before pointing it at anyone else.

**Exit criteria:** 5 specs × 7 targets = 35 result sets, all reproducible from a cold clone. Non-applicable results (a library genuinely has no combobox) are recorded as `not-applicable`, never as a failure.

---

## Phase 3 — Publication infrastructure
**Weeks 9–10 · 28 September – 11 October · ~25 hours**

- [ ] Static site: index table, per-library pages, per-assertion detail
- [ ] Every failure links to the APG clause, the WCAG success criterion, a reproduction URL, and a downloadable Playwright trace
- [ ] Raw JSON published alongside, so anyone can re-score with their own weightings
- [ ] Badge endpoint (shields.io JSON schema)
- [ ] Version history view — the regression tracker
- [ ] Scheduled CI: re-run on a weekly cron and on new releases of tracked packages

**Exit criteria:** a stranger can reach a specific failing assertion in three clicks and reproduce it locally without asking us anything.

---

## Phase 4 — Maintainer notification
**Weeks 11–12 · 12–25 October · ~15 hours**

Nothing is public yet. Every maintainer gets, privately:

- Their full results with reproduction steps
- The adapter source, so they can check we mounted their component fairly
- Fourteen days to respond, correct us, or ship a fix
- An explicit offer: **if you fix it before launch, we publish the fixed score**

Track it all in `docs/NOTIFICATIONS.md`.

This phase is ethical, but it is also the strategically strongest move available. It converts the seven most influential people in the space from adversaries into collaborators before a single word is public. *"Three libraries fixed bugs before we published"* is a better launch story than any league table, and it makes the project impossible to characterise as a hit piece.

**Exit criteria:** every target notified, every response recorded, every disputed assertion either defended in writing or withdrawn.

---

## Phase 5 — Launch
**Week 13 · late October / early November · ~15 hours**

Order matters.

1. **Secure one endorsement first.** Bruce Lawson [publicly asked for exactly this to exist](https://brucelawson.co.uk/2021/component-libraries-accessibility-and-transparency/) and never got it. Adrian Roselli, Scott O'Hara, Sara Soueidan and Hidde de Vries are the others whose audience *is* the audience. One of them boosting it is worth more than a week on the front page of Hacker News.
2. **Publish the site and the writeup together.** The writeup is the artefact people share: *"We tested seven component libraries against the W3C's own specification. Here is what we found."* Lead with methodology and the maintainer-response process, not with the ranking.
3. **Then** post to Hacker News, Lobsters, r/reactjs, and the a11y communities.
4. Open the adapter-contribution call the same day, while attention is peaking.

**Exit criteria:** published, with maintainer responses visible on the page from hour one.

---

## Phase 6 — Compounding
**Ongoing**

The project now has to survive its founder's attention, which is what kills every index project.

- **Badges** — `a11y: 94%` in a README linking back to the index, pulling in the next maintainer who wants one. This is the growth loop and it runs unattended.
- **Community adapters** — every new library is someone else's fifty lines, not yours.
- **The regression feed** — automated alerts when a tracked library's score drops. This is the thing journalists and maintainers subscribe to, and it generates news without you writing any.
- **Framework expansion** — Vue, Svelte, Web Components. The protocol already allows it; resist until React is genuinely finished.
- **Talks** — axe-con, a11yTO, Smashing, State of the Browser. This is where the project turns into recognition.

---

## Risk register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| **A badly written adapter blames a library unfairly** | Fatal | Calibration phase; maintainer review before publication; adapters reviewed harder than test code |
| **A wrong assertion produces false positives at scale** | Fatal | React Spectrum control; broken-fixture test; every assertion cites an APG clause |
| Maintainer hostility | High | APG grounding, 14-day notice, right of reply published alongside |
| Founder attention decays | High | Community adapter model built in from commit one, not retrofitted |
| Scope creep across frameworks | Medium | Seven React libraries done properly beats thirty done shallowly |
| Chromium-only accessibility tree | Medium | Documented limitation for v1; Firefox and WebKit are a v2 concern |
| Automated testing cannot see everything | Known | Stated plainly on every page: a high score means *no detected violations*, not *accessible* |

---

## What "done" looks like for v1

- 5 components × 7 libraries, continuously re-tested
- Every result reproducible by a stranger from a cold clone
- At least three maintainers have engaged, and at least one bug is fixed upstream because of us
- Badges live in at least one library's README
- The methodology has survived public scrutiny by people who know more about accessibility than we do

Note what is not on that list: stars. Stars are a consequence of the above, not a target. Optimising for them directly is how this project would end up as another abandoned leaderboard.
