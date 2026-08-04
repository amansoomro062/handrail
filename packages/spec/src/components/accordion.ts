/**
 * Accordion: conformance spec.
 *
 * Derived from the W3C ARIA Authoring Practices Guide accordion pattern:
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 *
 * Worth reading alongside the tabs spec, because the two look similar and have
 * opposite keyboard requirements. A tablist is a *single* stop in the tab
 * sequence with arrows moving between tabs; accordion headers are *each* a stop,
 * and arrow keys are explicitly optional. Asserting tab-like behaviour here
 * would fail correct implementations, so `accordion.headers-are-tab-stops`
 * deliberately asserts the reverse of `tabs.tablist-is-one-tab-stop`.
 *
 * Note also what is absent: there is no arrow-key assertion. The APG lists
 * Up, Down, Home and End for accordions under *Optional*, so requiring them
 * would be our preference rather than the specification's.
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

const APG = "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/";
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

const HEADER_IDS = ["hr-header-1", "hr-header-2", "hr-header-3"] as const;

function nameContains(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  return actual.trim().replace(/\s+/g, " ").toLowerCase().includes(expected.toLowerCase());
}

function nameMatches(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  return actual.trim().replace(/\s+/g, " ").toLowerCase() === expected.toLowerCase();
}

function attrSelector(name: string, value: string): string {
  return `[${name}="${value.replace(/"/g, '\\"')}"]`;
}

/**
 * Expand the first section, waiting for the state to settle.
 *
 * With an explicit key, tests exactly that key. With none, tries each documented
 * activation route, a shared setup helper must not fail for the reason a
 * dedicated assertion is testing, or one defect cascades into many unrelated
 * failures. See docs/DECISIONS.md 012.
 */
async function expandFirst(ctx: RunContext, key?: string): Promise<boolean> {
  await ctx.keyboard.focus("hr-header-1");
  for (const attempt of key ? [key] : ["Enter", " "]) {
    await ctx.keyboard.press(attempt);
    if (await ctx.harness.waitForAttr("hr-header-1", "aria-expanded", "true", 1000)) return true;
  }
  return false;
}

