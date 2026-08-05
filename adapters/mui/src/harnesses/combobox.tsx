import { useEffect } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { stampTestIds, TEXT } from "@railing-dev/harness-kit";

/** MUI Autocomplete, its combobox implementation. Default configuration. */
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
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <Autocomplete
        options={[TEXT.comboboxOption1, TEXT.comboboxOption2, TEXT.comboboxOption3]}
        sx={{ width: 300 }}
        renderInput={(params) => <TextField {...params} label={TEXT.comboboxLabel} />}
      />

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
