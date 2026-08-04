# Writing a component spec

A spec is the definition of correct behaviour for one component pattern. It is the deepest work in the project and the most consequential: an adapter bug produces one wrong result, but a spec bug produces a wrong result for **every library at once**.

## Before writing anything

1. Read the APG pattern end to end, including the keyboard interaction table
2. Read the WAI-ARIA specification for the roles involved
3. Find the two or three worst-known implementations in the wild and work out what they get wrong. Those failures are what the spec exists to catch

## The rule

**Every assertion cites an APG clause or a WCAG success criterion.**

If you cannot cite one, you are encoding an opinion. Opinions may be correct and still have no place in a conformance result, because the moment a maintainer can characterise a finding as one person's taste, every other finding becomes arguable too.

## Assertion design

**Test one behaviour.** `dialog.focus-trapped-forward` and `dialog.focus-trapped-backward` are separate because a library can genuinely get one right and the other wrong, and a maintainer needs to know which.

**Fail with evidence.** Every failure needs `expected` and `actual`, phrased so a maintainer can act without rerunning anything:

```
expected: focus remains within the dialog
actual:   [data-testid="hr-after"] named "After"
```

**Pick severity from the definitions in [`SCORING.md`](SCORING.md)**, based on what a user cannot do, not on how egregious the code looks. `blocker` means the task is impossible by that input method. It is not a synonym for "bad".

**Handle absence deliberately.** If the component genuinely does not apply, return `notApplicable` with a reason. Never return `fail` for something a library never claimed to implement.

**Never assume a previous assertion ran.** The runner reloads the harness before each one. Set up your own state.

## Adding the harness elements

New elements go in `requiredElements` and in [`HARNESS-PROTOCOL.md`](HARNESS-PROTOCOL.md) *before* the spec is written, so adapter authors can work ahead. Mark elements that only exist after activation with `requiredAtLoad: false`.

Prefer interactive elements over generic containers for anything the accessibility tree is asked about, a `<button>` is reliably present in the tree, a `<div>` is not.

## Validating a new spec

In this order, without exception:

1. **React Spectrum first.** Any failure there is presumed to be a bug in your assertion. Investigate every one and record the resolution in [`DECISIONS.md`](DECISIONS.md).
2. **The broken fixture.** `adapters/_fixture-broken` has catalogued defects. Your assertion must catch the ones it is meant to and stay silent on the rest.
3. **Only then** point it at a subject library.

An assertion that has never failed has not been tested, it has only been run. Break something on purpose and watch it fail for the right reason before you trust it.

## Versioning

`ComponentSpec.version` is recorded in every result. Bump it when assertions are added, removed, or have their severity changed, and record why in the decision log. Results carrying different spec versions are not directly comparable, and the site must not present them as though they were.
