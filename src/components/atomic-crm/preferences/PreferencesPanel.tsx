import { Palette } from "lucide-react";
import { useTranslate } from "ra-core";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { usePreferences } from "./PreferencesProvider";
import {
  FONT_OPTIONS,
  THEME_OPTIONS,
  type ContentLayout,
  type FontPreset,
  type NavbarStyle,
  type SidebarCollapsible,
  type SidebarVariant,
  type ThemePreset,
} from "./preferencesConfig";

const PreferenceLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs font-semibold text-foreground">{children}</div>
);

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="grid rounded-lg border bg-background p-0.5"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "h-7 rounded-md px-2 text-xs font-semibold transition-colors",
            value === option.value
              ? "bg-accent text-accent-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const PreferencesPanel = () => {
  const translate = useTranslate();
  const prefs = usePreferences();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold leading-none">
          {translate("crm.preferences.title", { _: "Preferences" })}
        </h4>
        <p className="text-xs text-muted-foreground">
          {translate("crm.preferences.subtitle", {
            _: "Customize your dashboard layout preferences.",
          })}
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <PreferenceLabel>
            {translate("crm.preferences.theme_preset", {
              _: "Theme Preset",
            })}
          </PreferenceLabel>
          <Select
            value={prefs.themePreset}
            onValueChange={(value) =>
              prefs.setPreference("themePreset", value as ThemePreset)
            }
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {THEME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span
                    className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: option.swatch }}
                  />
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <PreferenceLabel>
            {translate("crm.preferences.fonts", { _: "Fonts" })}
          </PreferenceLabel>
          <Select
            value={prefs.font}
            onValueChange={(value) =>
              prefs.setPreference("font", value as FontPreset)
            }
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {FONT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <PreferenceLabel>
            {translate("crm.preferences.page_layout", { _: "Page Layout" })}
          </PreferenceLabel>
          <SegmentedControl<ContentLayout>
            value={prefs.contentLayout}
            options={[
              {
                value: "centered",
                label: translate("crm.preferences.centered", {
                  _: "Centered",
                }),
              },
              {
                value: "full-width",
                label: translate("crm.preferences.full_width", {
                  _: "Full Width",
                }),
              },
            ]}
            onChange={(value) => prefs.setPreference("contentLayout", value)}
          />
        </div>

        <div className="space-y-1.5">
          <PreferenceLabel>
            {translate("crm.preferences.navbar_behavior", {
              _: "Navbar Behavior",
            })}
          </PreferenceLabel>
          <SegmentedControl<NavbarStyle>
            value={prefs.navbarStyle}
            options={[
              {
                value: "sticky",
                label: translate("crm.preferences.sticky", { _: "Sticky" }),
              },
              {
                value: "scroll",
                label: translate("crm.preferences.scroll", { _: "Scroll" }),
              },
            ]}
            onChange={(value) => prefs.setPreference("navbarStyle", value)}
          />
        </div>

        <div className="space-y-1.5">
          <PreferenceLabel>
            {translate("crm.preferences.sidebar_style", {
              _: "Sidebar Style",
            })}
          </PreferenceLabel>
          <SegmentedControl<SidebarVariant>
            value={prefs.sidebarVariant}
            options={[
              {
                value: "inset",
                label: translate("crm.preferences.inset", { _: "Inset" }),
              },
              {
                value: "sidebar",
                label: translate("crm.preferences.sidebar", {
                  _: "Sidebar",
                }),
              },
              {
                value: "floating",
                label: translate("crm.preferences.floating", {
                  _: "Floating",
                }),
              },
            ]}
            onChange={(value) => prefs.setPreference("sidebarVariant", value)}
          />
        </div>

        <div className="space-y-1.5">
          <PreferenceLabel>
            {translate("crm.preferences.sidebar_collapse_mode", {
              _: "Sidebar Collapse Mode",
            })}
          </PreferenceLabel>
          <SegmentedControl<SidebarCollapsible>
            value={prefs.sidebarCollapsible}
            options={[
              {
                value: "icon",
                label: translate("crm.preferences.icon", { _: "Icon" }),
              },
              {
                value: "offcanvas",
                label: translate("crm.preferences.offcanvas", {
                  _: "OffCanvas",
                }),
              },
            ]}
            onChange={(value) =>
              prefs.setPreference("sidebarCollapsible", value)
            }
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={prefs.restoreDefaults}
        >
          <Palette className="h-3.5 w-3.5" />
          {translate("crm.preferences.restore_defaults", {
            _: "Restore Defaults",
          })}
        </Button>
      </div>
    </div>
  );
};
