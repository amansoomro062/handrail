import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { TEXT } from "@handrail/harness-kit";

/** Headless UI tabs. */
export function TabsHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <TabGroup>
        <TabList data-testid="hr-tablist">
          <Tab data-testid="hr-tab-1">{TEXT.tab1}</Tab>
          <Tab data-testid="hr-tab-2">{TEXT.tab2}</Tab>
          <Tab data-testid="hr-tab-3">{TEXT.tab3}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel data-testid="hr-panel-1">{TEXT.panel1}</TabPanel>
          <TabPanel data-testid="hr-panel-2">{TEXT.panel2}</TabPanel>
          <TabPanel data-testid="hr-panel-3">{TEXT.panel3}</TabPanel>
        </TabPanels>
      </TabGroup>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
