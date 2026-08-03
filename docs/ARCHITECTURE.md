# Architecture

## The problem

To test a component library you must render its components. Every library has a different API:

```tsx
// Radix
<Dialog.Root><Dialog.Trigger/><Dialog.Content/></Dialog.Root>

// MUI
<Modal open={open} onClose={close}><Box/></Modal>

// Chakra
<Modal isOpen={open} onClose={close}><ModalContent/></Modal>
```

Different props, different composition, different DOM output. There is no single test that runs against all of them.

## The inversion

Rather than teaching the tests about every library, we require every library to present itself the same way.

```
packages/spec       what correct behaviour is       (library-agnostic, from W3C APG)
adapters/*          how to mount THIS library       (library-specific, ~50 lines)
packages/runner     executes specs against a URL    (library-agnostic, knows nothing)
packages/report     scores and renders results      (library-agnostic)
```

The runner receives a base URL and a component name. It navigates to `/harness/dialog`, waits for the ready signal, and executes the Dialog spec against whatever it finds. It has no idea whether that page is powered by Radix or MUI, and it must never be able to tell.

**This is the load-bearing constraint of the codebase.** If the runner ever needs a special case for a specific library, the design has failed and the fix belongs in the adapter or the protocol — never in the runner.

## Packages

### `@curbcut/spec`

Canonical component contracts. Each spec is a `ComponentSpec` containing metadata and an array of `Assertion`s.

An assertion is deliberately part data, part code:

```ts
{
  id: "dialog.focus-trapped-forward",
  title: "Tab from the last focusable element stays inside the dialog",
  severity: "blocker",
  refs: { apg: "...", wcag: "2.4.3", wcagUrl: "..." },
  run: async (ctx) => { /* Playwright */ }
}
```

The metadata is serialisable, so it can be rendered into the site and the report without executing anything. The `run` function is code, because real behavioural assertions are not expressible as data without inventing a worse programming language.

Every assertion **must** cite an APG clause or a WCAG success criterion. An assertion that cannot cite one is our opinion, and our opinions are not publishable as conformance results.

### `@curbcut/harness-kit`

The shared contract, imported by adapters. Exports the protocol constants (test IDs, ready signal, metadata shape) and a `mountHarness` helper for React adapters.

Adapters depend on this so that a protocol change is a version bump rather than a scavenger hunt through seven repositories.

### `@curbcut/runner`

Playwright-based execution engine.

- `driver.ts` — primitives: keyboard traversal, focus tracking, accessibility-tree queries via the Chrome DevTools Protocol
- `execute.ts` — runs a spec against a base URL, produces a `RunResult`
- `cli.ts` — the `curbcut run` command

The accessibility tree comes from CDP `Accessibility.getFullAXTree`, not from the DOM. This matters: it gives us the *computed* role, name and state as the browser exposes them to assistive technology, including whether a node is ignored or hidden. A DOM-level check cannot answer "is the background actually hidden from a screen reader"; the accessibility tree can.

The cost is that v1 is Chromium-only. That is an accepted, documented limitation.

### `@curbcut/report`

Scoring, JSON output, Markdown summaries, and the shields.io badge endpoint. Kept separate from the runner so that anyone can re-score raw results with different weightings — which is the whole point of publishing them.

## The harness protocol

Fully specified in [`HARNESS-PROTOCOL.md`](HARNESS-PROTOCOL.md). In summary, an adapter must:

1. Serve `/harness/<component>` over HTTP
2. Render the required elements, each carrying a fixed `data-testid`
3. Expose `window.__CURBCUT__` with library name, version and adapter version
4. Set `data-curbcut-ready="true"` on `<body>` once mounted

That is the entire contract. Note what it does *not* mention: React, bundlers, build tools, or any JavaScript at all. **The protocol is HTTP and HTML.** A Vue adapter, a Svelte adapter, a Web Components adapter or a hand-written static HTML page are all equally valid, and the runner cannot distinguish between them.

This is why the framework-agnostic protocol is worth the small amount of extra ceremony now: it is what makes expansion beyond React a matter of writing adapters rather than rewriting the engine.

## Fairness controls

The project's central technical risk is not a bug in the runner. It is **an adapter that mounts a library badly and produces an unfair failure.**

Three controls:

1. **A calibration control.** React Spectrum is tested first. A failure there is treated as evidence that our assertion is wrong until proven otherwise.
2. **A broken fixture.** `adapters/_fixture-broken` has deliberate, catalogued defects. The runner must detect exactly those and no others — this makes the false-positive rate a measured number rather than an assumption.
3. **Maintainer review.** Adapter source is sent to maintainers before publication, specifically so they can tell us we mounted their component wrong.

## Result shape

```jsonc
{
  "schemaVersion": 1,
  "target": { "id": "radix", "name": "Radix UI", "versions": { "@radix-ui/react-dialog": "1.1.4" } },
  "component": "dialog",
  "specVersion": "1.0.0",
  "runnerVersion": "0.1.0",
  "environment": { "browser": "chromium", "browserVersion": "...", "os": "..." },
  "startedAt": "2026-08-03T18:00:00.000Z",
  "assertions": [
    {
      "id": "dialog.focus-trapped-forward",
      "status": "fail",
      "severity": "blocker",
      "detail": "Focus left the dialog after 4 Tab presses and landed on [data-testid=cc-after]",
      "expected": "focus remains within [data-testid=cc-dialog]",
      "actual": "focus on button[data-testid=cc-after]",
      "refs": { "apg": "...", "wcag": "2.4.3" },
      "durationMs": 412
    }
  ]
}
```

Everything needed to reproduce, dispute or re-score a result is in the file. Nothing is only in the website.
