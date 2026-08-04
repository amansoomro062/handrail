/**
 * Tabs: conformance spec.
 *
 * Derived from the W3C ARIA Authoring Practices Guide tabs pattern:
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * The distinguishing requirement is that a tablist is a *single* stop in the
 * tab sequence: Tab moves to the selected tab, and arrow keys move between
 * tabs. Implementations built from buttons in a row leave every tab in the tab
 * sequence, which is the most common defect in this pattern and is invisible
 * to anyone using a mouse.
 *
 * APG permits both automatic activation (arrow keys select as they move) and
 * manual activation (arrows move focus, Enter or Space selects). Assertions
 * below accept either; a spec recognising only one would fail correct libraries
 * for a choice the specification explicitly leaves open.
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

const APG = "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/";
const APG_KEYBOARD = `${APG}#keyboardinteraction`;
const APG_ROLES = `${APG}#wai-ariaroles,states,andproperties`;
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
  infoRelationships: {
    wcag: "1.3.1 Info and Relationships",
    wcagUrl: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
  },
} as const;

const TAB_IDS = ["hr-tab-1", "hr-tab-2", "hr-tab-3"] as const;

function nameMatches(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  return actual.trim().replace(/\s+/g, " ").toLowerCase() === expected.toLowerCase();
}

function attrSelector(name: string, value: string): string {
  return `[${name}="${value.replace(/"/g, '\\"')}"]`;
}

/**
 * Move focus to the second tab and ensure it becomes selected, by whichever
 * activation model the library implements.
 *
 * Returns how it was achieved so failure messages can say which path was tried.
 */
async function selectSecondTab(
  ctx: RunContext,
): Promise<{ ok: boolean; via: string }> {
  await ctx.keyboard.focus("hr-tab-1");
  await ctx.keyboard.press("ArrowRight");

  // Automatic activation: arrowing selects as it moves.
  if (await ctx.harness.waitForAttr("hr-tab-2", "aria-selected", "true", 500)) {
    return { ok: true, via: "automatic activation" };
  }
  // Manual activation: arrows move focus, Enter or Space commits.
  await ctx.keyboard.press("Enter");
  if (await ctx.harness.waitForAttr("hr-tab-2", "aria-selected", "true", 500)) {
    return { ok: true, via: "manual activation with Enter" };
  }
  await ctx.keyboard.press(" ");
  if (await ctx.harness.waitForAttr("hr-tab-2", "aria-selected", "true", 500)) {
    return { ok: true, via: "manual activation with Space" };
  }
  return { ok: false, via: "neither automatic nor manual activation" };
}

