import { Menu } from "@chakra-ui/react";
import { TEXT } from "@railing/harness-kit";

export function MenuHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <Menu.Root>
        <Menu.Trigger data-testid="hr-trigger">{TEXT.menuTrigger}</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content data-testid="hr-menu">
            <Menu.Item value="cut" data-testid="hr-item-1">{TEXT.menuItem1}</Menu.Item>
            <Menu.Item value="duplicate" data-testid="hr-item-2">{TEXT.menuItem2}</Menu.Item>
            <Menu.Item value="paste" data-testid="hr-item-3">{TEXT.menuItem3}</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>

      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
