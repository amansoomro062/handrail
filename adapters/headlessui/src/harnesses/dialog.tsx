import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { stampTestIds, TEXT } from "@railing-dev/harness-kit";

/** Headless UI dialog, mounted as its documentation describes. */
export function DialogHarness() {
  const [open, setOpen] = useState(false);
  // Headless UI puts role=dialog on the Dialog root, not on DialogPanel.
  // Tagging the panel measured the wrong element entirely.
  useEffect(() => stampTestIds({ "hr-dialog": '[role="dialog"]' }), []);
  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>
      <button data-testid="hr-trigger" type="button" onClick={() => setOpen(true)}>
        {TEXT.dialogTrigger}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogPanel>
          <DialogTitle data-testid="hr-title">{TEXT.dialogTitle}</DialogTitle>
          <input data-testid="hr-field-1" type="text" aria-label="Field one" />
          <input data-testid="hr-field-2" type="text" aria-label="Field two" />
          <button data-testid="hr-close" type="button" onClick={() => setOpen(false)}>
            {TEXT.close}
          </button>
        </DialogPanel>
      </Dialog>

      <button data-testid="hr-outside-content" type="button">
        {TEXT.outsideContent}
      </button>
      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
