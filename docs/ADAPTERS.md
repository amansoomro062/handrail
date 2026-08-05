# Writing an adapter

An adapter is the only library-specific code in the project. It is about fifty lines and requires no knowledge of the test engine.

If you want to contribute and do not know where to start: **this is where to start.**

## What an adapter is

A small web app that mounts one library's components into the fixed harness described in [`HARNESS-PROTOCOL.md`](HARNESS-PROTOCOL.md). It renders the required elements with the required test IDs, announces when it is ready, and does nothing else.

## Steps

1. Copy `adapters/radix` to `adapters/<your-library>`
2. Update `package.json`, name it `@railing-dev/adapter-<id>`, swap the library dependency, pick an unused port
3. Rewrite `src/harnesses/dialog.tsx` using your library's components
4. Update `src/meta.ts` with the library id and resolved versions
5. Add your target to `targets.json` at the repository root with `"status": "draft"`
6. Run it and check the result looks sane

```bash
pnpm --filter @railing-dev/adapter-<id> run dev
pnpm railing run --target <id> --component dialog --base-url http://localhost:<port>
```

## The rules that matter

**Mount the library as its own documentation tells you to.** Not the most accessible configuration you can construct, the one a competent developer following the official guide would arrive at. If accessibility requires opt-in, mount it *without* the opt-in and record that in `notes`. Defaults are what ship to real users, and measuring the defaults is the point.

**Add nothing.** No `onKeyDown`, no `aria-*`, no focus management, no wrapper that "just fixes" something. If you catch yourself adding code to make an assertion pass, you have found a defect and are in the process of hiding it. Stop, and open an issue instead.

**Use the exact strings.** Accessible-name assertions compare against the fixed text in the protocol document.

**Record the resolved version.** Read it from the installed package, not from your semver range.

**Do not style anything.** Visual appearance is irrelevant here and only adds noise to traces.

## Sanity-checking your own adapter

Before opening a PR, break it on purpose. Remove something the library provides, the trigger's label, say, and confirm the relevant assertion flips to `fail`. If nothing changes, your adapter is not wired to the harness correctly and every result it produces is meaningless.

## Review

Adapters are reviewed harder than test code, because an unfair result is the one mistake this project cannot recover from. Expect reviewers to ask:

- Is this how the library's own documentation says to use it?
- Has anything been added that the library does not provide?
- Are the versions resolved and pinned?
- Does the DOM order match the protocol?
- Does breaking it produce the failure you would expect?

A PR that adds an adapter for a library you maintain is very welcome, and we will say so on the results page.
