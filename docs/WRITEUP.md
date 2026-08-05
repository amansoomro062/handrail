# We tested seven component libraries against the W3C's own accessibility specification

> **Draft.** Sections 4 and 5 cannot be written until maintainers have had their
> fourteen days. Everything else is ready for their review, and for the
> pre-launch critique pass described in LAUNCH.md. Do not publish this file;
> it ships as a page when the results do.

## 1. The problem

Pick a React component library today and you are choosing on vibes. The
marketing page says "accessible". The README has the right badges. And nobody,
anywhere, can tell you whether its combobox can actually be operated with a
keyboard, whether its dialog traps focus, or whether the version you upgraded
to on Tuesday quietly broke either of those things.

This is not because people do not care. It is because the information does not
exist. Accessibility audits are done on finished websites, one at a time,
privately, and they go stale the day they are delivered. There is no shared,
current, comparable answer to the question "does this component work", and so
teams keep choosing on vibes, and the same defects keep shipping into
thousands of products at once.

## 2. Why libraries, and not websites

Testing individual websites is retail. Testing the libraries they are built
from is wholesale.

One broken menu in a popular component library is a broken menu in tens of
thousands of downstream applications, most of which will never commission an
accessibility audit of their own. Fix it once upstream and it is fixed
everywhere at once, including for the users of products whose teams have never
heard of the ARIA Authoring Practices Guide.

So Railing measures seven React component libraries, continuously, against
the W3C's own specification, and publishes every result with the clause behind
it.

## 3. How the measurement works, and why you should not trust us

The fastest way to be dismissed in this field is to look like the hundred and
first accessibility tool that overclaims. So the method is built backwards
from the question "how would a maintainer prove us wrong", and the honest
answer is: quickly, because we hand them everything required to do it.

**Every check cites a clause.** Assertions are grounded in the W3C ARIA
Authoring Practices Guide or a WCAG success criterion. An assertion that
cannot cite one is not published. A dispute is therefore with the W3C's
documented pattern, not with our taste. Clauses the APG marks "Optional" are
not assertable.

**The runner does not know which library it is testing.** Each library
provides about fifty lines that mount its components into a fixed harness at a
fixed URL. The test engine speaks HTTP to that harness and nothing else. It
cannot favour a library it has no way to identify, and the fifty lines are
published in full so anyone can check how a component was mounted.

**We read the tree a screen reader reads.** Role, name and state come from the
browser's accessibility tree over the Chrome DevTools Protocol, not from
guessing which attributes happen to be present in the DOM. That is the data
structure assistive technology actually consumes.

**The instrument is calibrated before it measures anyone.** A known-good
library, Adobe's React Spectrum, is run first; if it fails a check, the check
is presumed wrong until proven otherwise. A deliberately broken fixture with a
catalogue of known defects is run alongside; the runner must find exactly
those defects and no others, so false positives and false negatives are
measured numbers, not assumptions. Every published result is run three times
and discarded if any assertion's status varies.

**Everything is reproducible by a stranger.** Every result is a JSON file
naming exact versions. Every run has a replayable Playwright trace. Every
failing check carries the single command that reproduces it in isolation.
Clone the repository and you will get our numbers, or you will have found
something, and we want to hear about it either way.

**And we publish our own mistakes.** The decision log records every result
this project nearly got wrong: the library that scored 19% because our setup
helper used a key its menu does not support, when the true score was 78%. The
27% that was our selector written against the wrong major version. The focus
trap we reported broken because we read focus before the library had moved it.
Each was caught before publication, and each produced a rule. A measurement
project that claims it has never pointed the instrument at its own thumb is
not being straight with you.

## 4. What we found

<!-- Written after the notice period. Per component, evidence-linked, leading
     with what is widely done well before what is not. The cause-grouped
     framing from the maintainer reports carries over: twelve findings that
     are really two decisions should read that way. -->

*Withheld. Every maintainer is currently inside their notice period.*

## 5. What the maintainers said

<!-- Their responses, in full, including where they told us we were wrong and
     we agreed. If a library ships a fix inside the window, the fixed score is
     what gets published, and that is the story this section leads with. -->

*Withheld until responses are in.*

## 6. What this cannot tell you

A high score means no violations were detected by automated testing. It does
not mean the component is accessible.

Automated checks cannot judge whether a label is meaningful, whether a reading
order makes sense, or whether the experience is actually usable with a screen
reader. We read the accessibility tree that assistive technology consumes; we
do not yet listen to what a screen reader announces, and until we do, that
distinction stays printed on every page. These scores are a floor, not a
ceiling, and the ceiling belongs to human judgement and disabled users.

Two more limits, stated plainly. The runner is Chromium-only, because the
accessibility tree is read over the Chrome DevTools Protocol, which no other
engine implements; a second engine is a second driver, not a flag. And seven
React libraries is seven React libraries: Vue, Svelte and Web Components are
in the protocol's reach but not in this release, because seven done properly
beats thirty done shallowly.

## 7. Add the library you maintain

An adapter is about fifty lines and requires no knowledge of the test engine.
If you would rather measure yourself than be measured, that is the door:
[railing.dev/contribute](https://railing.dev/contribute).

If you maintain one of the seven libraries already measured, you have had this
in your inbox for a fortnight, along with the adapter we used and the right to
tell us we are wrong in public. That offer does not expire at launch.
