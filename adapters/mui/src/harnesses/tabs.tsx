import { useEffect, useState } from "react";
import { Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { stampTestIds, TEXT } from "@handrail/harness-kit";

/**
 * MUI tabs.
 *
 * `@mui/material` exports Tabs and Tab but no tab panel, so the panel comes
 * from `@mui/lab` — which is MUI's own package, though explicitly pre-stable.
 * That is recorded in meta.ts and travels with the result: a reader deciding
 * whether to adopt MUI's tabs should know the panel half is not in the stable
 * package.
 *
 * The alternative was to hand-write the panel from MUI's documented example,
 * which would have measured our transcription rather than MUI's code.
 */
export function TabsHarness() {
  const [value, setValue] = useState("one");
  useEffect(
    () =>
      stampTestIds({
        "hr-tablist": '[role="tablist"]',
        "hr-tab-1": { selector: '[role="tab"]', index: 0 },
        "hr-tab-2": { selector: '[role="tab"]', index: 1 },
        "hr-tab-3": { selector: '[role="tab"]', index: 2 },
        "hr-panel-1": { selector: '[role="tabpanel"]', textIncludes: TEXT.panel1 },
        "hr-panel-2": { selector: '[role="tabpanel"]', textIncludes: TEXT.panel2 },
        "hr-panel-3": { selector: '[role="tabpanel"]', textIncludes: TEXT.panel3 },
      }),
    [],
  );

  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <TabContext value={value}>
        <TabList onChange={(_event, next: string) => setValue(next)}>
          <Tab label={TEXT.tab1} value="one" />
          <Tab label={TEXT.tab2} value="two" />
          <Tab label={TEXT.tab3} value="three" />
        </TabList>
        <TabPanel value="one">{TEXT.panel1}</TabPanel>
        <TabPanel value="two">{TEXT.panel2}</TabPanel>
        <TabPanel value="three">{TEXT.panel3}</TabPanel>
      </TabContext>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
