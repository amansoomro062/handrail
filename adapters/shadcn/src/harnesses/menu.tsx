import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TEXT } from "@handrail/harness-kit";

/** shadcn/ui dropdown menu, as generated. Built on Radix. */
export function MenuHarness() {
  return (
    <>
      <button data-testid="hr-before" type="button">Before</button>

      <DropdownMenu>
        <DropdownMenuTrigger data-testid="hr-trigger">{TEXT.menuTrigger}</DropdownMenuTrigger>
        <DropdownMenuContent data-testid="hr-menu">
          <DropdownMenuItem data-testid="hr-item-1">{TEXT.menuItem1}</DropdownMenuItem>
          <DropdownMenuItem data-testid="hr-item-2">{TEXT.menuItem2}</DropdownMenuItem>
          <DropdownMenuItem data-testid="hr-item-3">{TEXT.menuItem3}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button data-testid="hr-after" type="button">After</button>
    </>
  );
}
