import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { TEXT } from "@handrail/harness-kit";

/**
 * Headless UI accordion, built from three Disclosures.
 *
 * Headless UI ships no accordion component — Disclosure is a single collapsible
 * section, and stacking them is the documented way to build one. That is
 * recorded here because it bears on the heading requirement: the library gives
 * you a button and a panel, and nothing that would wrap them in a heading.
 */
export function AccordionHarness() {
  const sections = [
    { header: TEXT.accordionHeader1, panel: TEXT.accordionPanel1 },
    { header: TEXT.accordionHeader2, panel: TEXT.accordionPanel2 },
    { header: TEXT.accordionHeader3, panel: TEXT.accordionPanel3 },
  ];

  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      {sections.map((section, index) => (
        <Disclosure key={section.header}>
          <DisclosureButton data-testid={`hr-header-${index + 1}`}>{section.header}</DisclosureButton>
          <DisclosurePanel data-testid={`hr-panel-${index + 1}`}>{section.panel}</DisclosurePanel>
        </Disclosure>
      ))}

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
