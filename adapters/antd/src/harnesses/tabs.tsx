import { useEffect } from "react";
import { Tabs } from "antd";
import { stampTestIds, TEXT } from "@railing/harness-kit";

export function TabsHarness() {
  useEffect(
    () =>
      stampTestIds({
        "hr-tablist": '[role="tablist"]',
        "hr-tab-1": { selector: '[role="tab"]', index: 0 },
        "hr-tab-2": { selector: '[role="tab"]', index: 1 },
        "hr-tab-3": { selector: '[role="tab"]', index: 2 },
        "hr-panel-1": { selector: '[role="tabpanel"]', textIncludes: TEXT.panel1 },
        "hr-panel-2": { selector: '[role="tabpanel"]', textIncludes: TEXT.panel2 },
        "hr-panel-3": { selector: '[role="tabpanel"]', textIncludes: TEXT.panel3 },
      }),
    [],
  );

  const items = [
    { key: "one", label: TEXT.tab1, children: TEXT.panel1 },
    { key: "two", label: TEXT.tab2, children: TEXT.panel2 },
    { key: "three", label: TEXT.tab3, children: TEXT.panel3 },
  ];

  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>
      <Tabs defaultActiveKey="one" items={items} />
      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
