import { Palette } from "lucide-react";
import { useUserMenu, useTranslate } from "ra-core";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { PreferencesPanel } from "./PreferencesPanel";

/** The "Preference" item inside <UserMenu> — just the trigger. Radix
 * unmounts DropdownMenuContent's whole subtree when the menu closes, so
 * the actual Dialog can't live in here (it'd unmount, with its open
 * state, the instant the menu closes) — see <PreferencesDialog>, which
 * must be rendered as a sibling of <UserMenu>, not inside it. */
export const PreferencesMenuItem = ({ onOpen }: { onOpen: () => void }) => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<PreferencesMenuItem> must be used inside <UserMenu>");
  }

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        userMenuContext.onClose();
        onOpen();
      }}
      className="flex items-center gap-2"
    >
      <Palette />
      {translate("crm.preferences.title", { _: "Preferences" })}
    </DropdownMenuItem>
  );
};

/** The actual dialog — render this as a sibling of <UserMenu>, not as
 * one of its children. */
export const PreferencesDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const translate = useTranslate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[300px]">
        <DialogTitle className="sr-only">
          {translate("crm.preferences.title", { _: "Preferences" })}
        </DialogTitle>
        <PreferencesPanel />
      </DialogContent>
    </Dialog>
  );
};
