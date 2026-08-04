# Versioning

A published score names a version. If a reader cannot install that exact version and reproduce the number, "reproducible" is a false claim in our own README rather than a property of the project.

Everything below exists to make that claim true.

## The policy

**Anything that can change a measured result is pinned exactly. Everything else takes a caret range.**

| Pinned exactly | Ranged |
| --- | --- |
| Every library under test | `typescript`, `vite`, `@vitejs/plugin-react` |
| `react`, `react-dom` | `tsx`, `@types/*`, `yaml` |
| `playwright`, `playwright-core` | |

`react` and `playwright` are on the left for the same reason the subject libraries are. A component's focus behaviour can change between React versions, and the accessibility tree is computed by the browser that Playwright ships, so if two adapters ran different Reacts, or two runs used different browsers, a difference between two libraries would no longer be attributable to the libraries.

## One declaration, in one file

All versions live in the pnpm catalogs in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml). Every manifest refers to them with `catalog:` and declares nothing itself.

```jsonc
// adapters/radix/package.json
"@radix-ui/react-dialog": "catalog:subjects",
"react": "catalog:",
```

The `subjects` catalog is the single declaration of **what the index measures**. Reading that one block tells you exactly what every published score refers to.

The point is not tidiness. Two declarations of the same version are two things that can drift, and a drift between what the repository says and what a result reports is invisible until someone tries to reproduce a number and cannot.

## What went wrong before this existed

The first two weeks of the project used caret ranges throughout, and the drift was substantial by the time anyone looked:

| Declared | Actually tested |
| --- | --- |
| `@radix-ui/react-dialog: ^1.1.4` | 1.1.23 |
| `@adobe/react-spectrum: ^3.38.0` | 3.47.3 |
| `playwright: ^1.48.0` | 1.62.1 |

Results were being written that said "tested `1.1.23`" against a repository that said `^1.1.4`. Both statements were true, and together they were useless: a clone a month later would install something else and quietly produce a different score for what looked like the same commit.

## `pnpm check:versions`

Closes the loop across the four places a version appears:

```
pnpm-workspace.yaml   ->  what we say we test
node_modules          ->  what is actually installed
targets.json          ->  what the index claims to cover
results/*.json        ->  what a published score refers to
```

It fails on any disagreement, and specifically catches:

- A subject library declared as a range rather than an exact version
- A measurement-critical package that is ranged or missing from the catalog
- A manifest re-declaring a catalogued version instead of using `catalog:`
- An installed version that disagrees with the pin
- Adapters running different React versions
- A result file naming a version the catalog no longer pins, i.e. a **stale result**, which is the one a human would never notice

That last check is the important one. A stale result is not obviously wrong; it is a plausible-looking number describing a version nobody can install any more.

**Run it in CI before anything is published.**

## Upgrading a library under test

An upgrade is a deliberate act, because it changes what a published score means.

1. Edit the pin in the `subjects` catalog
2. `pnpm install`
3. Re-run every spec for that target
4. `pnpm check:versions`, this is what catches results you forgot to re-run
5. Commit the pin bump and the new results together

Never bump a pin without re-running. A result carrying the old version alongside a manifest carrying the new one is precisely the inconsistency this whole document exists to prevent, and the index gains its value from version history being trustworthy over time.
