/**
 * Modal dialog conformance spec.
 *
 * Derived from the W3C ARIA Authoring Practices Guide dialog (modal) pattern:
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * Every assertion below cites a clause of that pattern or a WCAG success
 * criterion. Assertions that cannot cite one do not belong here — see
 * docs/DECISIONS.md 001.
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

const APG = "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/";
const APG_KEYBOARD = `${APG}#keyboardinteraction`;
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
  noKeyboardTrap: {
    wcag: "2.1.2 No Keyboard Trap",
    wcagUrl: "https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html",
  },
} as const;

/** Compare accessible names forgivingly — whitespace and case are not the point. */
function nameMatches(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  return actual.trim().replace(/\s+/g, " ").toLowerCase() === expected.toLowerCase();
}

/**
 * Open the dialog by clicking the trigger and wait for it to appear.
 * Returns false when it never appears, so callers can fail with a clear reason
 * rather than timing out somewhere less informative.
 */
async function openDialog(ctx: RunContext): Promise<boolean> {
  await ctx.harness.click("hr-trigger");
  try {
    await ctx.harness.el("hr-dialog").waitFor({ state: "visible", timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

const assertions: Assertion[] = [
  {
    id: "dialog.trigger-has-accessible-name",
    title: "The control that opens the dialog has an accessible name",
    rationale:
      "A screen reader user hearing only \"button\" has no way to know what activating it will do.",
    severity: "serious",
    refs: { apg: APG, ...WCAG.nameRoleValue },
    async run(ctx) {
      const name = await ctx.a11y.nameFor("hr-trigger");
      return nameMatches(name, TEXT.dialogTrigger)
        ? pass(`Accessible name is "${name}"`)
        : fail(
            "The dialog trigger does not expose the expected accessible name.",
            `"${TEXT.dialogTrigger}"`,
            name === null ? "no accessible name (element absent from the accessibility tree)" : `"${name}"`,
          );
    },
  },

  {
    id: "dialog.trigger-is-focusable",
    title: "The trigger can be reached with the Tab key",
    rationale:
      "If Tab does not reach the trigger, a keyboard user cannot open the dialog at all.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      await ctx.keyboard.focus("hr-before");
      const [next] = await ctx.keyboard.walk(1);
      if (!next) return fail("Could not determine focus after pressing Tab.");
      return next.testId === "hr-trigger"
        ? pass()
        : fail(
            "Tab from the preceding element did not reach the dialog trigger.",
            'focus on [data-testid="hr-trigger"]',
            describeFocus(next),
          );
    },
  },

  {
    id: "dialog.opens-on-enter",
    title: "Pressing Enter on the focused trigger opens the dialog",
    rationale:
      "Mouse users can open it; if Enter does nothing, keyboard users are locked out of whatever the dialog contains.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.keyboard },
    async run(ctx) {
      await ctx.keyboard.focus("hr-trigger");
      await ctx.keyboard.press("Enter");
      try {
        await ctx.harness.el("hr-dialog").waitFor({ state: "visible", timeout: 2000 });
        return pass();
      } catch {
        return fail(
          "The dialog did not open when Enter was pressed on the focused trigger.",
          "dialog visible",
          "dialog absent or hidden after 2000ms",
        );
      }
    },
  },

  {
    id: "dialog.has-dialog-role",
    title: "The dialog exposes role=dialog or role=alertdialog",
    rationale:
      "The role is what tells assistive technology this is a dialog, enabling its dialog-specific behaviour and announcements.",
    severity: "serious",
    refs: { apg: APG, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openDialog(ctx))) return fail("The dialog did not open, so its role could not be checked.");
      const role = await ctx.a11y.roleFor("hr-dialog");
      return role === "dialog" || role === "alertdialog"
        ? pass(`role="${role}"`)
        : fail(
            "The dialog container does not expose a dialog role.",
            '"dialog" or "alertdialog"',
            role === null ? "not present in the accessibility tree" : `"${role}"`,
          );
    },
  },

  {
    id: "dialog.has-accessible-name",
    title: "The dialog has an accessible name",
    rationale:
      "On opening, a screen reader announces the dialog's name. Without one the user is told only that a dialog opened, with no indication of what it is for.",
    severity: "serious",
    refs: { apg: APG, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openDialog(ctx))) return fail("The dialog did not open, so its name could not be checked.");
      const name = await ctx.a11y.waitForName("hr-dialog", TEXT.dialogTitle);
      return nameMatches(name, TEXT.dialogTitle)
        ? pass(`Accessible name is "${name}"`)
        : fail(
            "The dialog does not take its accessible name from its title.",
            `"${TEXT.dialogTitle}"`,
            name === null ? "no accessible name" : `"${name}"`,
          );
    },
  },

  {
    id: "dialog.focus-moves-in",
    title: "Focus moves into the dialog when it opens",
    rationale:
      "If focus stays behind on the page, a keyboard or screen reader user has no idea the dialog appeared and must hunt for it.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.focusOrder },
    async run(ctx) {
      if (!(await openDialog(ctx))) return fail("The dialog did not open, so focus placement could not be checked.");
      // Libraries commonly move focus in an effect or after an entry animation,
      // so this waits rather than sampling once.
      const landed = await ctx.keyboard.waitForFocusWithin("hr-dialog");
      const focused = await ctx.keyboard.focused();
      return landed
        ? pass(`Focus moved to ${describeFocus(focused)}`)
        : fail(
            "Focus remained outside the dialog after it opened.",
            "focus on the dialog or an element inside it",
            describeFocus(focused),
          );
    },
  },

  {
    id: "dialog.focus-trapped-forward",
    title: "Tab does not move focus out of an open dialog",
    rationale:
      "Content behind a modal is inert to a mouse user. If Tab escapes into it, a keyboard user ends up interacting with things they cannot see.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.focusOrder },
    async run(ctx) {
      if (!(await openDialog(ctx))) return fail("The dialog did not open, so the focus trap could not be checked.");
      // Three focusable elements inside; six presses cycles twice.
      const walk = await ctx.keyboard.walk(6);
      for (const [i, step] of walk.entries()) {
        const inside = step.testId ? await ctx.harness.isWithin(step.testId, "hr-dialog") : false;
        if (!inside && step.testId !== "hr-dialog") {
          return fail(
            `Focus left the dialog after ${i + 1} Tab press${i === 0 ? "" : "es"}.`,
            "focus remains within the dialog",
            describeFocus(step),
          );
        }
      }
      return pass("Focus stayed within the dialog across six Tab presses.");
    },
  },

  {
    id: "dialog.focus-trapped-backward",
    title: "Shift+Tab does not move focus out of an open dialog",
    rationale:
      "Backward traversal is routinely forgotten when forward traversal is handled, and it strands users just as badly.",
    severity: "blocker",
    refs: { apg: APG_KEYBOARD, ...WCAG.focusOrder },
    async run(ctx) {
      if (!(await openDialog(ctx))) return fail("The dialog did not open, so the focus trap could not be checked.");
      const walk = await ctx.keyboard.walk(6, { backwards: true });
      for (const [i, step] of walk.entries()) {
        const inside = step.testId ? await ctx.harness.isWithin(step.testId, "hr-dialog") : false;
        if (!inside && step.testId !== "hr-dialog") {
          return fail(
            `Focus left the dialog after ${i + 1} Shift+Tab press${i === 0 ? "" : "es"}.`,
            "focus remains within the dialog",
            describeFocus(step),
          );
        }
      }
      return pass("Focus stayed within the dialog across six Shift+Tab presses.");
    },
  },

  {
    id: "dialog.escape-closes",
    title: "Escape closes the dialog",
    rationale:
      "Escape is the universally learned way out of a modal. Without it, a user who cannot find the close button is stuck.",
    severity: "serious",
    refs: { apg: APG_KEYBOARD, ...WCAG.noKeyboardTrap },
    async run(ctx) {
      if (!(await openDialog(ctx))) return fail("The dialog did not open, so Escape could not be checked.");
      await ctx.keyboard.press("Escape");
      try {
        await ctx.harness.el("hr-dialog").waitFor({ state: "hidden", timeout: 2000 });
        return pass();
      } catch {
        return fail(
          "The dialog was still visible after pressing Escape.",
          "dialog closed",
          "dialog still visible after 2000ms",
        );
      }
    },
  },

  {
    id: "dialog.focus-restored-on-close",
    title: "Closing the dialog returns focus to the trigger",
    rationale:
      "If focus is dropped to the top of the document on close, the user loses their place and has to tab back through the whole page.",
    severity: "serious",
    refs: { apg: APG_KEYBOARD, ...WCAG.focusOrder },
    async run(ctx) {
      if (!(await openDialog(ctx))) return fail("The dialog did not open, so focus restoration could not be checked.");
      await ctx.harness.click("hr-close");
      await ctx.harness.el("hr-dialog").waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
      // Focus is usually restored after the exit transition completes, which is
      // some way after the element is hidden. Sampling immediately here failed
      // libraries that were behaving correctly.
      const restored = await ctx.keyboard.waitForFocus("hr-trigger");
      const focused = await ctx.keyboard.focused();
      return restored
        ? pass()
        : fail(
            "Focus was not returned to the trigger after the dialog closed.",
            'focus on [data-testid="hr-trigger"]',
            describeFocus(focused),
          );
    },
  },

  {
    id: "dialog.background-inert",
    title: "Content behind the dialog is hidden from assistive technology",
    rationale:
      "A modal is visually exclusive. If the page behind it is still in the accessibility tree, a screen reader user can read and operate content that a sighted user cannot reach.",
    severity: "serious",
    refs: { apg: APG, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openDialog(ctx))) return fail("The dialog did not open, so background inertness could not be checked.");
      const exposed = await ctx.a11y.isExposed("hr-outside-content");
      return exposed
        ? fail(
            "Background content is still exposed to assistive technology while the modal is open.",
            'hr-outside-content hidden from the accessibility tree (aria-hidden, inert, or equivalent)',
            "hr-outside-content still present and not ignored",
          )
        : pass("Background content is hidden from the accessibility tree.");
    },
  },

  {
    id: "dialog.close-has-accessible-name",
    title: "The close control has an accessible name",
    rationale:
      "Close buttons are frequently icon-only. Without a name, the way out of the dialog is announced as an unlabelled button.",
    severity: "moderate",
    refs: { apg: APG, ...WCAG.nameRoleValue },
    async run(ctx) {
      if (!(await openDialog(ctx))) return fail("The dialog did not open, so the close control could not be checked.");
      const name = await ctx.a11y.waitForName("hr-close", TEXT.close);
      return nameMatches(name, TEXT.close)
        ? pass(`Accessible name is "${name}"`)
        : fail(
            "The close control does not expose the expected accessible name.",
            `"${TEXT.close}"`,
            name === null ? "no accessible name" : `"${name}"`,
          );
    },
  },
];

