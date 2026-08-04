import { useEffect, useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { stampTestIds, TEXT } from "@handrail/harness-kit";

/**
 * MUI menu, mounted with default configuration.
 *
 * MUI's documented example has the developer write aria-haspopup, aria-controls
 * and aria-expanded onto the trigger Button by hand. Those are not written
 * here. See the note in meta.ts and docs/DECISIONS.md 013.
 */
export function MenuHarness() {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
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
    <>
      <button data-testid="hr-before" type="button">
        Before
      </button>

      <Button data-testid="hr-trigger" onClick={(event) => setAnchor(event.currentTarget)}>
        {TEXT.menuTrigger}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => setAnchor(null)}>{TEXT.menuItem1}</MenuItem>
        <MenuItem onClick={() => setAnchor(null)}>{TEXT.menuItem2}</MenuItem>
        <MenuItem onClick={() => setAnchor(null)}>{TEXT.menuItem3}</MenuItem>
      </Menu>

      <button data-testid="hr-after" type="button">
        After
      </button>
    </>
  );
}
