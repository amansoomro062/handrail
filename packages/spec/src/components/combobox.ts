/**
 * Editable combobox with listbox popup: conformance spec.
 *
 * Derived from the W3C ARIA Authoring Practices Guide combobox pattern:
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * This is the pattern the industry gets wrong most often. It requires a role,
 * a managed expanded state, an ownership relationship to a popup, a separate
 * notion of "active option" that is distinct from DOM focus, and keyboard
 * handling for all of it. There are many more ways to build it badly than well.
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

const APG = "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/";
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

function nameMatches(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  return actual.trim().replace(/\s+/g, " ").toLowerCase() === expected.toLowerCase();
}

/** Escape a value for use inside an attribute selector. */
function attrSelector(name: string, value: string): string {
  return `[${name}="${value.replace(/"/g, '\\"')}"]`;
}

/**
 * Open the popup with Down Arrow, the APG-specified keyboard route.
 *
 * Deliberately keyboard rather than mouse: this pattern is most often broken
 * for keyboard users specifically, and opening by click would hide that.
 */
/**
 * Is the popup open, as assistive technology would see it?
 *
 * CSS visibility is the wrong measure. Ant Design renders role=listbox on a
 * zero-height virtual-scroll container, which Playwright calls invisible while a
 * screen reader reaches it perfectly well. Falling back to accessibility-tree
 * exposure keeps this consistent with decision 002, the tree is what we measure.
 */
async function popupIsOpen(ctx: RunContext, timeoutMs: number): Promise<boolean> {
  try {
    await ctx.harness.el("hr-listbox").waitFor({ state: "visible", timeout: timeoutMs });
    return true;
  } catch {
    return ctx.a11y.isExposed("hr-listbox");
  }
}

async function openPopup(ctx: RunContext, key?: string): Promise<boolean> {
  await ctx.keyboard.focus("hr-combobox");
  // With no key, try each route in turn. A shared setup helper must not fail
  // for the reason a dedicated assertion is testing, or one defect cascades
  // into a dozen unrelated failures, see docs/DECISIONS.md 012.
  for (const attempt of key ? [key] : ["ArrowDown", "Alt+ArrowDown"]) {
    await ctx.keyboard.press(attempt);
    if (await popupIsOpen(ctx, 1000)) {
      // A combobox keeps focus on the input, so settle on the expanded state
      // instead. Best-effort: expanded-state-communicated must stay free to fail.
      await ctx.harness.waitForAttr("hr-combobox", "aria-expanded", "true", 700);
      await ctx.harness.settle();
      return true;
    }
  }
  // Last resort so downstream assertions can still measure the open popup.
  await ctx.harness.click("hr-combobox");
  return popupIsOpen(ctx, 1000);
}

/**
 * The id of the currently active option, whether the library communicates it
 * with aria-activedescendant or by moving DOM focus.
 *
 * Both are legitimate implementations of "which option am I on", and a spec
 * that recognised only one would fail correct libraries for choosing the other.
 */
async function activeOptionId(ctx: RunContext): Promise<{ id: string | null; via: string }> {
  const activeDescendant = await ctx.harness.attr("hr-combobox", "aria-activedescendant");
  if (activeDescendant) return { id: activeDescendant, via: "aria-activedescendant" };

  const focused = await ctx.keyboard.focused();
  if (focused.role === "option") {
    const id = await ctx.page.evaluate(() => document.activeElement?.id ?? null);
    return { id, via: "DOM focus" };
  }
  return { id: null, via: "neither" };
}

