# React Spectrum adapter: calibration control

**This adapter exists to measure the harness, not the library.**

```bash
pnpm --filter @railing/adapter-react-spectrum run dev
pnpm railing run --target react-spectrum --component dialog --base-url http://localhost:5181
```

Port 5181.

## Why it is treated differently

Adobe's React Spectrum is widely regarded as the accessibility gold standard. That makes it the closest thing available to a known-good reading, and a known-good reading is what separates *"this library is broken"* from *"our test is broken"*.

So the rule, from [`docs/DECISIONS.md`](../../docs/DECISIONS.md) 003:

> Any assertion React Spectrum fails is presumed to be wrong until proven otherwise, and no result for any subject library may be published until this target scores at least 95%.

Each failure gets one of three resolutions, recorded in the decision log:

1. The assertion is over-strict → soften or remove it
2. The adapter is wrong → fix the adapter
3. It is a genuine defect → open an issue upstream and keep the assertion

Reach for 3 last, and only with evidence. The prior that Adobe got it right and we did not is a strong one.

## Current state

`dialog`, **12/12**, against `@adobe/react-spectrum@3.47.3`.

## A caveat worth keeping in view

React Spectrum and Radix both score 12/12. That is the correct result, and it also means **the Dialog spec does not yet discriminate between good implementations**, so far it only separates good from catastrophic, which is what the broken fixture confirms from the other end.

That is normal for a first spec and not a reason to add assertions for their own sake. The real test of whether these twelve assertions are useful comes from the middle of the distribution, when MUI, Chakra and Ant Design are measured in Phase 2. If everything lands at either 100% or 37%, the spec needs sharpening.

## Harness note

The two text inputs are plain `<input>` elements rather than Spectrum `TextField`s. That is deliberate: it keeps the set of focusable elements inside the dialog identical across every adapter, so the focus-trap assertions, which count Tab presses, stay comparable. Spectrum's own components are used for everything the spec actually asserts against.
