import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TEXT } from "@railing/harness-kit";

/** shadcn/ui accordion, as generated. Built on Radix. `collapsible` so an open
 *  section can close again, matching how the other adapters are configured. */
export function AccordionHarness() {
  const sections = [
    { value: "shipping", header: TEXT.accordionHeader1, panel: TEXT.accordionPanel1 },
    { value: "payment", header: TEXT.accordionHeader2, panel: TEXT.accordionPanel2 },
    { value: "review", header: TEXT.accordionHeader3, panel: TEXT.accordionPanel3 },
  ];
  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <Accordion type="single" collapsible>
        {sections.map((s, i) => (
          <AccordionItem key={s.value} value={s.value}>
            <AccordionTrigger data-testid={`hr-header-${i + 1}`}>{s.header}</AccordionTrigger>
            <AccordionContent data-testid={`hr-panel-${i + 1}`}>{s.panel}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
