import { useEffect } from "react";
import { Collapse } from "antd";
import { stampTestIds, TEXT } from "@handrail/harness-kit";

/** Ant Design's accordion is Collapse. All panels start collapsed. */
export function AccordionHarness() {
  useEffect(
    () =>
      stampTestIds({
        "hr-header-1": { selector: '[role="button"][aria-expanded]', index: 0 },
        "hr-header-2": { selector: '[role="button"][aria-expanded]', index: 1 },
        "hr-header-3": { selector: '[role="button"][aria-expanded]', index: 2 },
        "hr-panel-1": { selector: ".ant-collapse-panel", textIncludes: TEXT.accordionPanel1 },
        "hr-panel-2": { selector: ".ant-collapse-panel", textIncludes: TEXT.accordionPanel2 },
        "hr-panel-3": { selector: ".ant-collapse-panel", textIncludes: TEXT.accordionPanel3 },
      }),
    [],
  );

  const items = [
    { key: "shipping", label: TEXT.accordionHeader1, children: TEXT.accordionPanel1 },
    { key: "payment", label: TEXT.accordionHeader2, children: TEXT.accordionPanel2 },
    { key: "review", label: TEXT.accordionHeader3, children: TEXT.accordionPanel3 },
  ];

  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>
      <Collapse items={items} />
      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
