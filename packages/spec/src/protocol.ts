/**
 * The harness protocol — the contract between adapters and the runner.
 *
 * Adapters import these constants (re-exported from `@handrail/harness-kit`) so
 * that a protocol change is a version bump rather than a scavenger hunt through
 * seven repositories.
 *
 * See docs/HARNESS-PROTOCOL.md.
 */

export const PROTOCOL_VERSION = 1;

/** Set on <body> once the component has mounted and is interactive. */
export const READY_ATTRIBUTE = "data-handrail-ready";

/** Global the adapter exposes so the runner can record what it tested. */
export const META_GLOBAL = "__HANDRAIL__";

/** Attribute used to locate harness elements. */
export const TEST_ID_ATTRIBUTE = "data-testid";

/**
 * Fixed strings. Accessible-name assertions compare against these, so adapters
 * must use them exactly.
 */
export const TEXT = {
  dialogTitle: "Handrail test dialog",
  dialogTrigger: "Open dialog",
  close: "Close",
  outsideContent: "Content outside the dialog",
} as const;

/** Metadata an adapter must expose on `window.__HANDRAIL__`. */
export interface HarnessMeta {
  protocolVersion: number;
  /** Target id, matching an entry in targets.json (e.g. "radix"). */
  library: string;
  /** Resolved versions of the packages under test — never semver ranges. */
  libraryVersions: Record<string, string>;
  adapterVersion: string;
  component: string;
  /**
   * Anything the runner should record about how this was mounted — non-default
   * configuration, extra focusable nodes the library injects, known caveats.
   * Published alongside the result.
   */
  notes?: string;
}

export function harnessPath(component: string): string {
  return `/harness/${component}`;
}

export function testIdSelector(testId: string): string {
  return `[${TEST_ID_ATTRIBUTE}="${testId}"]`;
}
