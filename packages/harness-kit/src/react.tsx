import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { HarnessMeta } from "@curbcut/spec";
import { announceReady } from "./index.js";

/**
 * Mount a React harness and announce readiness.
 *
 * Deliberately does nothing else. Anything this helper adds — a wrapper, a
 * style, a key handler — would be measured as if the library provided it, and
 * the entire value of the project rests on that not happening.
 *
 * StrictMode is off on purpose: its double-invocation changes focus behaviour
 * in ways that are an artefact of the harness rather than of the library.
 */
export function mountHarness(meta: HarnessMeta, node: ReactNode): void {
  const container = document.getElementById("root");
  if (!container) throw new Error("Harness requires a #root element in index.html");

  createRoot(container).render(node);
  announceReady(meta);
}

/** Available for adapters that genuinely need it. Not the default. */
export function mountHarnessStrict(meta: HarnessMeta, node: ReactNode): void {
  const container = document.getElementById("root");
  if (!container) throw new Error("Harness requires a #root element in index.html");

  createRoot(container).render(<StrictMode>{node}</StrictMode>);
  announceReady(meta);
}
