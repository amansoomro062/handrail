import { useEffect } from "react";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { stampTestIds, TEXT } from "@railing-dev/harness-kit";

const OPTIONS = [TEXT.comboboxOption1, TEXT.comboboxOption2, TEXT.comboboxOption3];

/**
 * shadcn/ui combobox, as generated. Unlike the other four this one is built on
 * Base UI rather than Radix, which is worth knowing: a shadcn project is not a
 * single upstream's behaviour.
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
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <Combobox items={OPTIONS}>
        <ComboboxInput aria-label={TEXT.comboboxLabel} />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
