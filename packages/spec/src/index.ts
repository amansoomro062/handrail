export * from "./protocol.js";
export * from "./types.js";
export { dialogSpec } from "./components/dialog.js";
export { comboboxSpec } from "./components/combobox.js";
export { menuSpec } from "./components/menu.js";

import type { ComponentSpec } from "./types.js";
import { dialogSpec } from "./components/dialog.js";
import { comboboxSpec } from "./components/combobox.js";
import { menuSpec } from "./components/menu.js";

/**
 * Every implemented spec, keyed by harness route id.
 *
 * Tabs and accordion land later in Phase 2 — see docs/PLAN.md. Each one is run
 * against the React Spectrum calibration control before it is pointed at any
 * subject library.
 */
export const specs: Record<string, ComponentSpec> = {
  [dialogSpec.id]: dialogSpec,
  [comboboxSpec.id]: comboboxSpec,
  [menuSpec.id]: menuSpec,
};

export function getSpec(id: string): ComponentSpec {
  const spec = specs[id];
  if (!spec) {
    const known = Object.keys(specs).join(", ") || "none";
    throw new Error(`Unknown component spec "${id}". Implemented specs: ${known}.`);
  }
  return spec;
}
