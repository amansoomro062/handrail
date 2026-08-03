import { useEffect } from "react";
import { AutoComplete } from "antd";
import { stampTestIds, TEXT } from "@handrail/harness-kit";

/**
 * Ant Design has no single combobox component. AutoComplete is the closest
 * match to the APG editable-combobox pattern, and is what is measured here.
 */
export function ComboboxHarness() {
  useEffect(
    () =>
      stampTestIds({
        "hr-combobox": 'input[role="combobox"]',
        "hr-listbox": '[role="listbox"]',
        "hr-option-1": { selector: '[role="option"]', index: 0 },
        "hr-option-2": { selector: '[role="option"]', index: 1 },
        "hr-option-3": { selector: '[role="option"]', index: 2 },
      }),
    [],
  );

  const options = [
    { value: TEXT.comboboxOption1 },
    { value: TEXT.comboboxOption2 },
    { value: TEXT.comboboxOption3 },
  ];

  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>
      <AutoComplete options={options} style={{ width: 240 }} aria-label={TEXT.comboboxLabel} />
      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
