import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TEXT } from "@railing/harness-kit";

/** shadcn/ui tabs, as generated. Built on Radix. */
export function TabsHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <Tabs defaultValue="one">
        <TabsList data-testid="hr-tablist">
          <TabsTrigger value="one" data-testid="hr-tab-1">{TEXT.tab1}</TabsTrigger>
          <TabsTrigger value="two" data-testid="hr-tab-2">{TEXT.tab2}</TabsTrigger>
          <TabsTrigger value="three" data-testid="hr-tab-3">{TEXT.tab3}</TabsTrigger>
        </TabsList>
        <TabsContent value="one" data-testid="hr-panel-1">{TEXT.panel1}</TabsContent>
        <TabsContent value="two" data-testid="hr-panel-2">{TEXT.panel2}</TabsContent>
        <TabsContent value="three" data-testid="hr-panel-3">{TEXT.panel3}</TabsContent>
      </Tabs>

      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
