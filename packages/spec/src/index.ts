export * from "./protocol.js";
export * from "./types.js";
export { dialogSpec } from "./components/dialog.js";
export { comboboxSpec } from "./components/combobox.js";
export { menuSpec } from "./components/menu.js";
export { tabsSpec } from "./components/tabs.js";
export { accordionSpec } from "./components/accordion.js";

import type { ComponentSpec } from "./types.js";
import { dialogSpec } from "./components/dialog.js";
import { comboboxSpec } from "./components/combobox.js";
import { menuSpec } from "./components/menu.js";
import { tabsSpec } from "./components/tabs.js";
import { accordionSpec } from "./components/accordion.js";

/**
 * Every implemented spec, keyed by harness route id.
 *
 * All five Phase 2 specs are implemented. Each was run against the React
 * Spectrum calibration control before being pointed at any subject library.
 */
export const specs: Record<string, ComponentSpec> = {
  [dialogSpec.id]: dialogSpec,
  [comboboxSpec.id]: comboboxSpec,
  [menuSpec.id]: menuSpec,
  [tabsSpec.id]: tabsSpec,
  [accordionSpec.id]: accordionSpec,
};

export function getSpec(id: string): ComponentSpec {
  const spec = specs[id];
  if (!spec) {
    const known = Object.keys(specs).join(", ") || "none";
    throw new Error(`Unknown component spec "${id}". Implemented specs: ${known}.`);
  }
  return spec;
}
