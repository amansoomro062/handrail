# Deliberately broken fixture

A naive dialog that gets almost everything wrong, on purpose.

**Never publish results for this target.** It exists to test the runner, not a library.

```bash
pnpm --filter @curbcut/fixture-broken run dev
pnpm curbcut run --target _fixture-broken --component dialog \
  --base-url http://localhost:5199 \
  --expect adapters/_fixture-broken/expected.json
```

`--expect` compares every assertion against the catalogue in `expected.json` and exits non-zero on any mismatch.

## Why this exists

A test suite that has never failed has not been validated, it has only been run. Radix passing 12 of 12 is consistent with the runner working correctly *and* with every assertion being silently broken. This fixture distinguishes the two.

It measures both error directions, and they are not equally serious:

- **A false negative** — a defect we fail to detect — means the index misses something. Bad.
- **A false positive** — an assertion that fails against correct behaviour — means we accuse a maintainer of a defect that does not exist. That is the mistake this project cannot recover from.

The catalogued defects:

| Defect | Assertions that must fail |
| --- | --- |
| Dialog has no accessible name | `has-accessible-name` |
| Focus is not moved into the dialog | `focus-moves-in` |
| No focus trap | `focus-trapped-forward`, `focus-trapped-backward` |
| No Escape handler | `escape-closes` |
| Focus is not restored on close | `focus-restored-on-close` |
| Background is never hidden from assistive technology | `background-inert` |
| Icon-only close button with no label | `close-has-accessible-name` |

Everything else must still pass. An assertion that fails here **and** on React Spectrum is over-strict and needs softening, not celebrating.

## It is vanilla HTML on purpose

No React, no build step, no components — and the runner cannot tell. That is the proof that the harness protocol is genuinely HTTP and HTML, which is what will let Vue, Svelte and Web Component adapters slot in later without the engine changing.
