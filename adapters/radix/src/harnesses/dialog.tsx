import * as Dialog from "@radix-ui/react-dialog";
import { TEXT } from "@handrail/harness-kit";

/**
 * Radix UI modal dialog, mounted exactly as the Radix documentation describes.
 *
 * Nothing here manages focus, adds ARIA attributes, or handles keys. That is the
 * entire point — we are measuring what the library does unaided. If you find
 * yourself adding an onKeyDown to make an assertion pass, you have found a
 * defect and are in the process of hiding it.
 *
 * The aria-labels on the two text inputs are the one exception, and they are
 * fine: those inputs are harness furniture, not library components, and the
 * spec makes no assertion about them. They exist only to give the focus trap
 * something to traverse.
 */
export function DialogHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <Dialog.Root>
        <Dialog.Trigger data-testid="hr-trigger">{TEXT.dialogTrigger}</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content data-testid="hr-dialog">
            <Dialog.Title data-testid="hr-title">{TEXT.dialogTitle}</Dialog.Title>
            <Dialog.Description>
              A fixed harness for automated accessibility conformance testing.
            </Dialog.Description>
            <input data-testid="hr-field-1" type="text" aria-label="Field one" />
            <input data-testid="hr-field-2" type="text" aria-label="Field two" />
            <Dialog.Close data-testid="hr-close">{TEXT.close}</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <button data-testid="hr-outside-content" type="button">
        {TEXT.outsideContent}
      </button>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
