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
} from "@railing-dev/spec";

import { META_GLOBAL, READY_ATTRIBUTE, TEST_ID_ATTRIBUTE, type HarnessMeta } from "@railing-dev/spec";

/**
 * A DOM target to stamp: a selector, the nth match of one, or the match whose
 * text identifies it.
 *
 * `textIncludes` exists for components that render one element at a time and
 * reuse the same DOM node, React Spectrum's tab panels, for example. Index is
 * meaningless there because there is only ever one match, so the only way to
 * know *which* logical panel is on screen is its content.
 */
export type StampTarget =
  | string
  | { selector: string; index: number }
  | { selector: string; textIncludes: string };

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
 * attributes, roles, labels or event handlers, that would be forging a pass.
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
  const resolve = (target: StampTarget): Element | undefined => {
    if (typeof target === "string") return document.querySelector(target) ?? undefined;
    const matches = [...document.querySelectorAll(target.selector)];
    if ("textIncludes" in target) {
      return matches.find((element) => (element.textContent ?? "").includes(target.textIncludes));
    }
    return matches[target.index];
  };

  const apply = (): void => {
    for (const [testId, target] of Object.entries(map)) {
      const element = resolve(target);

      // Clear the id from anything that is no longer the match. Without this, a
      // component that reuses one DOM node for different content, a tab panel,
      // say, would keep an id describing what used to be there, and the runner
      // would confidently measure the wrong element.
      for (const stale of document.querySelectorAll(`[${TEST_ID_ATTRIBUTE}="${testId}"]`)) {
        if (stale !== element) stale.removeAttribute(TEST_ID_ATTRIBUTE);
      }

      if (element && element.getAttribute(TEST_ID_ATTRIBUTE) !== testId) {
        element.setAttribute(TEST_ID_ATTRIBUTE, testId);
      }
    }
  };

  apply();
  // childList only, observing attributes would re-trigger on our own writes.
  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/**
 * Publish adapter metadata and signal readiness.
 *
 * Call this once the component has mounted and is interactive, not before.
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