const assertions: Assertion[] = [
  {
    id: "accordion.header-is-heading",
    title: "Each header control sits inside a heading",
    rationale:
      "Screen reader users navigate documents by heading. If accordion headers are not headings, an entire page structure disappears from the shortcut that most users rely on to move around it.",
    severity: "moderate",
    refs: { apg: APG_ROLES, ...WCAG.infoRelationships },
    async run(ctx) {
      const missing: string[] = [];
      for (const testId of HEADER_IDS) {
        const heading = await ctx.page.evaluate((id) => {
          const element = document.querySelector(`[data-testid="${id}"]`);
          const ancestor = element?.closest('h1,h2,h3,h4,h5,h6,[role="heading"]');
          return ancestor ? ancestor.tagName.toLowerCase() : null;
        }, testId);
        if (!heading) missing.push(testId);
      }
      return missing.length === 0
        ? pass("All three headers sit inside heading elements.")
        : fail(
            "One or more header controls are not contained in a heading.",
            "each control inside an h1–h6 or role=heading element",
            `${missing.join(", ")} have no heading ancestor`,
          );
    },
  },

  {
    id: "accordion.trigger-is-button",
    title: "Each header control exposes role=button",
    rationale:
      "The control that expands a section must be announced as a button, or the user is not told it can be operated at all.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const wrong: string[] = [];
      for (const testId of HEADER_IDS) {
        const role = await ctx.a11y.roleFor(testId);
        if (role !== "button") wrong.push(`${testId}: ${role ?? "absent from the accessibility tree"}`);
      }
      return wrong.length === 0
        ? pass("All three header controls expose role=button.")
        : fail("One or more header controls do not expose a button role.", 'role="button"', wrong.join("; "));
    },
  },

  {
    id: "accordion.trigger-has-accessible-name",
    title: "Each header control has an accessible name",
    rationale: "An unnamed control cannot be chosen deliberately from a list of them.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const expected = [TEXT.accordionHeader1, TEXT.accordionHeader2, TEXT.accordionHeader3];
      const wrong: string[] = [];
      for (const [index, testId] of HEADER_IDS.entries()) {
        const name = await ctx.a11y.nameFor(testId);
        const want = expected[index] as string;
        // Containment, not equality. Some libraries fold state into the name
        // ("collapsed Shipping"), which is redundant but does identify the
        // section, and identifying it is what the APG requires.
        if (!nameContains(name, want)) {
          wrong.push(`${testId}: expected "${want}", got ${name === null ? "no name" : `"${name}"`}`);
        }
      }
      return wrong.length === 0
        ? pass("All three headers expose their label.")
        : fail("One or more headers do not expose the expected accessible name.", "each header named", wrong.join("; "));
    },
  },

  {
    id: "accordion.collapsed-state-communicated",
    title: "Collapsed sections expose aria-expanded=false",
    rationale:
      "Without it the user is not told the control expands anything, so a collapsed accordion reads as a list of inert buttons.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const states: string[] = [];
      let correct = 0;
      for (const testId of HEADER_IDS) {
        const value = await ctx.harness.attr(testId, "aria-expanded");
        states.push(`${testId}=${value ?? "absent"}`);
        if (value === "false") correct += 1;
      }
      return correct === HEADER_IDS.length
        ? pass("All three sections report themselves collapsed.")
        : fail(
            "Collapsed sections do not expose aria-expanded=\"false\".",
            'aria-expanded="false" on every collapsed header',
            states.join(", "),
          );
    },
  },

  {
    id: "accordion.trigger-controls-panel",
    title: "The header control references its panel with aria-controls",
    rationale:
      "The relationship is what lets assistive technology move from the control to the content it reveals.",
    severity: "moderate",
    refs: { apg: APG_ROLES, ...WCAG.infoRelationships },
    async run(ctx) {
      // Checked while expanded: many libraries only render the panel then, and
      // a reference to a non-existent element is a different defect.
      if (!(await expandFirst(ctx)))
        return fail("The first section did not expand, so the relationship could not be checked.");
      const controls = await ctx.harness.waitForAttrPresent("hr-header-1", "aria-controls");
      if (!controls) {
        return fail(
          "The header control does not reference its panel.",
          "aria-controls referencing the panel",
          "attribute absent",
        );
      }
      const node = await ctx.a11y.nodeForSelector(attrSelector("id", controls));
      return node
        ? pass(`aria-controls references an element with id="${controls}"`)
        : fail(
            "The header references an element that does not exist.",
            `an element with id="${controls}"`,
            "no such element in the document",
          );
    },
  },

  {
    id: "accordion.collapsed-panel-not-exposed",
    title: "Collapsed panels are hidden from assistive technology",
    rationale:
      "A sighted user sees nothing. If the content is still in the accessibility tree, a screen reader user reads sections that appear closed, with no way to tell where one ends and the next begins.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const leaked: string[] = [];
      for (const testId of ["hr-panel-1", "hr-panel-2", "hr-panel-3"]) {
        // Not rendered at all is a perfectly good way to satisfy this.
        if (!(await ctx.harness.exists(testId))) continue;
        if (await ctx.a11y.isExposed(testId)) leaked.push(testId);
      }
      return leaked.length === 0
        ? pass("No collapsed panel is exposed.")
        : fail(
            "Collapsed panels are still exposed to assistive technology.",
            "collapsed panels absent from the accessibility tree or ignored",
            `${leaked.join(", ")} still present and not ignored`,
          );
    },
  },

  {
    id: "accordion.enter-expands",
    title: "Enter expands the focused section",
    rationale: "The primary activation key. Without it the content is unreachable by keyboard.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      if (!(await expandFirst(ctx, "Enter"))) {
        const state = await ctx.harness.attr("hr-header-1", "aria-expanded");
        return fail(
          "Enter did not expand the focused section.",
          'aria-expanded="true" on the first header',
          state === null ? "aria-expanded absent" : `aria-expanded="${state}"`,
        );
      }
      try {
        await ctx.harness.el("hr-panel-1").waitFor({ state: "visible", timeout: 2000 });
        return pass();
      } catch {
        return fail(
          "The header reported itself expanded but its panel did not appear.",
          "the first panel is visible",
          "the first panel is absent or hidden after 2000ms",
        );
      }
    },
  },

  {
    id: "accordion.space-expands",
    title: "Space expands the focused section",
    rationale:
      "The APG requires both Enter and Space on the header. Space is routinely missed by implementations that attach a click handler to a non-button element.",
    severity: "serious",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      if (!(await expandFirst(ctx, " "))) {
        const state = await ctx.harness.attr("hr-header-1", "aria-expanded");
        return fail(
          "Space did not expand the focused section.",
          'aria-expanded="true" on the first header',
          state === null ? "aria-expanded absent" : `aria-expanded="${state}"`,
        );
      }
      return pass();
    },
  },

  {
    id: "accordion.expanded-panel-exposed",
    title: "An expanded panel is exposed and reveals its content",
    rationale:
      "A header reporting itself expanded while its content stays hidden from assistive technology is worse than one that does nothing, because the announcement and the reality disagree.",
    severity: "blocker",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await expandFirst(ctx)))
        return fail("The first section did not expand, so its panel could not be checked.");
      if (!(await ctx.harness.exists("hr-panel-1"))) {
        return fail(
          "The expanded section has no panel in the document.",
          "the panel exists once expanded",
          "no element with that test id",
        );
      }
      return (await ctx.a11y.isExposed("hr-panel-1"))
        ? pass()
        : fail(
            "The expanded panel is not exposed to assistive technology.",
            "the panel is present in the accessibility tree and not ignored",
            "the panel is hidden or ignored despite the header reporting it expanded",
          );
    },
  },

  /*
   * Deliberately absent: an assertion that the panel has role=region and takes
   * its accessible name from its header.
   *
   * The APG lists both under *Optional* for this pattern, and explicitly warns
   * against role=region where it would proliferate landmarks. React Spectrum
   * uses role=group and no aria-labelledby, which is a legitimate reading of the
   * specification rather than a defect.
   *
   * It was written, it failed the calibration control, and it was removed -
   * see docs/DECISIONS.md 011. An optional clause is not a requirement, and
   * asserting one would have made this our preference dressed as conformance.
   */

  {
    id: "accordion.headers-are-tab-stops",
    title: "Tab moves between accordion headers",
    rationale:
      "Accordion headers are each a stop in the tab sequence, the opposite of a tablist, which is a single stop navigated with arrows. Implementations that copy tab behaviour here strand the user on the first header.",
    severity: "serious",
    refs: { apg: APG_KEYBOARD, ...WCAG.focusOrder },
    async run(ctx) {
      // Everything is collapsed on load, so nothing focusable sits between the
      // headers to complicate the traversal.
      await ctx.keyboard.focus("hr-header-1");
      const [next] = await ctx.keyboard.walk(1);
      if (!next) return fail("Could not determine focus after pressing Tab.");
      return next.testId === "hr-header-2"
        ? pass()
        : fail(
            "Tab did not move from the first header to the second.",
            'focus on [data-testid="hr-header-2"]',
            describeFocus(next),
          );
    },
  },

  {
    id: "accordion.collapses-again",
    title: "Activating an expanded header collapses it",
    rationale:
      "A section that opens and cannot be closed leaves the user unable to get back to a scannable list, which is the whole reason for using an accordion.",
    severity: "serious",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      if (!(await expandFirst(ctx)))
        return fail("The first section did not expand, so collapsing could not be checked.");
      await ctx.keyboard.press("Enter");
      const collapsed = await ctx.harness.waitForAttr("hr-header-1", "aria-expanded", "false", 2000);
      const state = await ctx.harness.attr("hr-header-1", "aria-expanded");
      return collapsed
        ? pass()
        : fail(
            "Pressing Enter again did not collapse the expanded section.",
            'aria-expanded="false" on the first header',
            state === null ? "aria-expanded absent" : `aria-expanded="${state}"`,
          );
    },
  },
];

