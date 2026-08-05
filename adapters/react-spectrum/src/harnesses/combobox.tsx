import { useEffect } from "react";
import { ComboBox, defaultTheme, Item, Provider } from "@adobe/react-spectrum";
import { stampTestIds, TEXT } from "@railing-dev/harness-kit";

/**
 * Adobe React Spectrum combobox: the calibration control for this pattern.
 *
 * React Spectrum's ComboBox forwards `data-testid` to its wrapper rather than to
 * the `input[role="combobox"]` inside it, and the listbox and options are
 * portalled in only when the popup opens. So the harness ids are stamped onto
 * the real semantic elements by structural selector, see the note on
 * `stampTestIds`. That places markers and nothing else: no ARIA, no handlers,
 * no focus management.
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

  return (
    <Provider theme={defaultTheme}>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <ComboBox label={TEXT.comboboxLabel}>
        <Item key="apple">{TEXT.comboboxOption1}</Item>
        <Item key="banana">{TEXT.comboboxOption2}</Item>
        <Item key="cherry">{TEXT.comboboxOption3}</Item>
      </ComboBox>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </Provider>
  );
}
