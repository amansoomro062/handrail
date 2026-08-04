/**
 * What a screen reader said, as data.
 *
 * This is a different instrument from the conformance runner and its results
 * never enter a score. The accessibility tree can be correct while the spoken
 * experience is wrong, and announcements vary legitimately between screen
 * reader versions, so these are published as observations with the exact
 * instrument recorded, not folded into a number. See docs/DECISIONS.md 021.
 */

export const ANNOUNCE_SCHEMA_VERSION = 1;

export interface AnnounceCheck {
  id: string;
  title: string;
  /** Why this announcement matters to a screen reader user. */
  rationale: string;
  /**
   * Substrings that must all appear, case-insensitively, in the phrases spoken
   * after the step's action. Substrings rather than exact phrases: VoiceOver
   * wording varies between macOS versions, and pinning it would make the check
   * measure the OS, not the library.
   */
  mustHear: string[];
}

export interface AnnounceStep {
  /** Keys pressed through the screen reader, e.g. "Tab", "Enter", "Escape". */
  press: string;
  /**
   * Repeat the press until every check passes, up to this many times. For
   * walking focus to a control whose position in the tab order is the
   * library's business, not the spec's.
   */
  upTo?: number;
  /** Settle time after the press before reading the log. */
  waitMs?: number;
  checks: AnnounceCheck[];
}

export interface AnnounceSpec {
  component: string;
  version: string;
  steps: AnnounceStep[];
}

export interface AnnounceCheckResult {
  id: string;
  title: string;
  rationale: string;
  status: "pass" | "fail" | "error";
  mustHear: string[];
  /** The phrase that satisfied the check, when one did. */
  heard?: string;
  /** Everything spoken during the step, so a failure can be argued with. */
  phrases: string[];
  error?: string;
}

export interface AnnounceResult {
  schemaVersion: number;
  /** The instrument, precisely. An announcement is only meaningful with it. */
  instrument: {
    screenReader: "voiceover";
    macos: string;
    guidepup: string;
    browser: string;
    browserVersion: string;
  };
  target: { id: string; versions: Record<string, string> };
  component: string;
  specVersion: string;
  startedAt: string;
  finishedAt: string;
  checks: AnnounceCheckResult[];
  /** The complete spoken log of the session, unedited. */
  spokenPhraseLog: string[];
}