export const accordionSpec: ComponentSpec = {
  id: "accordion",
  title: "Accordion",
  version: "1.0.0",
  apgPattern: APG,
  description:
    "A stack of collapsible sections. Deceptively similar to tabs and keyboard-wise its opposite: every header is a stop in the tab sequence, and arrow keys are optional rather than required. Headers must also be real headings, which is the requirement implementations most often drop.",
  requiredElements: [
    { testId: "hr-before", description: "Focusable button before the accordion", requiredAtLoad: true },
    { testId: "hr-header-1", description: `First header control, "${TEXT.accordionHeader1}"`, requiredAtLoad: true },
    { testId: "hr-header-2", description: `Second header control, "${TEXT.accordionHeader2}"`, requiredAtLoad: true },
    { testId: "hr-header-3", description: `Third header control, "${TEXT.accordionHeader3}"`, requiredAtLoad: true },
    { testId: "hr-after", description: "Focusable button after the accordion", requiredAtLoad: true },
    { testId: "hr-panel-1", description: "First panel, may be unmounted while collapsed", requiredAtLoad: false },
    { testId: "hr-panel-2", description: "Second panel, may be unmounted while collapsed", requiredAtLoad: false },
    { testId: "hr-panel-3", description: "Third panel, may be unmounted while collapsed", requiredAtLoad: false },
  ],
  assertions,
};
