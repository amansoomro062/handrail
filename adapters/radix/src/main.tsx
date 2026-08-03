import { announceReady, mountHarness } from "@handrail/harness-kit/react";
import { metaFor } from "./meta.js";
import { DialogHarness } from "./harnesses/dialog.js";
import { MenuHarness } from "./harnesses/menu.js";
import { TabsHarness } from "./harnesses/tabs.js";

/**
 * The route is the component id: /harness/dialog mounts the dialog harness.
 * Vite's SPA fallback serves index.html for these paths in both dev and preview.
 */
const harnesses: Record<string, () => JSX.Element> = {
  dialog: DialogHarness,
  menu: MenuHarness,
  tabs: TabsHarness,
};

/**
 * Components this library genuinely does not ship.
 *
 * Radix has no combobox primitive. Its Select is a different APG pattern with
 * different requirements, and testing it against the combobox spec would be
 * measuring the wrong thing. Declaring it unsupported records `not-applicable`
 * rather than a zero — not shipping a component is a scope decision, not an
 * accessibility failure.
 */
const unsupported: Record<string, string> = {
  combobox:
    "Radix UI does not ship a combobox primitive. Its Select implements the APG select-only pattern, which has different requirements and is scored separately.",
};

const component = window.location.pathname.replace(/^\/harness\//, "").replace(/\/$/, "");
const Harness = harnesses[component];
const unsupportedReason = unsupported[component];

if (unsupportedReason) {
  announceReady({ ...metaFor(component), supported: false, unsupportedReason });
} else if (!Harness) {
  const known = Object.keys(harnesses).join(", ");
  document.body.textContent =
    `Unknown harness "${component}". This adapter implements: ${known}. ` +
    `Navigate to /harness/${Object.keys(harnesses)[0]}.`;
} else {
  mountHarness(metaFor(component), <Harness />);
}
