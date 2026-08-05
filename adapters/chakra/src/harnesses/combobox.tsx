import { Combobox, createListCollection } from "@chakra-ui/react";
import { TEXT } from "@railing-dev/harness-kit";

const collection = createListCollection({
  items: [TEXT.comboboxOption1, TEXT.comboboxOption2, TEXT.comboboxOption3],
});

export function ComboboxHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <Combobox.Root collection={collection}>
        <Combobox.Label>{TEXT.comboboxLabel}</Combobox.Label>
        <Combobox.Control>
          <Combobox.Input data-testid="hr-combobox" />
        </Combobox.Control>
        <Combobox.Positioner>
          <Combobox.Content data-testid="hr-listbox">
            {collection.items.map((item, i) => (
              <Combobox.Item key={item} item={item} data-testid={`hr-option-${i + 1}`}>
                {item}
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox.Root>

      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
