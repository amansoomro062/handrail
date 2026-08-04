/**
 * The harness protocol: the contract between adapters and the runner.
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

  /**
   * Combobox content. Three options with distinct initial letters, so that a
   * library's typeahead cannot make traversal ambiguous, and in an order that
   * is already alphabetical so sorting behaviour cannot change the sequence.
   */
  comboboxLabel: "Choose a fruit",
  comboboxOption1: "Apple",
  comboboxOption2: "Banana",
  comboboxOption3: "Cherry",

  /** Menu content. Distinct initial letters, so typeahead cannot disambiguate wrongly. */
  menuTrigger: "Open menu",
  menuItem1: "Cut",
  menuItem2: "Duplicate",
  menuItem3: "Paste",

  /**
   * Tab content. Panels deliberately contain text and nothing focusable, so the
   * APG requirement that an otherwise-empty panel be focusable is testable.
   */
  tab1: "Overview",
  tab2: "Billing",
  tab3: "Settings",
  panel1: "Overview panel content",
  panel2: "Billing panel content",
  panel3: "Settings panel content",

  /** Accordion content. All sections start collapsed. */
  accordionHeader1: "Shipping",
  accordionHeader2: "Payment",
  accordionHeader3: "Review",
  accordionPanel1: "Shipping section content",
  accordionPanel2: "Payment section content",
  accordionPanel3: "Review section content",
} as const;

/** Metadata an adapter must expose on `window.__HANDRAIL__`. */
export interface HarnessMeta {
  protocolVersion: number;
  /** Target id, matching an entry in targets.json (e.g. "radix"). */
  library: string;
  /** Resolved versions of the packages under test, never semver ranges. */
  libraryVersions: Record<string, string>;
  adapterVersion: string;
  component: string;
  /**
   * Anything the runner should record about how this was mounted, non-default
   * configuration, extra focusable nodes the library injects, known caveats.
   * Published alongside the result.
   */
  notes?: string;
  /**
   * Set to false when the library genuinely does not ship this component.
   *
   * The runner then records every assertion as `not-applicable` and the target
   * scores `n/a` rather than zero. A library must never be marked down for not
   * implementing something it never claimed to, Radix has no combobox
   * primitive, and that is a scope decision rather than an accessibility
   * failure.
   */
  supported?: boolean;
  /** Required when `supported` is false. Published alongside the result. */
  unsupportedReason?: string;
}

export function harnessPath(component: string): string {
  return `/harness/${component}`;
}

export function testIdSelector(testId: string): string {
  return `[${TEST_ID_ATTRIBUTE}="${testId}"]`;
}
