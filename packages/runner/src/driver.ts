/**
 * The primitives specs are written against.
 *
 * Nothing in this file knows which library it is driving, and nothing in it ever
 * may. If a special case for a specific library seems necessary here, the design
 * has failed and the fix belongs in the adapter or the protocol.
 */

import type { Locator, Page } from "playwright";
import {
  READY_ATTRIBUTE,
  META_GLOBAL,
  PROTOCOL_VERSION,
  harnessPath,
  testIdSelector,
  type A11yTools,
  type AxNode,
  type FocusInfo,
  type HarnessHandle,
  type HarnessMeta,
  type KeyboardTools,
} from "@handrail/spec";

export class HarnessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HarnessError";
  }
}

/* ------------------------------------------------------------------ *
 * Accessibility tools
 * ------------------------------------------------------------------ */

import type { Cdp } from "./cdp.js";

export function createA11yTools(cdp: Cdp, page: Page): A11yTools {
  async function nodeForSelector(selector: string): Promise<AxNode | null> {
    const backendNodeId = await cdp.backendNodeIdForSelector(selector);
    if (backendNodeId === null) return null;
    return cdp.axNode(backendNodeId);
  }

  async function nodeFor(testId: string): Promise<AxNode | null> {
    return nodeForSelector(testIdSelector(testId));
  }

  return {
    tree: () => cdp.fullTree(),
    nodeFor,
    nodeForSelector,
    /**
     * Null when the element is absent OR ignored. An ignored element is not
     * announced, so "what name does assistive technology hear" is correctly
     * answered with nothing.
     */
    async nameFor(testId) {
      const node = await nodeFor(testId);
      if (!node || node.ignored) return null;
      return node.name;
    },
    async waitForName(testId, expected, timeoutMs = 2000) {
      const normalise = (value: string | null) =>
        value === null ? null : value.trim().replace(/\s+/g, " ").toLowerCase();
      const target = normalise(expected);
      const deadline = Date.now() + timeoutMs;
      let name: string | null = null;
      for (;;) {
        const node = await nodeFor(testId);
        name = !node || node.ignored ? null : node.name;
        if (normalise(name) === target || Date.now() >= deadline) return name;
        await page.waitForTimeout(25);
      }
    },
    async roleFor(testId) {
      const node = await nodeFor(testId);
      if (!node || node.ignored) return null;
      return node.role;
    },
    async isExposed(testId) {
      const node = await nodeFor(testId);
      return node !== null && !node.ignored;
    },
  };
}

/* ------------------------------------------------------------------ *
 * Keyboard and focus
 * ------------------------------------------------------------------ */

export function createKeyboardTools(page: Page, cdp: Cdp): KeyboardTools {
  async function focused(): Promise<FocusInfo> {
    const dom = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || el === document.documentElement) {
        return { isBody: true, tagName: "BODY", testId: null as string | null, selector: "body" };
      }
      const testId = el.getAttribute("data-testid");
      const parts = [el.tagName.toLowerCase()];
      if (el.id) parts.push(`#${el.id}`);
      if (testId) parts.push(`[data-testid="${testId}"]`);
      else if (el.className && typeof el.className === "string") {
        const first = el.className.trim().split(/\s+/)[0];
        if (first) parts.push(`.${first}`);
      }
      return { isBody: false, tagName: el.tagName, testId, selector: parts.join("") };
    });

    let role: string | null = null;
    let name: string | null = null;
    if (!dom.isBody) {
      const backendNodeId = await cdp.backendNodeIdForActiveElement();
      if (backendNodeId !== null) {
        const node = await cdp.axNode(backendNodeId);
        if (node && !node.ignored) {
          role = node.role;
          name = node.name;
        }
      }
    }

    return { ...dom, role, name };
  }

  async function tab(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) await page.keyboard.press("Tab");
  }

  async function shiftTab(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) await page.keyboard.press("Shift+Tab");
  }

  return {
    press: (key) => page.keyboard.press(key),
    tab,
    shiftTab,
    focused,
    async walk(steps, options) {
      const trail: FocusInfo[] = [];
      for (let i = 0; i < steps; i++) {
        await page.keyboard.press(options?.backwards ? "Shift+Tab" : "Tab");
        trail.push(await focused());
      }
      return trail;
    },
    async focus(testId) {
      // focus() rather than click(): clicking can open the very thing under test.
      await page.locator(testIdSelector(testId)).focus();
    },
    async waitForFocus(testId, timeoutMs = 2000) {
      try {
        await page.waitForFunction(
          (id) => document.activeElement?.getAttribute("data-testid") === id,
          testId,
          { timeout: timeoutMs },
        );
        return true;
      } catch {
        return false;
      }
    },
    async isFocusWithin(ancestorTestId) {
      return page.evaluate((id) => {
        const ancestor = document.querySelector(`[data-testid="${id}"]`);
        const active = document.activeElement;
        return Boolean(ancestor && active && (ancestor === active || ancestor.contains(active)));
      }, ancestorTestId);
    },
    async waitForFocusWithin(ancestorTestId, timeoutMs = 2000) {
      try {
        await page.waitForFunction(
          (id) => {
            const ancestor = document.querySelector(`[data-testid="${id}"]`);
            const active = document.activeElement;
            return Boolean(ancestor && active && (ancestor === active || ancestor.contains(active)));
          },
          ancestorTestId,
          { timeout: timeoutMs },
        );
        return true;
      } catch {
        return false;
      }
    },
  };
}