const assertions: Assertion[] = [
  {
    id: "tabs.tablist-has-role",
    title: "The tab container exposes role=tablist",
    rationale:
      "The tablist role is what tells assistive technology these are tabs rather than a row of buttons, and enables the navigation that goes with them.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const role = await ctx.a11y.roleFor("hr-tablist");
      return role === "tablist"
        ? pass(`role="${role}"`)
        : fail(
            "The tab container does not expose a tablist role.",
            '"tablist"',
            role === null ? "not present in the accessibility tree" : `"${role}"`,
          );
    },
  },

  {
    id: "tabs.tabs-have-tab-role",
    title: "Each tab exposes role=tab",
    rationale:
      "Without it a screen reader cannot announce position within the set or offer tab navigation.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const wrong: string[] = [];
      for (const testId of TAB_IDS) {
        const role = await ctx.a11y.roleFor(testId);
        if (role !== "tab") wrong.push(`${testId}: ${role ?? "absent from the accessibility tree"}`);
      }
      return wrong.length === 0
        ? pass("All three tabs expose role=tab.")
        : fail("One or more tabs do not expose a tab role.", 'all tabs expose role="tab"', wrong.join("; "));
    },
  },

  {
    id: "tabs.tab-has-accessible-name",
    title: "Each tab has an accessible name",
    rationale: "An unnamed tab is announced as an empty tab and cannot be chosen deliberately.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const expected = [TEXT.tab1, TEXT.tab2, TEXT.tab3];
      const wrong: string[] = [];
      for (const [index, testId] of TAB_IDS.entries()) {
        const name = await ctx.a11y.nameFor(testId);
        const want = expected[index] as string;
        if (!nameMatches(name, want)) {
          wrong.push(`${testId}: expected "${want}", got ${name === null ? "no name" : `"${name}"`}`);
        }
      }
      return wrong.length === 0
        ? pass("All three tabs expose their label.")
        : fail("One or more tabs do not expose the expected accessible name.", "each tab named", wrong.join("; "));
    },
  },

  {
    id: "tabs.panel-has-tabpanel-role",
    title: "The selected panel exposes role=tabpanel",
    rationale:
      "The tabpanel role is what associates the revealed content with the tab that revealed it, rather than leaving it as loose content on the page.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const role = await ctx.a11y.roleFor("hr-panel-1");
      return role === "tabpanel"
        ? pass(`role="${role}"`)
        : fail(
            "The selected panel does not expose a tabpanel role.",
            '"tabpanel"',
            role === null ? "not present in the accessibility tree" : `"${role}"`,
          );
    },
  },

  {
    id: "tabs.selected-tab-communicated",
    title: "Exactly one tab is marked selected",
    rationale:
      "aria-selected is the only way a screen reader user knows which tab they are on. Marking none, or several, makes the set unreadable.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const states: string[] = [];
      let selected = 0;
      for (const testId of TAB_IDS) {
        const value = await ctx.harness.attr(testId, "aria-selected");
        states.push(`${testId}=${value ?? "absent"}`);
        if (value === "true") selected += 1;
      }
      return selected === 1
        ? pass(`One tab selected (${states.join(", ")}).`)
        : fail(
            selected === 0
              ? "No tab is marked as selected."
              : `${selected} tabs are marked as selected simultaneously.`,
            'exactly one tab with aria-selected="true"',
            states.join(", "),
          );
    },
  },

  {
    id: "tabs.panel-labelled-by-tab",
    title: "The panel takes its accessible name from its tab",
    rationale:
      "On entering the panel, a screen reader announces its name. Taking it from the tab is what tells the user which panel they are in.",
    severity: "moderate",
    refs: { apg: APG_ROLES, ...WCAG.infoRelationships },
    async run(ctx) {
      const name = await ctx.a11y.nameFor("hr-panel-1");
      return nameMatches(name, TEXT.tab1)
        ? pass(`Panel accessible name is "${name}"`)
        : fail(
            "The panel is not labelled by its tab.",
            `"${TEXT.tab1}"`,
            name === null ? "no accessible name" : `"${name}"`,
          );
    },
  },

  {
    id: "tabs.tab-controls-panel",
    title: "The tab references its panel with aria-controls",
    rationale:
      "The relationship lets assistive technology move from a tab straight to the content it reveals, rather than hunting for it.",
    severity: "moderate",
    refs: { apg: APG_ROLES, ...WCAG.infoRelationships },
    async run(ctx) {
      const controls = await ctx.harness.waitForAttrPresent("hr-tab-1", "aria-controls");
      if (!controls) {
        return fail(
          "The selected tab does not reference its panel.",
          "aria-controls referencing the tabpanel",
          "attribute absent",
        );
      }
      const node = await ctx.a11y.nodeForSelector(attrSelector("id", controls));
      if (!node) {
        return fail(
          "The tab references an element that does not exist.",
          `an element with id="${controls}"`,
          "no such element in the document",
        );
      }
      return node.role === "tabpanel"
        ? pass(`aria-controls references the panel (id="${controls}")`)
        : fail(
            "The tab references an element that is not its panel.",
            "the referenced element exposes role=tabpanel",
            `referenced element exposes role="${node.role ?? "none"}"`,
          );
    },
  },

  {
    id: "tabs.unselected-panels-not-exposed",
    title: "Unselected panels are hidden from assistive technology",
    rationale:
      "A sighted user sees one panel. If the others remain in the accessibility tree, a screen reader user reads content that is visually hidden and has no way to tell which panel they are in.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const leaked: string[] = [];
      for (const testId of ["hr-panel-2", "hr-panel-3"]) {
        // Absent from the DOM entirely is a perfectly good way to satisfy this.
        if (!(await ctx.harness.exists(testId))) continue;
        if (await ctx.a11y.isExposed(testId)) leaked.push(testId);
      }
      return leaked.length === 0
        ? pass("Only the selected panel is exposed.")
        : fail(
            "Unselected panels are still exposed to assistive technology.",
            "unselected panels absent from the accessibility tree or ignored",
            `${leaked.join(", ")} still present and not ignored`,
          );
    },
  },

  {
    id: "tabs.tab-key-reaches-selected-tab",
    title: "Tab moves focus to the selected tab",
    rationale: "If Tab does not reach the tablist, a keyboard user cannot change tabs at all.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      await ctx.keyboard.focus("hr-before");
      const [next] = await ctx.keyboard.walk(1);
      if (!next) return fail("Could not determine focus after pressing Tab.");
      return next.testId === "hr-tab-1"
        ? pass()
        : fail(
            "Tab from the preceding element did not reach the selected tab.",
            'focus on [data-testid="hr-tab-1"]',
            describeFocus(next),
          );
    },
  },

  {
    id: "tabs.tablist-is-one-tab-stop",
    title: "The tablist is a single stop in the tab sequence",
    rationale:
      "Tabs are navigated with arrow keys, not the Tab key. Leaving every tab in the tab sequence forces a keyboard user to step through all of them to reach the page content, and is the usual result of building tabs out of a row of buttons.",
    severity: "serious",
    refs: { apg: APG_KEYBOARD, ...WCAG.focusOrder },
    async run(ctx) {
      await ctx.keyboard.focus("hr-tab-1");
      const [next] = await ctx.keyboard.walk(1);
      if (!next) return fail("Could not determine focus after pressing Tab.");
      const landedOnAnotherTab = next.testId === "hr-tab-2" || next.testId === "hr-tab-3";
      return landedOnAnotherTab
        ? fail(
            "Tab moved to another tab, so every tab is in the tab sequence.",
            "Tab leaves the tablist; arrow keys move between tabs",
            `focus moved to [data-testid="${next.testId}"]`,
          )
        : pass(`Tab left the tablist to ${describeFocus(next)}.`);
    },
  },

  {
    id: "tabs.arrow-moves-between-tabs",
    title: "Right Arrow moves focus to the next tab",
    rationale:
      "Arrow keys are how the APG pattern navigates a tablist. Without them a keyboard user can reach the selected tab and no other.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      await ctx.keyboard.focus("hr-tab-1");
      await ctx.keyboard.press("ArrowRight");
      const moved = await ctx.keyboard.waitForFocus("hr-tab-2");
      const focused = await ctx.keyboard.focused();
      return moved
        ? pass()
        : fail(
            "Right Arrow did not move focus to the next tab.",
            'focus on [data-testid="hr-tab-2"]',
            describeFocus(focused),
          );
    },
  },

  {
    id: "tabs.activation-selects-tab",
    title: "Keyboard navigation can select a different tab",
    rationale:
      "Selecting a tab is the point of the component. Accepts either activation model the APG permits.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      const { ok, via } = await selectSecondTab(ctx);
      if (!ok) {
        const states: string[] = [];
        for (const testId of TAB_IDS) {
          states.push(`${testId}=${(await ctx.harness.attr(testId, "aria-selected")) ?? "absent"}`);
        }
        return fail(
          "The second tab could not be selected from the keyboard.",
          'aria-selected="true" on the second tab after ArrowRight, then Enter, then Space',
          states.join(", "),
        );
      }
      return pass(`Second tab selected via ${via}.`);
    },
  },

  {
    id: "tabs.activation-reveals-panel",
    title: "Selecting a tab reveals its panel",
    rationale:
      "A tab that reports itself selected while the wrong content is showing is worse than one that does nothing, because the announcement and the content disagree.",
    severity: "blocker",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const { ok } = await selectSecondTab(ctx);
      if (!ok) return fail("The second tab could not be selected, so its panel could not be checked.");
      try {
        await ctx.harness.el("hr-panel-2").waitFor({ state: "visible", timeout: 2000 });
      } catch {
        return fail(
          "The second panel did not appear after its tab was selected.",
          "the second panel is visible",
          "the second panel is absent or hidden after 2000ms",
        );
      }
      // The old panel is torn down a beat after the new one appears, so this
      // waits for it to go rather than reading the instant the switch lands.
      // Caught by --repeat 30 against Chakra, which was flipping here.
      const deadline = Date.now() + 2000;
      let firstStillExposed = true;
      while (Date.now() < deadline) {
        firstStillExposed =
          (await ctx.harness.exists("hr-panel-1")) && (await ctx.a11y.isExposed("hr-panel-1"));
        if (!firstStillExposed) break;
        await ctx.page.waitForTimeout(25);
      }
      return firstStillExposed
        ? fail(
            "The previously selected panel is still exposed alongside the new one.",
            "only the newly selected panel is exposed",
            "the first panel is still present and not ignored",
          )
        : pass();
    },
  },
];

