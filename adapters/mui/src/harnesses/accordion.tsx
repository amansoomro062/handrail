import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { TEXT } from "@railing/harness-kit";

/**
 * MUI accordion, mounted with default configuration and all sections collapsed.
 *
 * MUI forwards props to the root element of each part, so no stamping is needed:
 * AccordionSummary's root is the control itself and AccordionDetails' root is
 * the panel.
 */
export function AccordionHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <Accordion>
        <AccordionSummary data-testid="hr-header-1">{TEXT.accordionHeader1}</AccordionSummary>
        <AccordionDetails data-testid="hr-panel-1">{TEXT.accordionPanel1}</AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary data-testid="hr-header-2">{TEXT.accordionHeader2}</AccordionSummary>
        <AccordionDetails data-testid="hr-panel-2">{TEXT.accordionPanel2}</AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary data-testid="hr-header-3">{TEXT.accordionHeader3}</AccordionSummary>
        <AccordionDetails data-testid="hr-panel-3">{TEXT.accordionPanel3}</AccordionDetails>
      </Accordion>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
