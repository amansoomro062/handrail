import type { Locator, Page } from "playwright-core";
import type { HarnessMeta } from "./protocol.js";

/* ------------------------------------------------------------------ *
 * Severity and status
 * ------------------------------------------------------------------ */

/**
 * Severity is a property of the assertion, fixed at authoring time. It is never
 * adjusted per library after seeing results — see docs/SCORING.md.
 */
export type Severity = "blocker" | "serious" | "moderate" | "minor";

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  blocker: 10,
  serious: 5,
  moderate: 2,
  minor: 1,
};

export type AssertionStatus = "pass" | "fail" | "not-applicable" | "error";

/* ------------------------------------------------------------------ *
 * References
 * ------------------------------------------------------------------ */

/**
 * Every assertion must cite a normative source. An assertion that cannot is our
 * opinion, and opinions are not publishable as conformance results.
 */
export interface Refs {
  /** URL to the relevant ARIA Authoring Practices Guide section. */
  apg?: string;
  /** URL into the WAI-ARIA specification. */
  aria?: string;
  /** WCAG success criterion, e.g. "2.4.3 Focus Order". */
  wcag?: string;
  wcagUrl?: string;
}

/* ------------------------------------------------------------------ *
 * Accessibility tree
 * ------------------------------------------------------------------ */

/**
 * A node of the computed accessibility tree, as exposed to assistive
 * technology. Sourced from CDP `Accessibility.getFullAXTree` rather than
 * inferred from the DOM — see docs/DECISIONS.md 002.
 */
export interface AxNode {
  nodeId: string;
  role: string | null;
  name: string | null;
  description: string | null;
  /** True when the browser excludes this node from the accessibility tree. */
  ignored: boolean;
  properties: Record<string, string | number | boolean>;
  childIds: string[];
}

export interface A11yTools {
  /** The full computed accessibility tree. */
  tree(): Promise<AxNode[]>;
  /** Computed node for a harness test id, or null if not in the tree. */
  nodeFor(testId: string): Promise<AxNode | null>;
  /** Computed accessible name, or null if the element is absent or ignored. */
  nameFor(testId: string): Promise<string | null>;
  /** Computed role, or null if the element is absent or ignored. */
  roleFor(testId: string): Promise<string | null>;
  /**
   * Whether the element is exposed to assistive technology: present in the tree
   * and not ignored. This is the only reliable way to ask "can a screen reader
   * still reach the background while the dialog is open".
   */
  isExposed(testId: string): Promise<boolean>;
}

/* ------------------------------------------------------------------ *
 * Keyboard and focus
 * ------------------------------------------------------------------ */

export interface FocusInfo {
  /** Harness test id of the focused element, if it carries one. */
  testId: string | null;
  tagName: string;
  role: string | null;
  name: string | null;
  /** Best-effort selector, for failure messages. */
  selector: string;
  /** True when focus is on <body> — i.e. nothing meaningful is focused. */
  isBody: boolean;
}

export interface KeyboardTools {
  press(key: string): Promise<void>;
  tab(times?: number): Promise<void>;
  shiftTab(times?: number): Promise<void>;
  /** Where focus currently is. */
  focused(): Promise<FocusInfo>;
  /**
   * Press Tab (or Shift+Tab) `steps` times, capturing focus after each press.
   * The building block for every focus-order and focus-trap assertion.
   */
  walk(steps: number, options?: { backwards?: boolean }): Promise<FocusInfo[]>;
  /** Move focus to a harness element directly, bypassing traversal. */
  focus(testId: string): Promise<void>;
  /**
   * Wait until focus lands on an element, returning false on timeout.
   *
   * Focus movement is frequently asynchronous — libraries restore focus after an
   * exit animation or a microtask. Sampling focus once, immediately, produces
   * false failures against libraries that are behaving correctly. Always wait.
   */
  waitForFocus(testId: string, timeoutMs?: number): Promise<boolean>;
  /** As `waitForFocus`, but satisfied by any element inside the ancestor. */
  waitForFocusWithin(ancestorTestId: string, timeoutMs?: number): Promise<boolean>;
}

/* ------------------------------------------------------------------ *
 * Harness handle
 * ------------------------------------------------------------------ */

export interface HarnessHandle {
  baseUrl: string;
  component: string;
  meta: HarnessMeta;
  /** Reload to the documented initial state. Called before every assertion. */
  reset(): Promise<void>;
  el(testId: string): Locator;
  exists(testId: string): Promise<boolean>;
  visible(testId: string): Promise<boolean>;
  /** DOM containment — is `testId` inside `ancestorTestId`? */
  isWithin(testId: string, ancestorTestId: string): Promise<boolean>;
  click(testId: string): Promise<void>;
  text(testId: string): Promise<string>;
}

/* ------------------------------------------------------------------ *
 * Assertions
 * ------------------------------------------------------------------ */

export interface RunContext {
  page: Page;
  harness: HarnessHandle;
  a11y: A11yTools;
  keyboard: KeyboardTools;
  /** Diagnostic output attached to the result. */
  log(message: string): void;
}

export type AssertionOutcome =
  | { status: "pass"; detail?: string }
  | { status: "fail"; detail: string; expected?: string; actual?: string }
  | { status: "not-applicable"; reason: string };

export interface Assertion {
  /** Stable, namespaced: "dialog.focus-trapped-forward". Never renamed. */
  id: string;
  title: string;
  /** Why this matters, in terms of a person trying to do something. */
  rationale: string;
  severity: Severity;
  refs: Refs;
  run(ctx: RunContext): Promise<AssertionOutcome>;
}

export interface RequiredElement {
  testId: string;
  description: string;
  /** False for elements that only exist once the component is activated. */
  requiredAtLoad: boolean;
}

export interface ComponentSpec {
  /** Matches the harness route: /harness/<id>. */
  id: string;
  title: string;
  /** Bumped when assertions or severities change. Recorded in every result. */
  version: string;
  apgPattern: string;
  description: string;
  requiredElements: RequiredElement[];
  assertions: Assertion[];
}

/* ------------------------------------------------------------------ *
 * Outcome helpers
 * ------------------------------------------------------------------ */

export const pass = (detail?: string): AssertionOutcome => ({ status: "pass", detail });

export const fail = (
  detail: string,
  expected?: string,
  actual?: string,
): AssertionOutcome => ({ status: "fail", detail, expected, actual });

export const notApplicable = (reason: string): AssertionOutcome => ({
  status: "not-applicable",
  reason,
});

/** Describe a focus position for a human reading a failure message. */
export function describeFocus(f: FocusInfo): string {
  if (f.isBody) return "<body> (nothing focused)";
  const id = f.testId ? `[data-testid="${f.testId}"]` : f.selector;
  const name = f.name ? ` named "${f.name}"` : "";
  return `${id}${name}`;
}