export const tabsSpec: ComponentSpec = {
  id: "tabs",
  title: "Tabs",
  version: "1.0.0",
  apgPattern: APG,
  description:
    "A tablist with associated panels. The defining requirement is that the whole tablist is one stop in the tab sequence, with arrow keys moving between tabs, the part that implementations built from a row of buttons almost always miss, and that is completely invisible to a mouse user.",
  requiredElements: [
    { testId: "hr-before", description: "Focusable button before the tablist", requiredAtLoad: true },
    { testId: "hr-tablist", description: "The tab list container", requiredAtLoad: true },
    { testId: "hr-tab-1", description: `First tab, "${TEXT.tab1}", selected on load`, requiredAtLoad: true },
    { testId: "hr-tab-2", description: `Second tab, "${TEXT.tab2}"`, requiredAtLoad: true },
    { testId: "hr-tab-3", description: `Third tab, "${TEXT.tab3}"`, requiredAtLoad: true },
    { testId: "hr-after", description: "Focusable button after the tabs", requiredAtLoad: true },
    { testId: "hr-panel-1", description: `First panel, "${TEXT.panel1}"`, requiredAtLoad: true },
    { testId: "hr-panel-2", description: `Second panel, may be unmounted while unselected`, requiredAtLoad: false },
    { testId: "hr-panel-3", description: `Third panel, may be unmounted while unselected`, requiredAtLoad: false },
  ],
  assertions,
};
