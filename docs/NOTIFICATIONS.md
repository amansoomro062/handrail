# Maintainer notifications

Nobody learns about a finding from a public page. Every maintainer gets their
results privately, with fourteen days and the adapter source, before anything
about their library is published. This file is where that is tracked, and
[`docs/DECISIONS.md`](DECISIONS.md) 004 is why.

## How to run one

```bash
pnpm notify:bundle          # every library
pnpm notify:bundle mui      # one library
```

Each bundle lands in `notifications/<target>/` (untracked, because it contains
findings nobody has seen) and holds:

- `report.md` — every check, the clause behind it, and the full adapter source
- `covering-message.txt` — a short note to send alongside it

The same reports are also written as HTML to `notifications/html/`, one page per
library plus an `index.html` listing all of them. Open the index to read them.
They use the site's own stylesheet, so a maintainer sees the report in the same
form as the page their score eventually appears on, and they pass
`scripts/audit-site.mjs` for the same reasons the site does:

```bash
npx serve notifications/html -l 5199
node scripts/audit-site.mjs http://localhost:5199 /index.html /mui.html
```

Then:

1. Send it. A GitHub issue on their repo is usually right, and it puts the
   conversation where their contributors can see it. Use private disclosure if
   the library has a security or accessibility contact who prefers that.
2. Record the date in `targets.json` as `notifiedOn`.
3. Add the row below.

The date is what releases the results. The site generator and
`pnpm restore:docs` both refuse to publish a library until `notifiedOn` is set
and fourteen days have passed, so nothing needs remembering after step 2.

## Writing to a maintainer

The covering message is a draft, not a script. Some things worth keeping
whatever words you use:

- **Lead with the fact that nothing is public.** It changes how the rest reads.
- **Say the adapter is the likeliest thing to be wrong.** It is true, and it has
  been true repeatedly. It also turns the exchange from a verdict into a review.
- **Offer to publish a fixed score.** A finding fixed before publication is the
  best outcome this project has.
- **Offer more than fourteen days.** The deadline is ours. Nobody agreed to it.

Do not send a league table, or tell anyone how they compare to another library.
They are being asked to check our work on their component, not to compete.

## Status

| Library | Findings | Notified | Releases on | Response |
| --- | --- | --- | --- | --- |
| React Spectrum | 0 | — | — | — |
| Radix UI | 0 | — | — | — |
| Headless UI | 1 | — | — | — |
| Chakra UI | 1 | — | — | — |
| shadcn/ui | 2 | — | — | — |
| MUI | 5 | — | — | — |
| Ant Design | 12 | — | — | — |

Findings counts come from the last full run. Regenerate the bundles after any
re-measurement, because a maintainer must not receive a report that disagrees
with what will eventually be published.

## Replies

Record every response here, including the ones that tell us we were wrong,
and especially those. If a maintainer disputes a check, the outcome belongs in
the decision log whichever way it goes.

_None yet._
