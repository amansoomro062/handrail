# Scoring

The scoring model exists to be argued with. Every input is published, so anyone who dislikes our weightings can recompute the whole index with their own.

## Statuses

| Status           | Meaning                                                                      | Counts toward score |
| ---------------- | ---------------------------------------------------------------------------- | ------------------- |
| `pass`           | Behaviour matched the assertion                                               | Yes                 |
| `fail`           | Behaviour did not match                                                       | Yes                 |
| `not-applicable` | The pattern genuinely does not apply to this library                          | No                  |
| `error`          | The assertion could not be evaluated, harness or runner fault                | No                  |

`error` never counts. If we could not run a check, that is our problem and we do not get to score someone down for it. A run with any `error` is flagged in the UI and is not eligible for publication until resolved.

## Severity weights

| Severity   | Weight | Definition                                                             |
| ---------- | ------ | ---------------------------------------------------------------------- |
| `blocker`  | 10     | A user relying on this input method **cannot complete the task at all** |
| `serious`  | 5      | The task is completable but confusing, or state is not communicated     |
| `moderate` | 2      | Behaviour departs from the specified pattern; users are inconvenienced  |
| `minor`    | 1      | Technically non-conforming, low practical impact                        |

Severity is a property of the assertion, fixed at authoring time, not adjusted per library after seeing results. Changing a severity is a spec version bump and goes in [`DECISIONS.md`](DECISIONS.md) with a reason.

## Formula

```
score = 100 × (Σ weight of passed assertions) / (Σ weight of applicable assertions)
```

Applicable = `pass` + `fail`. That is the whole calculation. It is deliberately simple enough to verify by hand from the published JSON, a scoring model nobody can check is a scoring model nobody should trust.

## Presentation rules

These are not cosmetic preferences. They are the difference between a useful reference and a misleading one.

**Never lead with the aggregate number.** The headline unit is a component, not a library. "Radix Dialog: 11/12" is a claim we can defend. "Radix: 94%" is close to meaningless, because it averages across components with wildly different maturity.

**Always show the blocker count separately.** A library with one blocker and thirty passes scores well and is still unusable for someone navigating by keyboard. A weighted average cannot express that, so the blocker count is displayed next to every score, always.

**Always pin the version.** `@radix-ui/react-dialog@1.1.4`, never "Radix". Scores describe a version, not a project.

**Always link the evidence.** Every failure links to the APG clause, the WCAG success criterion, a reproduction URL, and a downloadable Playwright trace. A failure a reader cannot verify themselves should not be published.

**Always state the ceiling.** On every page:

> A high score means no violations were detected by automated testing. It does not mean the component is accessible. Automated tests cannot evaluate whether a label is meaningful, whether a reading order makes sense, or whether the experience is genuinely usable with a screen reader. Those require human judgement and disabled users. This project is a floor, not a ceiling.

That paragraph is not a disclaimer to be tucked into a footer. It is the honest description of what automated conformance testing is, and stating it prominently is what separates this from the compliance-theatre tools that gave automated accessibility testing a bad name.

## What is deliberately not scored

- **Documentation quality.** Real signal, not measurable by this harness.
- **Bundle size, API ergonomics, styling.** Not our remit; there are better tools.
- **Effort or intent.** A library maintained by two volunteers and one funded by a large company are scored identically, because a keyboard user's experience does not depend on the maintainer's headcount. Context belongs in the writeup, not the number.

## Regressions

Every result is stored against its version, so the index carries history:

```
@radix-ui/react-dialog
  1.1.2  ██████████ 100%
  1.1.3  ██████████ 100%
  1.1.4  ████████░░  83%  ← regression: dialog.focus-restored
```

This is the most valuable output of the project and it only exists because results are versioned and continuous. A regression alert is worth more to a maintainer than any league table, and it is the thing that makes the index worth subscribing to rather than reading once.
