# Contributing to Railing

## The one rule

**We notify maintainers before we publish anything about their library.**

No exceptions, no "but this one is really bad", no soft launches, no screenshots on social media ahead of the notification window. This is in [`docs/DECISIONS.md`](docs/DECISIONS.md) as decision 004 and it is not up for negotiation. Breaking it damages something the project cannot rebuild.

## Where to start

**Writing an adapter** is the highest-value contribution and needs no knowledge of the test engine. Roughly fifty lines. See [`docs/ADAPTERS.md`](docs/ADAPTERS.md).

**Auditing an existing adapter** is the second highest. An unfair result caused by a badly mounted component is the biggest risk here, so a PR that finds one is genuinely more valuable than a new feature.

**Writing a component spec** is the deepest work. Every assertion must cite an APG clause or WCAG success criterion, and every new spec is run against React Spectrum before any other library. See [`docs/SPEC-AUTHORING.md`](docs/SPEC-AUTHORING.md).

## Standards for assertions

An assertion is publishable only if it:

- cites an APG clause or WCAG success criterion
- passes against React Spectrum, or has a written justification for why not
- fails against the broken fixture, if the fixture covers its defect
- reports enough detail, expected, actual, selector, for a stranger to reproduce it
- has a severity matching the [definitions in `SCORING.md`](docs/SCORING.md)

"This would be better if" is not an assertion. It is an opinion, and opinions are not publishable as conformance results.

## If you maintain a library we test

You are especially welcome here.

- Tell us if we mounted your component wrong. Adapter bugs are our fault and we will fix them and correct any published result.
- Dispute an assertion. If you can show it departs from APG, we will change it and record why in the decision log.
- Send an adapter for your own library. We will say on the results page that you wrote it.

You will always hear from us privately before anything is published.

## Code

- TypeScript, strict mode
- The runner must never contain library-specific logic. If it needs a special case, the fix belongs in the adapter or the protocol
- Assertions get real detail on failure, not `expect(x).toBe(true)`
- Tests for the test engine live in `packages/runner/test`

## Conduct

Be decent. Accessibility work attracts people who care a great deal, and disagreements here are usually two people wanting the same outcome. Assume that.

Reports of behaviour that falls short: open an issue or contact the maintainers privately.
