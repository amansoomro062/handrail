# Curb Cut

**Curb Cut runs every major UI component library against the W3C's own accessibility specification, continuously, and publishes the results.**

Pick a component library today and you are choosing on vibes. Nobody can tell you whether its combobox is actually operable by keyboard, whether its dialog traps focus correctly, or whether the version you upgraded to last week quietly broke either of those things.

Curb Cut answers that question with evidence, in public, on every release.

> The *curb cut effect*: the kerb ramps cut for wheelchair users turned out to help everyone with a pram, a suitcase or a delivery trolley. Accessibility work is rarely only for the people it was built for.

---

## Why libraries and not websites

Testing individual websites is retail. Testing the libraries they are built from is wholesale.

One broken combobox in a popular library is a broken combobox in tens of thousands of downstream applications. Fix it once upstream and it is fixed everywhere at once — including in the apps whose teams will never run an accessibility audit of their own.

## What makes this different from an audit blog post

|                    | One-off audits         | Curb Cut                                  |
| ------------------ | ---------------------- | ----------------------------------------- |
| Cadence            | Once, then stale       | Every release, forever                    |
| Comparability      | One library at a time  | Same assertions across every library      |
| Basis              | Auditor's judgement    | W3C ARIA Authoring Practices Guide        |
| Reproducibility    | Trust the author       | Raw JSON + replayable Playwright traces   |
| Regressions        | Invisible              | Tracked per version                       |

That last row is the one that compounds. *"This library was compliant in v2 and broke in v3"* is a finding no blog post can produce, and it becomes more valuable the longer the project runs.

---

## How it works

The hard problem is that you cannot write one test that runs everywhere. `<Dialog>` in Radix is not `<Modal>` in MUI is not `<AlertDialog>` in Chakra — different props, different DOM, different everything.

So we invert it.

```
┌──────────────────┐     mounts        ┌────────────────────────┐
│  Library under   │ ────────────────► │  Adapter               │
│  test            │                   │  (~50 lines, per lib)  │
└──────────────────┘                   └───────────┬────────────┘
                                                   │ serves
                                                   ▼
                                       ┌────────────────────────┐
                                       │  /harness/dialog       │
                                       │  fixed URL, fixed IDs  │
                                       └───────────┬────────────┘
                                                   │ HTTP
                                                   ▼
┌──────────────────┐     asserts       ┌────────────────────────┐
│  Component spec  │ ────────────────► │  Runner                │
│  (from W3C APG)  │                   │  library-agnostic      │
└──────────────────┘                   └───────────┬────────────┘
                                                   │
                                                   ▼
                                       ┌────────────────────────┐
                                       │  Result JSON + traces  │
                                       └────────────────────────┘
```

1. **Component specs** define canonical contracts — Dialog, Combobox, Tabs, Menu, Accordion — with assertions derived directly from the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/).
2. **Adapters** mount a given library's version of that component into a fixed harness at a fixed URL with fixed test IDs.
3. **The runner** navigates to the URL and executes the spec. It never knows which library it is testing.

Three consequences fall out of this design, and they are the whole project:

- **Grounding assertions in APG makes the rubric defensible.** When a maintainer objects, they are not arguing with our opinion — they are arguing with the W3C.
- **Adapters are tiny, so the community can write them.** Fifty lines is a first-contribution-sized task. We scale by adapters, not by writing more tests ourselves.
- **The runner speaks HTTP, not React.** Vue, Svelte, Angular and Web Component libraries slot in later without touching the engine.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design and [`docs/HARNESS-PROTOCOL.md`](docs/HARNESS-PROTOCOL.md) for the adapter contract.

---

## Status

**Pre-alpha. Nothing has been published and no scores exist yet.**

| Milestone                                              | State       |
| ------------------------------------------------------ | ----------- |
| Harness protocol + runner engine                        | Working     |
| Dialog spec (12 assertions)                             | Implemented |
| Radix reference adapter                                 | 12/12 pass  |
| Broken fixture — false positives/negatives measured     | Calibrated  |
| React Spectrum calibration control                      | Not started |
| Remaining four specs (Combobox, Tabs, Menu, Accordion)  | Not started |
| Remaining five adapters                                 | Not started |
| Public site + badges                                    | Not started |

Read [`docs/PLAN.md`](docs/PLAN.md) for the route from here to launch.

---

## Quickstart

Requires Node 20.11+ (`.nvmrc` pins 22) and pnpm 10.

```bash
nvm use
pnpm install
pnpm exec playwright install chromium

# Terminal 1 — serve the Radix adapter
pnpm --filter @curbcut/adapter-radix run dev

# Terminal 2 — run the Dialog spec against it
pnpm curbcut run --target radix --component dialog --base-url http://localhost:5180
```

Results are written to `results/` as JSON, with a human-readable summary on stdout.

To check the runner itself rather than a library:

```bash
pnpm fixture:broken   # terminal 1
pnpm calibrate        # terminal 2
```

That runs the spec against a deliberately broken dialog and compares every assertion to a catalogue of known defects. It fails loudly on a false positive or a false negative, which is what keeps the numbers on the index worth publishing.

---

## Contributing

The highest-value contribution is **an adapter for a library we do not cover yet**. It is about fifty lines and needs no knowledge of the test engine. Start with [`docs/ADAPTERS.md`](docs/ADAPTERS.md) and copy [`adapters/radix`](adapters/radix).

The second highest is **auditing an existing adapter**. An unfair result caused by a badly written adapter is the single biggest risk to this project's credibility, so adapters get reviewed harder than test code does.

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) — in particular the rule that **we notify maintainers before we publish anything about their library.**

## A note on fairness

Curb Cut is not a naming-and-shaming project. Every maintainer gets the full results and a right of reply before publication, and their response is published alongside the score. A library that fixes an issue before we publish is a success of this project, not a story we lost.

## License

MIT
