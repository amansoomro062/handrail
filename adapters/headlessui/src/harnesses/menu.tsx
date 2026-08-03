import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { TEXT } from "@handrail/harness-kit";

/** Headless UI menu. It is headless by design, so the elements are ours. */
export function MenuHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <Menu>
        <MenuButton data-testid="hr-trigger">{TEXT.menuTrigger}</MenuButton>
        <MenuItems data-testid="hr-menu">
          <MenuItem>
            <button data-testid="hr-item-1" type="button">
              {TEXT.menuItem1}
            </button>
          </MenuItem>
          <MenuItem>
            <button data-testid="hr-item-2" type="button">
              {TEXT.menuItem2}
            </button>
          </MenuItem>
          <MenuItem>
            <button data-testid="hr-item-3" type="button">
              {TEXT.menuItem3}
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
