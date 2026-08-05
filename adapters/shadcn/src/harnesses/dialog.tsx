import { useEffect } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { stampTestIds, TEXT } from "@railing-dev/harness-kit";

/** shadcn/ui dialog, exactly as the CLI generated it. Built on Radix. */
export function DialogHarness() {
  useEffect(() => stampTestIds({ "hr-dialog": '[role="dialog"]' }), []);
  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <Dialog>
        <DialogTrigger data-testid="hr-trigger">{TEXT.dialogTrigger}</DialogTrigger>
        <DialogContent>
          <DialogTitle data-testid="hr-title">{TEXT.dialogTitle}</DialogTitle>
          <input data-testid="hr-field-1" type="text" aria-label="Field one" />
          <input data-testid="hr-field-2" type="text" aria-label="Field two" />
          <DialogClose data-testid="hr-close">{TEXT.close}</DialogClose>
        </DialogContent>
      </Dialog>

      <button data-testid="hr-outside-content" type="button">{TEXT.outsideContent}</button>
      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
