import { announceReady, mountHarness } from "@handrail/harness-kit/react";
import { metaFor } from "./meta.js";
import { DialogHarness } from "./harnesses/dialog.js";
import { MenuHarness } from "./harnesses/menu.js";
import { TabsHarness } from "./harnesses/tabs.js";
import { ComboboxHarness } from "./harnesses/combobox.js";

/**
 * The route is the component id: /harness/dialog mounts the dialog harness.
 * Vite's SPA fallback serves index.html for these paths in both dev and preview.
 */
const harnesses: Record<string, () => JSX.Element> = {
  dialog: DialogHarness,
  menu: MenuHarness,
  tabs: TabsHarness,
  combobox: ComboboxHarness,
};

/** Components this library genuinely does not ship. See protocol §3. */
const unsupported: Record<string, string> = {};

const component = window.location.pathname.replace(/^\/harness\//, "").replace(/\/$/, "");
const Harness = harnesses[component];
const unsupportedReason = unsupported[component];

if (unsupportedReason) {
  // Announce readiness anyway, so the runner records `not-applicable` rather
  // than timing out and blaming the adapter.
  announceReady({ ...metaFor(component), supported: false, unsupportedReason });
} else if (!Harness) {
  const known = Object.keys(harnesses).join(", ");
  document.body.textContent =
    `Unknown harness "${component}". This adapter implements: ${known}. ` +
    `Navigate to /harness/${Object.keys(harnesses)[0]}.`;
} else {
  mountHarness(metaFor(component), <Harness />);
}
