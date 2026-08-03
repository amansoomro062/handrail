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
} from "@curbcut/spec";

import { META_GLOBAL, READY_ATTRIBUTE, type HarnessMeta } from "@curbcut/spec";

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
