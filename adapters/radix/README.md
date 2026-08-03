# Radix UI adapter

The reference adapter. Copy this one when adding a library.

```bash
pnpm --filter @handrail/adapter-radix run dev
# then, in another terminal
pnpm handrail run --target radix --component dialog --base-url http://localhost:5180
```

Port 5180. Each adapter gets its own port so several can run at once.

## What is here

| File | Purpose |
| --- | --- |
| `src/harnesses/dialog.tsx` | Radix dialog mounted per the protocol. The only file with library-specific code. |
| `src/meta.ts` | Library id, resolved versions, adapter version, mounting notes. |
| `src/main.tsx` | Routes `/harness/<component>` to a harness. |
| `vite.config.ts` | Reads resolved versions from `node_modules` at build time. |

## Reading the harness

The two things worth internalising before writing your own:

**Nothing is added.** No focus management, no ARIA, no key handlers, no styling. The assertions measure what Radix does unaided. An adapter that helps its library pass is worse than no adapter, because it produces a confident wrong answer.

**Versions are resolved, not ranged.** `vite.config.ts` reads the real installed version out of `node_modules` and injects it. `^1.1.4` in a result file would be useless — nobody could tell which version was actually tested.

## Checking your work

Break it deliberately and confirm the runner notices:

```tsx
// Remove the title — dialog.has-accessible-name should now fail.
<Dialog.Title data-testid="hr-title">{TEXT.dialogTitle}</Dialog.Title>
```

If nothing changes, your adapter is not wired to the harness correctly, and every result it produces is meaningless.
