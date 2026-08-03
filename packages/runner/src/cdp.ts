/**
 * Chrome DevTools Protocol access to the computed accessibility tree.
 *
 * We read role, name and hidden-ness from the accessibility tree rather than
 * inferring them from the DOM. That is the whole point: the accessibility tree
 * is what assistive technology actually consumes, and questions like "is the
 * background genuinely hidden while the modal is open" cannot be answered by
 * looking at attributes. See docs/DECISIONS.md 002.
 *
 * Chromium-only, and documented as such.
 */

import type { CDPSession, Page } from "playwright";
import type { AxNode } from "@handrail/spec";

/**
 * Playwright does not publicly export the CDP protocol types, so the typed
 * `send` overloads are not reachable from here. One narrow cast at the boundary
 * is cleaner than fighting it at every call site.
 */
type RawSend = (method: string, params?: Record<string, unknown>) => Promise<any>;

interface RawAxNode {
  nodeId: string;
  ignored: boolean;
  role?: { value?: string };
  name?: { value?: string };
  description?: { value?: string };
  properties?: Array<{ name: string; value?: { value?: unknown } }>;
  childIds?: string[];
}

function normalise(raw: RawAxNode): AxNode {
  const properties: Record<string, string | number | boolean> = {};
  for (const prop of raw.properties ?? []) {
    const value = prop.value?.value;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      properties[prop.name] = value;
    }
  }
  return {
    nodeId: raw.nodeId,
    role: raw.role?.value ?? null,
    name: raw.name?.value ?? null,
    description: raw.description?.value ?? null,
    ignored: raw.ignored === true,
    properties,
    childIds: raw.childIds ?? [],
  };
}

export class Cdp {
  private constructor(
    private readonly session: CDPSession,
    private readonly send: RawSend,
  ) {}

  static async attach(page: Page): Promise<Cdp> {
    const session = await page.context().newCDPSession(page);
    const send = session.send.bind(session) as unknown as RawSend;
    await send("DOM.enable");
    await send("Accessibility.enable");
    return new Cdp(session, send);
  }

  async detach(): Promise<void> {
    await this.session.detach().catch(() => {});
  }

  /**
   * Resolve a CSS selector to a backend node id.
   *
   * `DOM.getDocument` is re-requested each time because it invalidates
   * previously issued node ids; the ids are used immediately, so this is safe
   * and avoids a class of stale-handle bug that is miserable to debug.
   */
  async backendNodeIdForSelector(selector: string): Promise<number | null> {
    const doc = await this.send("DOM.getDocument", { depth: -1, pierce: true });
    const { nodeId } = await this.send("DOM.querySelector", {
      nodeId: doc.root.nodeId,
      selector,
    });
    if (!nodeId) return null;
    const described = await this.send("DOM.describeNode", { nodeId });
    return described.node?.backendNodeId ?? null;
  }

  /** Backend node id of `document.activeElement`. */
  async backendNodeIdForActiveElement(): Promise<number | null> {
    const evaluated = await this.send("Runtime.evaluate", {
      expression: "document.activeElement",
    });
    const objectId = evaluated.result?.objectId;
    if (!objectId) return null;
    try {
      const { nodeId } = await this.send("DOM.requestNode", { objectId });
      if (!nodeId) return null;
      const described = await this.send("DOM.describeNode", { nodeId });
      return described.node?.backendNodeId ?? null;
    } finally {
      await this.send("Runtime.releaseObject", { objectId }).catch(() => {});
    }
  }

  /** The computed accessibility node for a DOM node, including ignored ones. */
  async axNode(backendNodeId: number): Promise<AxNode | null> {
    const result = await this.send("Accessibility.getPartialAXTree", {
      backendNodeId,
      fetchRelatives: false,
    });
    const raw: RawAxNode | undefined = result.nodes?.[0];
    return raw ? normalise(raw) : null;
  }

  async fullTree(): Promise<AxNode[]> {
    const { nodes } = await this.send("Accessibility.getFullAXTree");
    return (nodes as RawAxNode[]).map(normalise);
  }
}
