import { useEffect } from "react";
import {
  Accordion,
  defaultTheme,
  Disclosure,
  DisclosurePanel,
  DisclosureTitle,
  Provider,
} from "@adobe/react-spectrum";
import { stampTestIds, TEXT } from "@handrail/harness-kit";

/**
 * Adobe React Spectrum accordion — calibration control for this pattern.
 *
 * Spectrum's DisclosureTitle renders the heading and the button itself, so the
 * harness ids are stamped onto the buttons by index and onto the panels by
 * content. Markers only, as always.
 */
export function AccordionHarness() {
  useEffect(
    () =>
      stampTestIds({
        "hr-header-1": { selector: "button[aria-expanded]", index: 0 },
        "hr-header-2": { selector: "button[aria-expanded]", index: 1 },
        "hr-header-3": { selector: "button[aria-expanded]", index: 2 },
        // Spectrum exposes disclosure panels as role=group. The APG lists
        // role=region for accordion panels as optional, so this is a legitimate
        // choice and not a defect — it was our selector that was wrong.
        "hr-panel-1": { selector: "[role=group]", textIncludes: TEXT.accordionPanel1 },
        "hr-panel-2": { selector: "[role=group]", textIncludes: TEXT.accordionPanel2 },
        "hr-panel-3": { selector: "[role=group]", textIncludes: TEXT.accordionPanel3 },
      }),
    [],
  );

  return (
    <Provider theme={defaultTheme}>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <Accordion>
        <Disclosure id="shipping">
          <DisclosureTitle>{TEXT.accordionHeader1}</DisclosureTitle>
          <DisclosurePanel>{TEXT.accordionPanel1}</DisclosurePanel>
        </Disclosure>
        <Disclosure id="payment">
          <DisclosureTitle>{TEXT.accordionHeader2}</DisclosureTitle>
          <DisclosurePanel>{TEXT.accordionPanel2}</DisclosurePanel>
        </Disclosure>
        <Disclosure id="review">
          <DisclosureTitle>{TEXT.accordionHeader3}</DisclosureTitle>
          <DisclosurePanel>{TEXT.accordionPanel3}</DisclosurePanel>
        </Disclosure>
      </Accordion>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </Provider>
  );
}
