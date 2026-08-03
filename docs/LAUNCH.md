# Launch plan

## The order is the strategy

1. Calibrate until false positives are measured, not assumed
2. Notify every maintainer privately, 14 days
3. Secure one endorsement from a recognised accessibility voice
4. Publish the site and the writeup together
5. *Then* the aggregators

Doing 5 before 2 turns the project into a hit piece and makes enemies of the people whose cooperation it depends on. The sequence is not politeness; it is the difference between a reference the ecosystem adopts and a leaderboard it resents.

## The writeup

Working title: **"We tested seven component libraries against the W3C's own accessibility specification."**

Structure:

1. **The problem** — you choose a component library on vibes, and its combobox may be unusable by keyboard in ways nobody has checked
2. **Why libraries and not sites** — the leverage argument: fix once, fix everywhere downstream
3. **Method** — APG grounding, the adapter inversion, the React Spectrum control, the broken fixture, the false-positive rate as a measured number
4. **What we found** — per component, evidence-linked
5. **What maintainers said** — their responses, including where they told us we were wrong and we agreed
6. **What this cannot tell you** — the honest ceiling of automated testing
7. **How to add your library** — the contribution call

Sections 3 and 6 are what make it credible to the people whose opinion carries weight in this field. Lead with method, not with the ranking. The people who will amplify this have seen a hundred accessibility tools that overclaim, and the fastest way to be dismissed is to look like the hundred and first.

## Endorsement targets

Approach privately, before launch, with results in hand.

| Person | Why |
| --- | --- |
| **Bruce Lawson** | [Publicly asked for exactly this in 2021](https://brucelawson.co.uk/2021/component-libraries-accessibility-and-transparency/) and never got it. First contact. |
| **Adrian Roselli** | Deep component-pattern testing; will find methodology flaws before critics do, which is worth more than the endorsement |
| **Scott O'Hara** | APG contributor; authoritative on whether assertions match the spec |
| **Sara Soueidan** | Large practitioner audience, component-focused |
| **Hidde de Vries** | Standards-adjacent, strong European reach |

Ask for critique, not promotion. "Will you tell me where this methodology is wrong before I publish" is a better opening than "will you share this", it gets a higher response rate, and someone who has improved a thing tends to share it anyway.

## Channels, in order

1. The site and writeup — the canonical artefacts
2. Endorser amplification
3. Mastodon / Bluesky accessibility communities — where this field actually lives
4. Hacker News, Lobsters, r/reactjs
5. Newsletters: Smashing, Frontend Focus, A11y Weekly
6. Direct to each maintainer's community, with the fixes they shipped credited

## The growth loop

Everything above is a one-off spike. The loop is what matters afterwards.

```
maintainer wants a badge
  → adds a11y: 94% to their README
    → readers click through to the index
      → some maintain other libraries and want a badge
        → they write an adapter
          → coverage grows without founder effort
```

Requirements for the loop to work: badges must be genuinely desirable (so scores must be fair and respected), adding a library must be trivial (fifty lines), and the index must be current (automated re-runs, or the badge becomes a lie).

## After launch

- **Regression alerts.** Automated notice when a tracked library's score drops. This generates news continuously without anyone writing it, and it is the reason to subscribe rather than read once.
- **Talks.** axe-con, a11yTO, Smashing, State of the Browser, All Day Hey. Talk title: *"Everyone holds the handrail: what happens when you test the libraries instead of the websites."*
- **Annual report.** "The state of component library accessibility, 2027." Year-over-year data is the asset nobody else can produce, and it gets easier to write every year.

## What success is not

Not stars, not front page of Hacker News for a day. Success is a maintainer opening a pull request against their own library because of a result here, and a developer choosing a library on evidence instead of vibes.

If the project achieves that with 400 stars, it worked.