export const dialogSpec: ComponentSpec = {
  id: "dialog",
  title: "Modal dialog",
  version: "1.0.0",
  apgPattern: APG,
  description:
    "A modal dialog interrupts the page: focus moves into it, stays within it, returns on close, and the content behind it becomes inert. These are the behaviours the APG dialog pattern requires and that automated testing can verify.",
  requiredElements: [
    { testId: "hr-before", description: "Focusable button before the trigger", requiredAtLoad: true },
    { testId: "hr-trigger", description: `Control that opens the dialog, labelled "${TEXT.dialogTrigger}"`, requiredAtLoad: true },
    { testId: "hr-outside-content", description: "Focusable button outside the dialog, used for inertness checks", requiredAtLoad: true },
    { testId: "hr-after", description: "Focusable button after the trigger", requiredAtLoad: true },
    { testId: "hr-dialog", description: "The dialog container", requiredAtLoad: false },
    { testId: "hr-title", description: `The dialog title, reading "${TEXT.dialogTitle}"`, requiredAtLoad: false },
    { testId: "hr-field-1", description: "First text input inside the dialog", requiredAtLoad: false },
    { testId: "hr-field-2", description: "Second text input inside the dialog", requiredAtLoad: false },
    { testId: "hr-close", description: `Close button inside the dialog, labelled "${TEXT.close}"`, requiredAtLoad: false },
  ],
  assertions,
};