/* ------------------------------------------------------------------ *
 * Harness handle
 * ------------------------------------------------------------------ */

export interface HarnessOptions {
  baseUrl: string;
  component: string;
  readyTimeoutMs?: number;
}

export async function createHarness(
  page: Page,
  options: HarnessOptions,
): Promise<HarnessHandle> {
  const { baseUrl, component, readyTimeoutMs = 15_000 } = options;
  const url = new URL(harnessPath(component), baseUrl).toString();

  async function load(): Promise<void> {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    try {
      // `attached`, not the default `visible`. The ready signal is about the
      // attribute existing, and an adapter that renders nothing — one declaring
      // the component unsupported — has a zero-size <body> that Playwright would
      // never call visible, producing a bogus "adapter never signalled" error.
      await page.waitForSelector(`body[${READY_ATTRIBUTE}="true"]`, {
        state: "attached",
        timeout: readyTimeoutMs,
      });
    } catch {
      throw new HarnessError(
        `Adapter never signalled readiness at ${url}. ` +
          `Expected <body ${READY_ATTRIBUTE}="true"> within ${readyTimeoutMs}ms. ` +
          `See docs/HARNESS-PROTOCOL.md §2.`,
      );
    }
  }

  await load();

  const meta = (await page.evaluate(
    (global) => (window as unknown as Record<string, unknown>)[global],
    META_GLOBAL,
  )) as HarnessMeta | undefined;

  if (!meta) {
    throw new HarnessError(
      `Adapter did not expose window.${META_GLOBAL} at ${url}. See docs/HARNESS-PROTOCOL.md §3.`,
    );
  }
  if (meta.protocolVersion !== PROTOCOL_VERSION) {
    throw new HarnessError(
      `Adapter declares protocol version ${meta.protocolVersion}; this runner implements ${PROTOCOL_VERSION}. ` +
        `Refusing to run rather than produce a subtly wrong result.`,
    );
  }

  return {
    baseUrl,
    component,
    meta,
    reset: load,
    el: (testId: string): Locator => page.locator(testIdSelector(testId)),
    exists: async (testId) => (await page.locator(testIdSelector(testId)).count()) > 0,
    visible: (testId) => page.locator(testIdSelector(testId)).isVisible(),
    async isWithin(testId, ancestorTestId) {
      return page.evaluate(
        ([child, ancestor]) => {
          const c = document.querySelector(`[data-testid="${child}"]`);
          const a = document.querySelector(`[data-testid="${ancestor}"]`);
          return Boolean(c && a && a.contains(c));
        },
        [testId, ancestorTestId] as const,
      );
    },
    click: (testId) => page.locator(testIdSelector(testId)).click(),
    async text(testId) {
      return (await page.locator(testIdSelector(testId)).innerText()).trim();
    },
    async settle(ms = 60) {
      // Two frames lets a transition commit; the floor keeps interaction at a
      // speed a person could actually produce.
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
      );
      await page.waitForTimeout(ms);
    },
    attr: (testId, name) => page.locator(testIdSelector(testId)).getAttribute(name),
    async waitForAttrPresent(testId, name, timeoutMs = 2000) {
      await page
        .waitForFunction(
          ({ id, attribute }) => {
            const value = document.querySelector(`[data-testid="${id}"]`)?.getAttribute(attribute);
            return typeof value === "string" && value.length > 0;
          },
          { id: testId, attribute: name },
          { timeout: timeoutMs },
        )
        .catch(() => {});
      return page.locator(testIdSelector(testId)).getAttribute(name);
    },
    async waitForAttr(testId, name, value, timeoutMs = 2000) {
      try {
        await page.waitForFunction(
          ({ id, attribute, expected }) =>
            document.querySelector(`[data-testid="${id}"]`)?.getAttribute(attribute) === expected,
          { id: testId, attribute: name, expected: value },
          { timeout: timeoutMs },
        );
        return true;
      } catch {
        return false;
      }
    },
    value: (testId) => page.locator(testIdSelector(testId)).inputValue(),
    async waitForValue(testId, timeoutMs = 2000) {
      await page
        .waitForFunction(
          (id) => {
            const element = document.querySelector(`[data-testid="${id}"]`);
            return element instanceof HTMLInputElement && element.value !== "";
          },
          testId,
          { timeout: timeoutMs },
        )
        // Swallowed on purpose: report the value that is actually there rather
        // than a timeout, so the failure message says what happened.
        .catch(() => {});
      return page.locator(testIdSelector(testId)).inputValue();
    },
    async matches(selector) {
      return (await page.locator(selector).count()) > 0;
    },
  };
}
