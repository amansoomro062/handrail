import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { TEXT } from "@railing/harness-kit";

/**
 * Radix UI dropdown menu, mounted exactly as the Radix documentation describes.
 *
 * Radix forwards props to the underlying elements, so the test ids go on
 * directly and no stamping is needed. Nothing here manages focus, adds ARIA, or
 * handles keys.
 */
export function MenuHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger data-testid="hr-trigger">{TEXT.menuTrigger}</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content data-testid="hr-menu">
            <DropdownMenu.Item data-testid="hr-item-1">{TEXT.menuItem1}</DropdownMenu.Item>
            <DropdownMenu.Item data-testid="hr-item-2">{TEXT.menuItem2}</DropdownMenu.Item>
            <DropdownMenu.Item data-testid="hr-item-3">{TEXT.menuItem3}</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
