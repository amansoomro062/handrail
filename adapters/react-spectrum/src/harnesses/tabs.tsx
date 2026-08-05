import { useEffect } from "react";
import { defaultTheme, Item, Provider, TabList, TabPanels, Tabs } from "@adobe/react-spectrum";
import { stampTestIds, TEXT } from "@railing-dev/harness-kit";

/**
 * Adobe React Spectrum tabs: calibration control for this pattern.
 *
 * Spectrum renders only the selected panel, so `hr-panel-2` and `hr-panel-3`
 * will not exist until their tab is chosen. The protocol allows that: the spec
 * marks unselected panels as not required at load, and treats absence from the
 * DOM as a perfectly good way of being hidden from assistive technology.
 *
 * The single stamped panel id therefore tracks whichever panel is currently
 * rendered, which is why it is indexed rather than matched per panel.
 */
export function TabsHarness() {
  useEffect(
    () =>
      stampTestIds({
        "hr-tablist": '[role="tablist"]',
        "hr-tab-1": { selector: '[role="tab"]', index: 0 },
        "hr-tab-2": { selector: '[role="tab"]', index: 1 },
        "hr-tab-3": { selector: '[role="tab"]', index: 2 },
        // Matched by content, not index: only one panel is ever rendered, and
        // Spectrum reuses the same node for whichever one that is.
        "hr-panel-1": { selector: '[role="tabpanel"]', textIncludes: TEXT.panel1 },
        "hr-panel-2": { selector: '[role="tabpanel"]', textIncludes: TEXT.panel2 },
        "hr-panel-3": { selector: '[role="tabpanel"]', textIncludes: TEXT.panel3 },
      }),
    [],
  );

  return (
    <Provider theme={defaultTheme}>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <Tabs>
        <TabList>
          <Item key="one">{TEXT.tab1}</Item>
          <Item key="two">{TEXT.tab2}</Item>
          <Item key="three">{TEXT.tab3}</Item>
        </TabList>
        <TabPanels>
          <Item key="one">{TEXT.panel1}</Item>
          <Item key="two">{TEXT.panel2}</Item>
          <Item key="three">{TEXT.panel3}</Item>
        </TabPanels>
      </Tabs>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </Provider>
  );
}
