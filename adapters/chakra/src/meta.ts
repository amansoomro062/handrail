import { PROTOCOL_VERSION, type HarnessMeta } from "@railing-dev/harness-kit";

declare const __RAILING_LIBRARY_VERSIONS__: Record<string, string>;

export const LIBRARY_ID = "chakra";
export const ADAPTER_VERSION = "0.1.0";

export function metaFor(component: string): HarnessMeta {
  return {
    protocolVersion: PROTOCOL_VERSION,
    library: LIBRARY_ID,
    libraryVersions: __RAILING_LIBRARY_VERSIONS__,
    adapterVersion: ADAPTER_VERSION,
    component,
    notes:
      "Chakra UI v3, mounted with default configuration using only components the library exports " +
      "and no hand-written ARIA. Chakra v3 is built on Ark UI, so these results describe that " +
      "underlying behaviour as Chakra ships it.",
  };
}
