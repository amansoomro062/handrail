import { useState } from "react";
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Field, Label } from "@headlessui/react";
import { TEXT } from "@handrail/harness-kit";

const OPTIONS = [TEXT.comboboxOption1, TEXT.comboboxOption2, TEXT.comboboxOption3];

/** Headless UI combobox. Label comes from the library's own Field/Label pair. */
export function ComboboxHarness() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <Field>
        <Label>{TEXT.comboboxLabel}</Label>
        <Combobox value={value} onChange={setValue}>
          <ComboboxInput data-testid="hr-combobox" />
          <ComboboxOptions data-testid="hr-listbox" static={false}>
            {OPTIONS.map((option, index) => (
              <ComboboxOption key={option} value={option} data-testid={`hr-option-${index + 1}`}>
                {option}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </Combobox>
      </Field>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
