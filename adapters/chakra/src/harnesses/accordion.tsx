import { Accordion } from "@chakra-ui/react";
import { TEXT } from "@handrail/harness-kit";

/** `collapsible` so an open section can be closed again, otherwise the first
 *  expansion is permanent, which is a configuration choice rather than the
 *  library's natural behaviour. */
export function AccordionHarness() {
  const sections = [
    { value: "shipping", header: TEXT.accordionHeader1, panel: TEXT.accordionPanel1 },
    { value: "payment", header: TEXT.accordionHeader2, panel: TEXT.accordionPanel2 },
    { value: "review", header: TEXT.accordionHeader3, panel: TEXT.accordionPanel3 },
  ];
  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <Accordion.Root collapsible>
        {sections.map((s, i) => (
          <Accordion.Item key={s.value} value={s.value}>
            <Accordion.ItemTrigger data-testid={`hr-header-${i + 1}`}>{s.header}</Accordion.ItemTrigger>
            <Accordion.ItemContent data-testid={`hr-panel-${i + 1}`}>{s.panel}</Accordion.ItemContent>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
