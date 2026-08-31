import { Palette } from "lucide-react";
import { useUserMenu, useTranslate } from "ra-core";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { PreferencesPanel } from "./PreferencesPanel";

/** Opens the layout/appearance Preferences panel — the "Preference" item
 * in the user menu, one click away from the account icon (mirrors the
 * Skilluence reference app's profile-dropdown entry point). */
export const PreferencesMenuItem = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  const [open, setOpen] = useState(false);
  if (!userMenuContext) {
    throw new Error("<PreferencesMenuItem> must be used inside <UserMenu>");
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          userMenuContext.onClose();
          setOpen(true);
        }}
        className="flex items-center gap-2"
      >
        <Palette />
        {translate("crm.preferences.title", { _: "Preferences" })}
      </DropdownMenuItem>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogTitle className="sr-only">
            {translate("crm.preferences.title", { _: "Preferences" })}
          </DialogTitle>
          <PreferencesPanel />
        </DialogContent>
      </Dialog>
    </>
  );
};
