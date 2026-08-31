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
          // Radix's DropdownMenu returns focus to its trigger as it
          // closes; opening the Dialog in the same tick makes that focus
          // shift look like an outside-interaction to the Dialog's
          // DismissableLayer, closing it right back. Deferring one tick
          // lets the dropdown finish closing first.
          setTimeout(() => setOpen(true), 0);
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
