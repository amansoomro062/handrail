import { Tabs } from "@chakra-ui/react";
import { TEXT } from "@handrail/harness-kit";

export function TabsHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <Tabs.Root defaultValue="one">
        <Tabs.List data-testid="hr-tablist">
          <Tabs.Trigger value="one" data-testid="hr-tab-1">{TEXT.tab1}</Tabs.Trigger>
          <Tabs.Trigger value="two" data-testid="hr-tab-2">{TEXT.tab2}</Tabs.Trigger>
          <Tabs.Trigger value="three" data-testid="hr-tab-3">{TEXT.tab3}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one" data-testid="hr-panel-1">{TEXT.panel1}</Tabs.Content>
        <Tabs.Content value="two" data-testid="hr-panel-2">{TEXT.panel2}</Tabs.Content>
        <Tabs.Content value="three" data-testid="hr-panel-3">{TEXT.panel3}</Tabs.Content>
      </Tabs.Root>

      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
