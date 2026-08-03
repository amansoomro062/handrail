import { useEffect, useState } from "react";
import { Button, Modal } from "antd";
import { stampTestIds, TEXT } from "@handrail/harness-kit";

/** Ant Design's dialog is Modal. Default configuration, no hand-written ARIA. */
export function DialogHarness() {
  const [open, setOpen] = useState(false);
  useEffect(() => stampTestIds({ "hr-dialog": '[role="dialog"]' }), []);

  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>
      <Button data-testid="hr-trigger" onClick={() => setOpen(true)}>{TEXT.dialogTrigger}</Button>

      <Modal open={open} onCancel={() => setOpen(false)} title={TEXT.dialogTitle} footer={null}>
        <span data-testid="hr-title">{TEXT.dialogTitle}</span>
        <input data-testid="hr-field-1" type="text" aria-label="Field one" />
        <input data-testid="hr-field-2" type="text" aria-label="Field two" />
        <Button data-testid="hr-close" onClick={() => setOpen(false)}>{TEXT.close}</Button>
      </Modal>

      <button data-testid="hr-outside-content" type="button">{TEXT.outsideContent}</button>
      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
