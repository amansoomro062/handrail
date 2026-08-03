import { PROTOCOL_VERSION, type HarnessMeta } from "@handrail/harness-kit";

declare const __HANDRAIL_LIBRARY_VERSIONS__: Record<string, string>;

export const LIBRARY_ID = "react-spectrum";
export const ADAPTER_VERSION = "0.1.0";

export function metaFor(component: string): HarnessMeta {
  return {
    protocolVersion: PROTOCOL_VERSION,
    library: LIBRARY_ID,
    libraryVersions: __HANDRAIL_LIBRARY_VERSIONS__,
    adapterVersion: ADAPTER_VERSION,
    component,
    notes:
      "Calibration control, not a subject. Mounted with default configuration per the React Spectrum documentation. " +
      "A failure here is presumed to be a fault in our assertion until proven otherwise — see docs/DECISIONS.md 003.",
  };
}
