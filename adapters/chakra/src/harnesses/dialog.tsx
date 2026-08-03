import { Dialog } from "@chakra-ui/react";
import { TEXT } from "@handrail/harness-kit";

export function DialogHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <Dialog.Root>
        <Dialog.Trigger data-testid="hr-trigger">{TEXT.dialogTrigger}</Dialog.Trigger>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content data-testid="hr-dialog">
            <Dialog.Title data-testid="hr-title">{TEXT.dialogTitle}</Dialog.Title>
            <input data-testid="hr-field-1" type="text" aria-label="Field one" />
            <input data-testid="hr-field-2" type="text" aria-label="Field two" />
            <Dialog.CloseTrigger data-testid="hr-close">{TEXT.close}</Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <button data-testid="hr-outside-content" type="button">{TEXT.outsideContent}</button>
      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
