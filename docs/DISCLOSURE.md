# Disclosure and conflicts of interest

Railing scores libraries its contributors also contribute to. That is a real
conflict, and the answer is to state it rather than to pretend it away.

## What we do before publishing anything

Every maintainer receives their full results privately before any score appears
here: every check, the clause behind it, the exact versions, and the complete
adapter source so they can see how their components were mounted. They get
fourteen days, and longer if they ask.

Nothing about a library is published until that has happened. It is enforced in
the site generator rather than left to whoever runs the build, because the cost
of getting it wrong is the one thing this project cannot buy back.

If a maintainer replies, their response is published beside the score, in full
and unedited, including the ones saying we measured them wrongly. If they ship
a fix inside the window, the fixed score is what gets published. A finding
repaired before publication is the best outcome available here, not a story
that got away.

## Contributing to the libraries we measure

We would rather a defect were fixed than scored. So where a finding is real and
the fix is tractable, we offer to write the patch.

This creates an obvious question about independence, and these are the rules
that answer it.

- **Contributions are disclosed.** If a Railing contributor has opened issues,
  submitted pull requests, or holds commit rights in a measured library, that is
  stated on the library's page here, with links.
- **A score is never adjusted by anyone with a stake in it.** Scores are not
  adjusted by hand at all. They are computed from published result files by
  published code.
- **A patch is offered, never traded.** We do not withhold publication in
  exchange for anything, do not offer a better score for accepting a patch, and
  do not delay a finding because a fix is in progress. The fourteen days are the
  same either way.
- **A rejected patch changes nothing.** If a maintainer declines a fix, the
  finding is published exactly as it would have been. Disagreement about a
  patch is not evidence about a component.
- **We do not measure our own work into a score.** If a Railing contributor
  authors the code that implements a component we test, that component is marked
  and excluded from the library's score until someone unconnected re-measures it.

## Why the results are checkable rather than trusted

The strongest defence against a conflict is not a promise. It is that anyone can
reproduce the whole index without us:

- Every result is a JSON file in the repository, with the exact versions used.
- Every adapter is about fifty lines and is published in full.
- The scoring code is published, and every input to it is published, so anyone
  who dislikes our weightings can recompute the index with their own.
- Every check cites a clause of the W3C ARIA Authoring Practices Guide or a WCAG
  success criterion, so the standard being applied is not ours.

If you think a score is wrong, you do not have to take our word for anything.
Clone the repository and run it.

## Disagreeing with us

Tell us, in an issue or in the thread where we contacted you. Two things we have
found worth saying in advance:

Some disagreements are about the measurement, and those we simply fix. A wrong
selector, a check that misreads a clause, a component mounted in a way its
authors would not recommend: the
[decision log](DECISIONS.md) is largely a record of exactly these, and several
entries exist because a maintainer or a reviewer caught something before it was
published.

Some disagreements are about what should be measured at all, and those we do not
resolve by changing a number. Whether a library should ship ARIA attributes by
default or leave them to the developer is a genuine design argument, and we are
not the referee. Where a maintainer makes that case, their reasoning is
published beside the score and readers can decide.

## Why measure at all

The ceiling note on every results page ("a high score does not mean the
component is accessible") sometimes prompts this question, so, briefly: a low
score is a set of cited, reproducible defects, not an opinion; a high score
frees expert review and disabled users to spend their time on what automation
cannot judge; and a fix that lands in a library reaches every application
downstream of it. The longer answer is on the
[method page](ARCHITECTURE.md#why-a-floor-is-worth-measuring).

## Current disclosures

_None yet. This section lists every library where a Railing contributor has
opened an issue, submitted a patch, or holds commit rights._
