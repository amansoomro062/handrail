/**
 * Menu button with menu — conformance spec.
 *
 * Derived from the W3C ARIA Authoring Practices Guide menu button pattern:
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *
 * Where a combobox keeps DOM focus on the input and tracks a separate active
 * option, a menu moves focus into itself. That difference is the thing most
 * often got wrong — menus built by adapting a dropdown usually keep focus
 * outside, leaving a keyboard user with a visible menu they cannot enter.
 */

import { TEXT } from "../protocol.js";
import {
  describeFocus,
  fail,
  pass,
  type Assertion,
  type ComponentSpec,
  type RunContext,
} from "../types.js";

const APG = "https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/";
const APG_KEYBOARD = `${APG}#keyboardinteraction`;
const APG_MENU = "https://www.w3.org/WAI/ARIA/apg/patterns/menubar/";
const WCAG = {
  keyboard: {
    wcag: "2.1.1 Keyboard",
    wcagUrl: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html",
  },
  focusOrder: {
    wcag: "2.4.3 Focus Order",
    wcagUrl: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html",
  },
  nameRoleValue: {
    wcag: "4.1.2 Name, Role, Value",
    wcagUrl: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
  },
} as const;

const ITEM_IDS = ["hr-item-1", "hr-item-2", "hr-item-3"] as const;

function nameMatches(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  return actual.trim().replace(/\s+/g, " ").toLowerCase() === expected.toLowerCase();
}

function attrSelector(name: string, value: string): string {
  return `[${name}="${value.replace(/"/g, '\\"')}"]`;
}

