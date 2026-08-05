import { PROTOCOL_VERSION, type HarnessMeta } from "@railing-dev/harness-kit";

declare const __RAILING_LIBRARY_VERSIONS__: Record<string, string>;

export const LIBRARY_ID = "headlessui";
export const ADAPTER_VERSION = "0.1.0";

export function metaFor(component: string): HarnessMeta {
  return {
    protocolVersion: PROTOCOL_VERSION,
    library: LIBRARY_ID,
    libraryVersions: __RAILING_LIBRARY_VERSIONS__,
    adapterVersion: ADAPTER_VERSION,
    component,
    notes:
      "Mounted with default configuration, using only components Headless UI exports and no hand-written ARIA. " +
      "Headless UI ships no styles by design, so the harness is unstyled, that is the library working as intended, not a missing step.",
  };
}