const assertions: Assertion[] = [
  {
    id: "combobox.has-accessible-name",
    title: "The combobox has an accessible name",
    rationale:
      "Without a name, a screen reader announces an unlabelled combobox and the user has no idea what they are choosing.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const name = await ctx.a11y.nameFor("hr-combobox");
      return nameMatches(name, TEXT.comboboxLabel)
        ? pass(`Accessible name is "${name}"`)
        : fail(
            "The combobox does not expose the expected accessible name.",
            `"${TEXT.comboboxLabel}"`,
            name === null ? "no accessible name" : `"${name}"`,
          );
    },
  },

  {
    id: "combobox.has-combobox-role",
    title: "The input exposes role=combobox",
    rationale:
      "The role is what tells assistive technology that this input has a popup, and enables the announcements and shortcuts that go with it.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const role = await ctx.a11y.roleFor("hr-combobox");
      return role === "combobox"
        ? pass(`role="${role}"`)
        : fail(
            "The combobox input does not expose a combobox role.",
            '"combobox"',
            role === null ? "not present in the accessibility tree" : `"${role}"`,
          );
    },
  },

  {
    id: "combobox.is-focusable",
    title: "The combobox can be reached with the Tab key",
    rationale: "If Tab does not reach it, a keyboard user cannot use the control at all.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      await ctx.keyboard.focus("hr-before");
      const [next] = await ctx.keyboard.walk(1);
      if (!next) return fail("Could not determine focus after pressing Tab.");
      return next.testId === "hr-combobox"
        ? pass()
        : fail(
            "Tab from the preceding element did not reach the combobox.",
            'focus on [data-testid="hr-combobox"]',
            describeFocus(next),
          );
    },
  },

  {
    id: "combobox.collapsed-by-default",
    title: "aria-expanded is present and false before the popup opens",
    rationale:
      "aria-expanded is how a screen reader announces that this control has a popup and that it is currently shut. Omitting it until opening leaves the user unaware there is anything to open.",
    severity: "moderate",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      const expanded = await ctx.harness.attr("hr-combobox", "aria-expanded");
      if (expanded === "false") return pass();
      return fail(
        "The collapsed combobox does not expose aria-expanded=\"false\".",
        'aria-expanded="false"',
        expanded === null ? "attribute absent" : `aria-expanded="${expanded}"`,
      );
    },
  },

  {
    id: "combobox.opens-on-down-arrow",
    title: "Down Arrow opens the popup",
    rationale:
      "Down Arrow is the APG-specified way to open the list. If it does nothing, a keyboard user has no way to browse the options.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      return (await openPopup(ctx, "ArrowDown"))
        ? pass()
        : fail(
            "The popup did not open when Down Arrow was pressed on the focused combobox.",
            "listbox visible",
            "listbox absent or hidden after 2000ms",
          );
    },
  },

  {
    id: "combobox.expanded-state-communicated",
    title: "aria-expanded becomes true when the popup opens",
    rationale:
      "A sighted user sees the list appear. Without the state change, a screen reader user is never told it did.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openPopup(ctx)))
        return fail("The popup did not open, so its expanded state could not be checked.");
      const expanded = await ctx.harness.attr("hr-combobox", "aria-expanded");
      return expanded === "true"
        ? pass()
        : fail(
            "The combobox does not expose aria-expanded=\"true\" while its popup is open.",
            'aria-expanded="true"',
            expanded === null ? "attribute absent" : `aria-expanded="${expanded}"`,
          );
    },
  },

  {
    id: "combobox.popup-has-listbox-role",
    title: "The popup exposes role=listbox",
    rationale:
      "The listbox role is what makes the popup navigable as a set of options rather than announced as unstructured content.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openPopup(ctx)))
        return fail("The popup did not open, so its role could not be checked.");
      const role = await ctx.a11y.roleFor("hr-listbox");
      return role === "listbox"
        ? pass(`role="${role}"`)
        : fail(
            "The popup does not expose a listbox role.",
            '"listbox"',
            role === null ? "not present in the accessibility tree" : `"${role}"`,
          );
    },
  },

  {
    id: "combobox.controls-popup",
    title: "The combobox references its popup with aria-controls",
    rationale:
      "The relationship is what lets assistive technology connect the input to the list it drives, rather than treating them as unrelated regions.",
    severity: "moderate",
    refs: { apg: APG_ROLES, ...WCAG.infoRelationships },
    async run(ctx) {
      if (!(await openPopup(ctx)))
        return fail("The popup did not open, so the relationship could not be checked.");
      // APG permits either property for this relationship.
      const controls =
        (await ctx.harness.waitForAttrPresent("hr-combobox", "aria-controls")) ??
        (await ctx.harness.attr("hr-combobox", "aria-owns"));
      if (!controls) {
        return fail(
          "The combobox does not reference its popup.",
          "aria-controls (or aria-owns) referencing the listbox",
          "neither attribute present",
        );
      }
      const node = await ctx.a11y.nodeForSelector(attrSelector("id", controls));
      if (!node) {
        return fail(
          "The combobox references an element that does not exist.",
          `an element with id="${controls}"`,
          "no such element in the document",
        );
      }
      return node.role === "listbox"
        ? pass(`aria-controls references the listbox (id="${controls}")`)
        : fail(
            "The combobox references an element that is not the listbox.",
            "the referenced element exposes role=listbox",
            `referenced element exposes role="${node.role ?? "none"}"`,
          );
    },
  },

  {
    id: "combobox.options-have-option-role",
    title: "Each option exposes role=option",
    rationale:
      "Without the option role, a screen reader cannot count the choices, announce position within them, or let the user jump between them.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openPopup(ctx)))
        return fail("The popup did not open, so the options could not be checked.");
      const wrong: string[] = [];
      let present = 0;
      for (const testId of ["hr-option-1", "hr-option-2", "hr-option-3"]) {
        const role = await ctx.a11y.roleFor(testId);
        if (role === "option") present += 1;
        else wrong.push(`${testId}: ${role ?? "absent from the accessibility tree"}`);
      }
      if (wrong.length === 0) return pass("All three options expose role=option.");

      // A virtualised list may legitimately render a window of the options, but
      // only if it tells assistive technology how many there are and where each
      // sits. Without aria-setsize and aria-posinset the user cannot know the
      // set exists, so the two cases need different words.
      const setsize = present > 0 ? await ctx.harness.attr("hr-option-1", "aria-setsize") : null;
      const posinset = present > 0 ? await ctx.harness.attr("hr-option-1", "aria-posinset") : null;
      if (present > 0 && present < 3 && !setsize) {
        return fail(
          `Only ${present} of 3 options is exposed at a time, and the list does not say how many there are.`,
          "either every option is exposed, or aria-setsize and aria-posinset describe the full set",
          `${present} option(s) present, aria-setsize=${setsize ?? "absent"}, aria-posinset=${posinset ?? "absent"}`,
        );
      }
      return fail(
        "One or more options do not expose an option role.",
        'all options expose role="option"',
        wrong.join("; "),
      );
    },
  },

  {
    id: "combobox.arrow-moves-active-option",
    title: "Down Arrow moves through the options",
    rationale:
      "Browsing the list is the entire purpose of the control. If the arrow keys do not move between options, a keyboard user cannot reach anything but the first.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      if (!(await openPopup(ctx)))
        return fail("The popup did not open, so option navigation could not be checked.");
      const first = await activeOptionId(ctx);
      await ctx.keyboard.press("ArrowDown");
      const second = await activeOptionId(ctx);

      if (second.id === null) {
        return fail(
          "No option is active after pressing Down Arrow.",
          "an active option, via aria-activedescendant or DOM focus",
          "neither aria-activedescendant nor focus on an option",
        );
      }
      return first.id !== second.id
        ? pass(`Active option moved (${second.via}).`)
        : fail(
            "Down Arrow did not move to a different option.",
            "the active option changes",
            `the active option remained "${second.id}"`,
          );
    },
  },

  {
    id: "combobox.active-option-communicated",
    title: "The active option is exposed to assistive technology",
    rationale:
      "A sighted user sees the highlight move. Unless it is communicated through aria-activedescendant or DOM focus, a screen reader user is never told which option they are on.",
    severity: "serious",
    refs: { apg: APG_ROLES, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openPopup(ctx)))
        return fail("The popup did not open, so the active option could not be checked.");
      await ctx.keyboard.press("ArrowDown");
      const active = await activeOptionId(ctx);
      if (active.id === null) {
        return fail(
          "The active option is not exposed to assistive technology.",
          "aria-activedescendant referencing an option, or DOM focus on one",
          "neither",
        );
      }
      const node = await ctx.a11y.nodeForSelector(attrSelector("id", active.id));
      return node?.role === "option"
        ? pass(`Active option communicated via ${active.via}.`)
        : fail(
            "The active option reference does not point at an option.",
            "the referenced element exposes role=option",
            node === null
              ? `no element with id="${active.id}"`
              : `referenced element exposes role="${node.role ?? "none"}"`,
          );
    },
  },

  {
    id: "combobox.focus-remains-on-combobox",
    title: "DOM focus stays on the combobox while the popup is open",
    rationale:
      "The APG pattern keeps focus on the input so the user can keep typing to filter while browsing. Moving focus into the list breaks that and is a common source of confusing behaviour.",
    severity: "moderate",
    refs: { apg: APG_KEYBOARD, ...WCAG.focusOrder },
    async run(ctx) {
      if (!(await openPopup(ctx)))
        return fail("The popup did not open, so focus placement could not be checked.");
      await ctx.keyboard.press("ArrowDown");
      const focused = await ctx.keyboard.focused();
      return focused.testId === "hr-combobox"
        ? pass()
        : fail(
            "DOM focus left the combobox while its popup was open.",
            'focus remains on [data-testid="hr-combobox"]',
            describeFocus(focused),
          );
    },
  },

  {
    id: "combobox.enter-selects-active-option",
    title: "Enter selects the active option",
    rationale:
      "Selecting is the point of the control. If Enter does not commit the active option, a keyboard user can browse the list but never choose from it.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      if (!(await openPopup(ctx)))
        return fail("The popup did not open, so selection could not be checked.");
      await ctx.keyboard.press("ArrowDown");
      const active = await activeOptionId(ctx);
      const expected =
        active.id === null
          ? null
          : (await ctx.a11y.nodeForSelector(attrSelector("id", active.id)))?.name ?? null;

      await ctx.keyboard.press("Enter");
      // Selection commonly commits asynchronously, so this waits rather than
      // sampling the value the instant the key is released.
      const value = await ctx.harness.waitForValue("hr-combobox");

      if (!value) {
        return fail(
          "Pressing Enter did not put the active option's value into the combobox.",
          expected ? `value "${expected}"` : "the active option's value",
          "the combobox is still empty",
        );
      }
      if (expected && !nameMatches(value, expected)) {
        return fail(
          "Pressing Enter selected something other than the active option.",
          `value "${expected}"`,
          `value "${value}"`,
        );
      }
      return pass(`Selected "${value}".`);
    },
  },

  {
    id: "combobox.escape-closes",
    title: "Escape closes the popup",
    rationale:
      "Escape is the learned way out. Without it a user who opened the list by accident has no obvious way to dismiss it.",
    severity: "serious",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      if (!(await openPopup(ctx)))
        return fail("The popup did not open, so Escape could not be checked.");
      await ctx.keyboard.press("Escape");
      const stillOpen = await popupIsOpen(ctx, 200);
      if (stillOpen) {
        await ctx.harness.el("hr-listbox").waitFor({ state: "hidden", timeout: 1800 }).catch(() => {});
      }
      if (await popupIsOpen(ctx, 200)) {
        return fail(
          "The popup was still visible after pressing Escape.",
          "listbox closed",
          "listbox still visible after 2000ms",
        );
      }
      // The attribute is cleared a beat after the popup hides, so this waits
      // rather than reading it the instant the element disappears.
      await ctx.harness.waitForAttr("hr-combobox", "aria-expanded", "false", 1000);
      const expanded = await ctx.harness.attr("hr-combobox", "aria-expanded");
      return expanded === "false" || expanded === null
        ? pass()
        : fail(
            "The popup closed visually but the combobox still reports itself as expanded.",
            'aria-expanded="false"',
            `aria-expanded="${expanded}"`,
          );
    },
  },
];

export const comboboxSpec: ComponentSpec = {
  id: "combobox",
  title: "Combobox with listbox popup",
  version: "1.0.0",
  apgPattern: APG,
  description:
    "An editable combobox with a listbox popup. The pattern requires a role, a managed expanded state, an ownership relationship to the popup, and an active option distinct from DOM focus, all driven from the keyboard. It is the most frequently mis-implemented pattern in the APG.",
  requiredElements: [
    { testId: "hr-before", description: "Focusable button before the combobox", requiredAtLoad: true },
    { testId: "hr-combobox", description: `The combobox input, labelled "${TEXT.comboboxLabel}"`, requiredAtLoad: true },
    { testId: "hr-after", description: "Focusable button after the combobox", requiredAtLoad: true },
    { testId: "hr-listbox", description: "The popup listbox", requiredAtLoad: false },
    { testId: "hr-option-1", description: `First option, "${TEXT.comboboxOption1}"`, requiredAtLoad: false },
    { testId: "hr-option-2", description: `Second option, "${TEXT.comboboxOption2}"`, requiredAtLoad: false },
    { testId: "hr-option-3", description: `Third option, "${TEXT.comboboxOption3}"`, requiredAtLoad: false },
  ],
  assertions,
};
