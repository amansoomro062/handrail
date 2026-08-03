import { mountHarness } from "@curbcut/harness-kit/react";
import { metaFor } from "./meta.js";
import { DialogHarness } from "./harnesses/dialog.js";

/**
 * The route is the component id: /harness/dialog mounts the dialog harness.
 * Vite's SPA fallback serves index.html for these paths in both dev and preview.
 */
const harnesses: Record<string, () => JSX.Element> = {
  dialog: DialogHarness,
};

const component = window.location.pathname.replace(/^\/harness\//, "").replace(/\/$/, "");
const Harness = harnesses[component];

if (!Harness) {
  const known = Object.keys(harnesses).join(", ");
  document.body.textContent =
    `Unknown harness "${component}". This adapter implements: ${known}. ` +
    `Navigate to /harness/${Object.keys(harnesses)[0]}.`;
} else {
  mountHarness(metaFor(component), <Harness />);
}
