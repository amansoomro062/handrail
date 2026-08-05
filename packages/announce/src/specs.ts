/**
 * Announcement specifications.
 *
 * Deliberately few and coarse. Each check asserts that the words a screen
 * reader user needs actually got spoken: the control's name, its role, the
 * state change. Nothing here asserts exact phrasing, which belongs to the
 * screen reader, not the library.
 *
 * v1 covers the dialog. The other components follow once this instrument has
 * survived contact with a second machine.
 */

import { TEXT } from "@railing-dev/spec";
import type { AnnounceSpec } from "./types.js";

export const dialogAnnounceSpec: AnnounceSpec = {
  component: "dialog",
  version: "1.0.0",
  steps: [
    {
      press: "Tab",
      upTo: 6,
      checks: [
        {
          id: "announce.dialog.trigger-named",
          title: "The trigger announces its name and that it is a button",
          rationale:
            "A screen reader user finds the trigger by what it says, not by where it is. " +
            "If the name or the role is missing from the announcement, the control is a mystery box.",
          mustHear: [TEXT.dialogTrigger, "button"],
        },
      ],
    },
    {
      press: "Enter",
      waitMs: 1500,
      checks: [
        {
          id: "announce.dialog.open-heard",
          title: "Opening the dialog is announced with its name",
          rationale:
            "A sighted user sees the dialog appear. If the announcement does not carry the " +
            "dialog's name, a screen reader user pressed a button and heard nothing they can act on.",
          mustHear: [TEXT.dialogTitle],
        },
      ],
    },
    {
      press: "Escape",
      waitMs: 1500,
      checks: [
        {
          id: "announce.dialog.close-returns",
          title: "Closing returns the user to the trigger, audibly",
          rationale:
            "Escape closes the dialog and focus is supposed to return to the trigger. The user " +
            "only knows that happened if the trigger is announced again.",
          mustHear: [TEXT.dialogTrigger],
        },
      ],
    },
  ],
};

export const announceSpecs: Record<string, AnnounceSpec> = {
  dialog: dialogAnnounceSpec,
};
