import { PROTOCOL_VERSION, type HarnessMeta } from "@handrail/harness-kit";

declare const __HANDRAIL_LIBRARY_VERSIONS__: Record<string, string>;

export const LIBRARY_ID = "mui";
export const ADAPTER_VERSION = "0.1.0";

export function metaFor(component: string): HarnessMeta {
  return {
    protocolVersion: PROTOCOL_VERSION,
    library: LIBRARY_ID,
    libraryVersions: __HANDRAIL_LIBRARY_VERSIONS__,
    adapterVersion: ADAPTER_VERSION,
    component,
    notes:
      "Mounted using only components MUI exports, with default configuration and no hand-written ARIA. " +
      "MUI's documentation asks the developer to supply several ARIA attributes themselves — aria-labelledby on Dialog, " +
      "and aria-haspopup / aria-controls / aria-expanded on a Menu's trigger button. Those are not supplied here, " +
      "because writing them would measure our transcription of MUI's docs rather than what MUI ships. " +
      "Tab panels come from @mui/lab, since @mui/material exports no tab panel component.",
  };
}
