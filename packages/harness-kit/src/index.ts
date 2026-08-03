/**
 * Everything an adapter needs, re-exported from the spec package so adapters
 * have exactly one dependency on the protocol.
 */
export {
  PROTOCOL_VERSION,
  READY_ATTRIBUTE,
  META_GLOBAL,
  TEST_ID_ATTRIBUTE,
  TEXT,
  harnessPath,
  testIdSelector,
  type HarnessMeta,
} from "@handrail/spec";

import { META_GLOBAL, READY_ATTRIBUTE, TEST_ID_ATTRIBUTE, type HarnessMeta } from "@handrail/spec";

/** A DOM target to stamp: a selector, or the nth match of one. */
export type StampTarget = string | { selector: string; index: number };

/**
 * Attach harness test ids to elements the adapter cannot put attributes on.
 *
 * Most libraries do not let you place an attribute on the exact element that
 * carries the semantics. React Spectrum's ComboBox forwards `data-testid` to a
 * wrapper, not to the `input[role="combobox"]` inside it, and the spec needs to
 * address the input. Without this, whole categories of library would be
 * untestable.
 *
 * **This places a marker and nothing else.** It must never be used to add ARIA
 * attributes, roles, labels or event handlers — that would be forging a pass.
 * Selectors should be structural (`input[role="combobox"]`) so that if the
 * library stops producing that element the stamp fails loudly and the run errors
 * on a missing element, rather than quietly measuring the wrong node.
 *
 * A MutationObserver keeps stamping as the DOM changes, because popups, portals
 * and options only exist once the component is opened.
 *
 * See docs/DECISIONS.md 008.
 */
export function stampTestIds(map: Record<string, StampTarget>): () => void {
  const apply = (): void => {
    for (const [testId, target] of Object.entries(map)) {
      const selector = typeof target === "string" ? target : target.selector;
      const index = typeof target === "string" ? 0 : target.index;
      const element = document.querySelectorAll(selector)[index];
      if (element && element.getAttribute(TEST_ID_ATTRIBUTE) !== testId) {
        element.setAttribute(TEST_ID_ATTRIBUTE, testId);
      }
    }
  };

  apply();
  // childList only — observing attributes would re-trigger on our own writes.
  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/**
 * Publish adapter metadata and signal readiness.
 *
 * Call this once the component has mounted and is interactive — not before.
 * Signalling too early is the single most common cause of flaky results,
 * because the runner starts pressing keys at a component that is still
 * settling.
 */
export function announceReady(meta: HarnessMeta): void {
  (window as unknown as Record<string, unknown>)[META_GLOBAL] = meta;
  // Two frames: one for the browser to paint, one for libraries that defer
  // their own setup to a post-paint effect.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.setAttribute(READY_ATTRIBUTE, "true");
    });
  });
}
