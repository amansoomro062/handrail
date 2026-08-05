# Changelog

All notable changes to Railing. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[SemVer](https://semver.org/) once packages are published.

Scores are not changelog entries. A library's number changing is a result,
recorded in `results/history/`; this file records changes to the instrument.

## [Unreleased]

### Changed

- Project renamed from Handrail to Railing (5 Aug 2026); site domain is now
  railing.dev and packages are scoped `@railing-dev/*`. No packages had been
  published under the old scope, so nothing external breaks.

### Added

- `@railing-dev/announce`: screen reader spot checks driving real VoiceOver via
  Guidepup, capturing what was actually spoken. Observations, never score
  inputs; see `docs/SCREENREADERS.md` and decision 021.
- Specifications for dialog, combobox, menu, tabs and accordion: 64 assertions,
  each citing a W3C APG clause or WCAG success criterion.
- Adapters for React Spectrum (calibration control), Radix UI, MUI, Headless
  UI, Chakra UI, Ant Design and shadcn/ui, plus a deliberately broken fixture
  with a catalogued defect list for measuring the runner's own error rate.
- The runner: Chromium-only by design, reading the accessibility tree over the
  Chrome DevTools Protocol. `--repeat` discards unstable runs, `--expect`
  calibrates against the broken fixture, `--only` reproduces a single
  assertion without writing anything.
- A replayable Playwright trace per published run, covering exactly the run
  that was scored and none of the stability repeats.
- Result history: every run is archived by date alongside the latest file, so
  a regression can be traced to the version that introduced it.
- The maintainer notification pipeline: a private report per library with
  findings grouped by authored cause, the full adapter source, a reproduction
  command per finding, and fourteen days before anything is published.
- The publication gate, enforced in the pages, the API emission and the
  deploy, tested to fail closed on unparseable dates.
- The public site at [railing.dev](https://railing.dev): method, scoring,
  decision log, disclosure policy and contribution guide, generated from the
  documents in `docs/` so the site and the repository cannot disagree.
- An accessibility audit that holds the site and the maintainer reports to the
  standards the project measures in others, in both colour schemes, judging
  text at the worst point of any gradient it sits on.

### Fixed

- The publication gate failed open on a `notifiedOn` date that would not
  parse. Found by its own test; now fails closed. (Decision 018.)
- Six results that would have accused libraries falsely, each caught before
  publication and recorded in `docs/DECISIONS.md` (decisions 007, 012, 016,
  017): a 19% that was a 78%, a 27% and a 42% that were our selectors against
  the wrong major version, a focus trap reported broken because focus was read
  too early, and a containment check that judged shadcn's own close button to
  be outside its dialog.

[Unreleased]: https://github.com/amansoomro062/railing/commits/main
