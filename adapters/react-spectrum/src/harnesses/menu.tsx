import { useEffect } from "react";
import { ActionButton, defaultTheme, Item, Menu, MenuTrigger, Provider } from "@adobe/react-spectrum";
import { stampTestIds, TEXT } from "@railing/harness-kit";

/**
 * Adobe React Spectrum menu button: calibration control for this pattern.
 *
 * The menu and its items are portalled in only when opened, and Spectrum does
 * not forward attributes to the elements carrying the roles, so ids are stamped
 * by structural selector. Markers only, no ARIA, no handlers.
 */
export function MenuHarness() {
  useEffect(
    () =>
      stampTestIds({
        "hr-menu": '[role="menu"]',
        "hr-item-1": { selector: '[role="menuitem"]', index: 0 },
        "hr-item-2": { selector: '[role="menuitem"]', index: 1 },
        "hr-item-3": { selector: '[role="menuitem"]', index: 2 },
      }),
    [],
  );

  return (
    <Provider theme={defaultTheme}>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <MenuTrigger>
        <ActionButton data-testid="hr-trigger">{TEXT.menuTrigger}</ActionButton>
        <Menu>
          <Item key="cut">{TEXT.menuItem1}</Item>
          <Item key="duplicate">{TEXT.menuItem2}</Item>
          <Item key="paste">{TEXT.menuItem3}</Item>
        </Menu>
      </MenuTrigger>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </Provider>
  );
}