/** Open with a key, per APG. Never by click — this pattern breaks for keyboards. */
async function openMenu(ctx: RunContext, key = "ArrowDown"): Promise<boolean> {
  await ctx.keyboard.focus("hr-trigger");
  await ctx.keyboard.press(key);
  try {
    await ctx.harness.el("hr-menu").waitFor({ state: "visible", timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Which item is active, by either mechanism the APG permits: DOM focus on a
 * menuitem (roving tabindex) or aria-activedescendant on the menu.
 */
async function activeItem(
  ctx: RunContext,
): Promise<{ testId: string | null; id: string | null; via: string }> {
  const focused = await ctx.keyboard.focused();
  if (focused.role === "menuitem" || (focused.testId && ITEM_IDS.includes(focused.testId as never))) {
    const id = await ctx.page.evaluate(() => document.activeElement?.id ?? null);
    return { testId: focused.testId, id, via: "DOM focus" };
  }

  const activeDescendant = await ctx.harness.attr("hr-menu", "aria-activedescendant");
  if (activeDescendant) {
    const testId = await ctx.page.evaluate(
      (id) => document.getElementById(id)?.getAttribute("data-testid") ?? null,
      activeDescendant,
    );
    return { testId, id: activeDescendant, via: "aria-activedescendant" };
  }

  return { testId: null, id: null, via: "neither" };
}

/**
 * Poll until the active item stops matching `from`, or the timeout expires.
 *
 * Roving-focus implementations frequently move focus in an effect or an
 * animation frame rather than synchronously in the keydown handler. Reading the
 * active item immediately after a keypress fails libraries that are behaving
 * correctly — this is the third time that mistake has appeared in this codebase,
 * see docs/DECISIONS.md 007.
 */
async function waitForActiveItemChange(
  ctx: RunContext,
  from: string | null,
  timeoutMs = 2000,
): Promise<Awaited<ReturnType<typeof activeItem>>> {
  const deadline = Date.now() + timeoutMs;
  let latest = await activeItem(ctx);
  while (latest.testId === from && Date.now() < deadline) {
    await ctx.page.waitForTimeout(25);
    latest = await activeItem(ctx);
  }
  return latest;
}

const assertions: Assertion[] = [
  {
    id: "menu.trigger-has-accessible-name",
    title: "The menu button has an accessible name",
    rationale:
      "An unlabelled menu button is announced as just a button, giving no indication of what it opens.",
    severity: "serious",
    refs: { apg: APG, ...WCAG.nameRoleValue },
    async run(ctx) {
      const name = await ctx.a11y.nameFor("hr-trigger");
      return nameMatches(name, TEXT.menuTrigger)
        ? pass(`Accessible name is "${name}"`)
        : fail(
            "The menu button does not expose the expected accessible name.",
            `"${TEXT.menuTrigger}"`,
            name === null ? "no accessible name" : `"${name}"`,
          );
    },
  },

  {
    id: "menu.trigger-has-haspopup",
    title: "The menu button declares that it opens a menu",
    rationale:
      "aria-haspopup is what warns a screen reader user that activating this button opens something, rather than performing an action.",
    severity: "serious",
    refs: { apg: APG, ...WCAG.nameRoleValue },
    async run(ctx) {
      const haspopup = await ctx.harness.attr("hr-trigger", "aria-haspopup");
      // "true" is the legacy synonym for "menu" and remains valid.
      return haspopup === "menu" || haspopup === "true"
        ? pass(`aria-haspopup="${haspopup}"`)
        : fail(
            "The menu button does not declare that it opens a menu.",
            'aria-haspopup="menu"',
            haspopup === null ? "attribute absent" : `aria-haspopup="${haspopup}"`,
          );
    },
  },

  {
    id: "menu.trigger-collapsed-by-default",
    title: "aria-expanded is present and false before the menu opens",
    rationale:
      "Without it the user is not told the menu is currently shut, only that something can be opened.",
    severity: "moderate",
    refs: { apg: APG, ...WCAG.nameRoleValue },
    async run(ctx) {
      const expanded = await ctx.harness.attr("hr-trigger", "aria-expanded");
      return expanded === "false"
        ? pass()
        : fail(
            'The collapsed menu button does not expose aria-expanded="false".',
            'aria-expanded="false"',
            expanded === null ? "attribute absent" : `aria-expanded="${expanded}"`,
          );
    },
  },

  {
    id: "menu.opens-on-enter",
    title: "Enter opens the menu",
    rationale: "The primary activation key. If it does nothing, the menu is unreachable by keyboard.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      return (await openMenu(ctx, "Enter"))
        ? pass()
        : fail(
            "The menu did not open when Enter was pressed on the focused button.",
            "menu visible",
            "menu absent or hidden after 2000ms",
          );
    },
  },

  {
    id: "menu.opens-on-down-arrow",
    title: "Down Arrow opens the menu",
    rationale:
      "APG requires Down Arrow to open the menu and move to its first item, which is how most keyboard users reach it.",
    severity: "serious",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      return (await openMenu(ctx, "ArrowDown"))
        ? pass()
        : fail(
            "The menu did not open when Down Arrow was pressed on the focused button.",
            "menu visible",
            "menu absent or hidden after 2000ms",
          );
    },
  },

  {
    id: "menu.expanded-state-communicated",
    title: "aria-expanded becomes true when the menu opens",
    rationale:
      "A sighted user sees the menu appear. Without the state change a screen reader user is never told it did.",
    severity: "serious",
    refs: { apg: APG, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openMenu(ctx)))
        return fail("The menu did not open, so its expanded state could not be checked.");
      const expanded = await ctx.harness.attr("hr-trigger", "aria-expanded");
      return expanded === "true"
        ? pass()
        : fail(
            'The menu button does not expose aria-expanded="true" while its menu is open.',
            'aria-expanded="true"',
            expanded === null ? "attribute absent" : `aria-expanded="${expanded}"`,
          );
    },
  },

  {
    id: "menu.has-menu-role",
    title: "The popup exposes role=menu",
    rationale:
      "The menu role is what makes the popup navigable as a menu rather than announced as a list of links.",
    severity: "serious",
    refs: { apg: APG_MENU, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openMenu(ctx)))
        return fail("The menu did not open, so its role could not be checked.");
      const role = await ctx.a11y.roleFor("hr-menu");
      return role === "menu"
        ? pass(`role="${role}"`)
        : fail(
            "The popup does not expose a menu role.",
            '"menu"',
            role === null ? "not present in the accessibility tree" : `"${role}"`,
          );
    },
  },

  {
    id: "menu.items-have-menuitem-role",
    title: "Each item exposes role=menuitem",
    rationale:
      "Without it a screen reader cannot count the items, announce position, or offer menu navigation shortcuts.",
    severity: "serious",
    refs: { apg: APG_MENU, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openMenu(ctx)))
        return fail("The menu did not open, so its items could not be checked.");
      const wrong: string[] = [];
      for (const testId of ITEM_IDS) {
        const role = await ctx.a11y.roleFor(testId);
        // Checkbox and radio menu items are legitimate variants of the role.
        if (role !== "menuitem" && role !== "menuitemcheckbox" && role !== "menuitemradio") {
          wrong.push(`${testId}: ${role ?? "absent from the accessibility tree"}`);
        }
      }
      return wrong.length === 0
        ? pass("All three items expose a menuitem role.")
        : fail(
            "One or more items do not expose a menuitem role.",
            'all items expose role="menuitem"',
            wrong.join("; "),
          );
    },
  },

  {
    id: "menu.focus-enters-menu-on-open",
    title: "Opening the menu moves to its first item",
    rationale:
      "This is the difference between a menu and a dropdown. If nothing becomes active on open, a keyboard user is left with a visible menu they cannot enter.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.focusOrder },
    async run(ctx) {
      if (!(await openMenu(ctx)))
        return fail("The menu did not open, so focus placement could not be checked.");
      const active = await waitForActiveItemChange(ctx, null);
      if (active.testId === null) {
        const focused = await ctx.keyboard.focused();
        return fail(
          "No menu item became active when the menu opened.",
          "the first item is focused, or referenced by aria-activedescendant",
          `${describeFocus(focused)}, and no aria-activedescendant on the menu`,
        );
      }
      return active.testId === "hr-item-1"
        ? pass(`First item active via ${active.via}.`)
        : fail(
            "Opening the menu did not move to the first item.",
            'the active item is [data-testid="hr-item-1"]',
            `the active item is [data-testid="${active.testId}"]`,
          );
    },
  },

  {
    id: "menu.arrow-moves-between-items",
    title: "Down Arrow moves to the next item",
    rationale:
      "Without arrow navigation a keyboard user can reach the first item and nothing beyond it.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      if (!(await openMenu(ctx)))
        return fail("The menu did not open, so item navigation could not be checked.");
      const first = await waitForActiveItemChange(ctx, null);
      await ctx.keyboard.press("ArrowDown");
      const second = await waitForActiveItemChange(ctx, first.testId);

      if (second.testId === null) {
        return fail(
          "No item is active after pressing Down Arrow.",
          "an active menu item",
          "neither DOM focus on an item nor aria-activedescendant",
        );
      }
      return first.testId !== second.testId
        ? pass(`Moved from ${first.testId ?? "nothing"} to ${second.testId}.`)
        : fail(
            "Down Arrow did not move to a different item.",
            "the active item changes",
            `the active item remained "${second.testId}"`,
          );
    },
  },

  {
    id: "menu.escape-closes",
    title: "Escape closes the menu",
    rationale: "The learned way out. Without it a user who opened the menu by accident is stuck in it.",
    severity: "serious",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      if (!(await openMenu(ctx)))
        return fail("The menu did not open, so Escape could not be checked.");
      await ctx.keyboard.press("Escape");
      try {
        await ctx.harness.el("hr-menu").waitFor({ state: "hidden", timeout: 2000 });
        return pass();
      } catch {
        return fail(
          "The menu was still visible after pressing Escape.",
          "menu closed",
          "menu still visible after 2000ms",
        );
      }
    },
  },

  {
    id: "menu.focus-restored-on-close",
    title: "Closing the menu returns focus to the button",
    rationale:
      "Focus was moved into the menu on open. If it is not handed back on close, the user is dropped to the top of the document and loses their place.",
    severity: "serious",
    refs: { apg: APG_KEYBOARD, ...WCAG.focusOrder },
    async run(ctx) {
      if (!(await openMenu(ctx)))
        return fail("The menu did not open, so focus restoration could not be checked.");
      await ctx.keyboard.press("Escape");
      await ctx.harness.el("hr-menu").waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
      const restored = await ctx.keyboard.waitForFocus("hr-trigger");
      const focused = await ctx.keyboard.focused();
      return restored
        ? pass()
        : fail(
            "Focus was not returned to the menu button after the menu closed.",
            'focus on [data-testid="hr-trigger"]',
            describeFocus(focused),
          );
    },
  },

  {
    id: "menu.item-has-accessible-name",
    title: "Each item has an accessible name",
    rationale: "An unnamed menu item is announced as an empty menuitem and cannot be chosen deliberately.",
    severity: "serious",
    refs: { apg: APG_MENU, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openMenu(ctx)))
        return fail("The menu did not open, so its items could not be checked.");
      const expected = [TEXT.menuItem1, TEXT.menuItem2, TEXT.menuItem3];
      const wrong: string[] = [];
      for (const [index, testId] of ITEM_IDS.entries()) {
        const name = await ctx.a11y.nameFor(testId);
        const want = expected[index] as string;
        if (!nameMatches(name, want)) {
          wrong.push(`${testId}: expected "${want}", got ${name === null ? "no name" : `"${name}"`}`);
        }
      }
      return wrong.length === 0
        ? pass("All three items expose their label.")
        : fail("One or more items do not expose the expected accessible name.", "each item named", wrong.join("; "));
    },
  },
];

export const menuSpec: ComponentSpec = {
  id: "menu",
  title: "Menu button with menu",
  version: "1.0.0",
  apgPattern: APG,
  description:
    "A button that opens a menu. Unlike a combobox, focus moves into the menu itself. Menus adapted from generic dropdowns typically leave focus outside, which produces a menu a keyboard user can see but not enter.",
  requiredElements: [
    { testId: "hr-before", description: "Focusable button before the menu button", requiredAtLoad: true },
    { testId: "hr-trigger", description: `The menu button, labelled "${TEXT.menuTrigger}"`, requiredAtLoad: true },
    { testId: "hr-after", description: "Focusable button after the menu button", requiredAtLoad: true },
    { testId: "hr-menu", description: "The menu popup", requiredAtLoad: false },
    { testId: "hr-item-1", description: `First item, "${TEXT.menuItem1}"`, requiredAtLoad: false },
    { testId: "hr-item-2", description: `Second item, "${TEXT.menuItem2}"`, requiredAtLoad: false },
    { testId: "hr-item-3", description: `Third item, "${TEXT.menuItem3}"`, requiredAtLoad: false },
  ],
  assertions,
};
