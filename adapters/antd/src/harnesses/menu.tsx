import { useEffect } from "react";
import { Dropdown } from "antd";
import { stampTestIds, TEXT } from "@railing/harness-kit";

/** Ant Design's menu is Dropdown driven by a `menu` prop. */
export function MenuHarness() {
  useEffect(
    () =>
      stampTestIds({
        "hr-menu": '[role="menu"]',
        "hr-item-1": { selector: '[role="menuitem"]', index: 0 },
        "hr-item-2": { selector: '[role="menuitem"]', index: 1 },
        "hr-item-3": { selector: '[role="menuitem"]', index: 2 },
      }),
    [],
  );

  const items = [
    { key: "cut", label: TEXT.menuItem1 },
    { key: "duplicate", label: TEXT.menuItem2 },
    { key: "paste", label: TEXT.menuItem3 },
  ];

  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <Dropdown menu={{ items }} trigger={["click"]}>
        <button data-testid="hr-trigger" type="button">{TEXT.menuTrigger}</button>
      </Dropdown>

      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
