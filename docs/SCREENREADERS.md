# Screen reader observations

The conformance runner reads the accessibility tree, which is the data
structure assistive technology consumes. It does not hear what a screen
reader actually says. The tree can be correct and the spoken experience still
wrong, and that gap is the largest honest limitation of an automated index.

`@railing-dev/announce` narrows it. It drives real VoiceOver over a real headed
browser with [Guidepup](https://www.guidepup.dev/), performs the same
interactions a user would, and captures the spoken phrase log. What it
records is what was said, on a named macOS version, by a named VoiceOver,
through a named browser.

## Observations, not scores

Announcement results never enter a conformance score. Decision 021 records
why in full; the short version:

- One screen reader, one platform. VoiceOver on macOS says nothing about
  NVDA on Windows, and a score should not quietly generalise.
- Phrasing belongs to the screen reader. Wording changes between macOS
  versions for reasons no library controls, so checks assert only that the
  words a user needs were spoken: the control's name, its role, the state.
- The instrument needs a person. It runs on a real machine with a real
  screen reader, cannot run in the weekly CI cron, and is therefore a spot
  check by nature, not a continuously re-verified number.

Results are written to `results/announce/`, inside the same directory and
therefore the same publication gate as everything else: nothing about a
library is published before its maintainer has been notified.

## Running it

macOS only. The browser runs headed, VoiceOver starts, speaks, and stops.

```bash
pnpm --filter @railing-dev/adapter-react-spectrum run dev   # terminal 1
pnpm announce --target react-spectrum --component dialog --base-url http://localhost:5181
```

Two macOS switches must be on, one preference and one privacy grant:

1. **VoiceOver AppleScript control.** VoiceOver Utility, General, "Allow
   VoiceOver to be controlled with AppleScript". Equivalent to:
   `defaults write com.apple.VoiceOver4/default SCREnableAppleScript -bool true`
2. **Accessibility permission** for the app running the command, in System
   Settings, Privacy and Security, Accessibility. Without it, macOS refuses
   the keystrokes with error 1002 and the run stops before VoiceOver starts.

## Scope, honestly

v1 is the dialog, three checks: the trigger announces its name and role,
opening announces the dialog's name, closing announces the return to the
trigger. Coarse on purpose. The other components follow once the instrument
has survived a second machine, and NVDA support is a second driver, not a
flag.

The check logic that turns phrases into verdicts is pure and tested with a
fake screen reader (`packages/announce/test`), because the part of the
instrument that decides pass or fail must not require VoiceOver to be
present to be verified.
