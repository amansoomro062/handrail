import * as Accordion from "@radix-ui/react-accordion";
import { TEXT } from "@handrail/harness-kit";

/**
 * Radix UI accordion, mounted exactly as the Radix documentation describes.
 *
 * `type="single"` with `collapsible` so an expanded section can be closed again
 *  The default without it refuses to collapse the open section,
 * which is a configuration choice rather than the library's natural behaviour.
 * All sections start collapsed, per the protocol.
 *
 * Radix requires the Header/Trigger split, so the heading element comes from
 * Accordion.Header and the button from Accordion.Trigger.
 */
export function AccordionHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <Accordion.Root type="single" collapsible>
        <Accordion.Item value="shipping">
          <Accordion.Header>
            <Accordion.Trigger data-testid="hr-header-1">{TEXT.accordionHeader1}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content data-testid="hr-panel-1">{TEXT.accordionPanel1}</Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="payment">
          <Accordion.Header>
            <Accordion.Trigger data-testid="hr-header-2">{TEXT.accordionHeader2}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content data-testid="hr-panel-2">{TEXT.accordionPanel2}</Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="review">
          <Accordion.Header>
            <Accordion.Trigger data-testid="hr-header-3">{TEXT.accordionHeader3}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content data-testid="hr-panel-3">{TEXT.accordionPanel3}</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
