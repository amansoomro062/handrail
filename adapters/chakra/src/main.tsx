import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { announceReady, mountHarness } from "@railing/harness-kit/react";
import { metaFor } from "./meta.js";
import { DialogHarness } from "./harnesses/dialog.js";
import { MenuHarness } from "./harnesses/menu.js";
import { TabsHarness } from "./harnesses/tabs.js";
import { AccordionHarness } from "./harnesses/accordion.js";
import { ComboboxHarness } from "./harnesses/combobox.js";

/**
 * The route is the component id: /harness/dialog mounts the dialog harness.
 * Vite's SPA fallback serves index.html for these paths in both dev and preview.
 */
const harnesses: Record<string, () => JSX.Element> = {
  dialog: DialogHarness,
  menu: MenuHarness,
  tabs: TabsHarness,
  accordion: AccordionHarness,
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
  // Chakra v3 requires its provider. It supplies theming only and adds no
  // accessibility behaviour, so it does not affect what is measured.
  mountHarness(
    metaFor(component),
    <ChakraProvider value={defaultSystem}>
      <Harness />
    </ChakraProvider>,
  );
}
