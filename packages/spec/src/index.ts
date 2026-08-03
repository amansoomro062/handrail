export * from "./protocol.js";
export * from "./types.js";
export { dialogSpec } from "./components/dialog.js";

import type { ComponentSpec } from "./types.js";
import { dialogSpec } from "./components/dialog.js";

/**
 * Every implemented spec, keyed by harness route id.
 *
 * Combobox, menu, tabs and accordion land in Phase 2 — see docs/PLAN.md.
 * Each one is run against the React Spectrum calibration control before it is
 * pointed at any subject library.
 */
export const specs: Record<string, ComponentSpec> = {
  [dialogSpec.id]: dialogSpec,
};

export function getSpec(id: string): ComponentSpec {
  const spec = specs[id];
  if (!spec) {
    const known = Object.keys(specs).join(", ") || "none";
    throw new Error(`Unknown component spec "${id}". Implemented specs: ${known}.`);
  }
  return spec;
}
