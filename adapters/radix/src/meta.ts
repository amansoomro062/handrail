import { PROTOCOL_VERSION, type HarnessMeta } from "@railing/harness-kit";

declare const __RAILING_LIBRARY_VERSIONS__: Record<string, string>;

export const LIBRARY_ID = "radix";
export const ADAPTER_VERSION = "0.1.0";

export function metaFor(component: string): HarnessMeta {
  return {
    protocolVersion: PROTOCOL_VERSION,
    library: LIBRARY_ID,
    libraryVersions: __RAILING_LIBRARY_VERSIONS__,
    adapterVersion: ADAPTER_VERSION,
    component,
    notes:
      "Mounted with default configuration, following the Radix documentation. " +
      "No focus management, ARIA attributes or key handlers added by the adapter.",
  };
}
