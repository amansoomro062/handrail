import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { stampTestIds, TEXT } from "@railing-dev/harness-kit";

/**
 * MUI dialog, mounted with default configuration.
 *
 * MUI's documentation instructs the developer to pass `aria-labelledby` to
 * Dialog themselves, pointing at the DialogTitle's id. That is not done here:
 * writing it would measure our transcription of MUI's documentation rather than
 * what MUI ships. See docs/DECISIONS.md 012.
 */
export function DialogHarness() {
  const [open, setOpen] = useState(false);
  useEffect(() => stampTestIds({ "hr-dialog": '[role="dialog"]' }), []);

  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <Button data-testid="hr-trigger" onClick={() => setOpen(true)}>
        {TEXT.dialogTrigger}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle data-testid="hr-title">{TEXT.dialogTitle}</DialogTitle>
        <DialogContent>
          <input data-testid="hr-field-1" type="text" aria-label="Field one" />
          <input data-testid="hr-field-2" type="text" aria-label="Field two" />
        </DialogContent>
        <DialogActions>
          <Button data-testid="hr-close" onClick={() => setOpen(false)}>
            {TEXT.close}
          </Button>
        </DialogActions>
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
