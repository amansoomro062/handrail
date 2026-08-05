import { PROTOCOL_VERSION, type HarnessMeta } from "@railing-dev/harness-kit";

declare const __RAILING_LIBRARY_VERSIONS__: Record<string, string>;

export const LIBRARY_ID = "antd";
export const ADAPTER_VERSION = "0.1.0";

export function metaFor(component: string): HarnessMeta {
  return {
    protocolVersion: PROTOCOL_VERSION,
    library: LIBRARY_ID,
    libraryVersions: __RAILING_LIBRARY_VERSIONS__,
    adapterVersion: ADAPTER_VERSION,
    component,
    notes:
      "Ant Design, mounted with default configuration using only components the library exports " +
      "and no hand-written ARIA. Ant Design has no single combobox component: AutoComplete is the " +
      "closest match to the APG editable-combobox pattern and is what is measured here. " +
      "Its accordion is Collapse, and its menu is Dropdown with a menu prop.",
  };
}
