export type ThemePreset =
  | "default"
  | "skilluence"
  | "ocean"
  | "emerald"
  | "tangerine"
  | "rose"
  | "soft-pop"
  | "brutalist";
export type FontPreset =
  | "inter"
  | "system"
  | "geist"
  | "public-sans"
  | "mono"
  | "serif";
export type ContentLayout = "centered" | "full-width";
export type NavbarStyle = "sticky" | "scroll";
export type SidebarVariant = "sidebar" | "floating" | "inset";
export type SidebarCollapsible = "icon" | "offcanvas";

export const THEME_OPTIONS: {
  value: ThemePreset;
  label: string;
  swatch: string;
}[] = [
  { value: "default", label: "Default", swatch: "hsl(0 0% 13%)" },
  { value: "skilluence", label: "Skilluence", swatch: "hsl(210 50% 52%)" },
  { value: "ocean", label: "Ocean", swatch: "hsl(199 89% 38%)" },
  { value: "emerald", label: "Emerald", swatch: "hsl(158 64% 33%)" },
  { value: "tangerine", label: "Tangerine", swatch: "hsl(20 88% 48%)" },
  { value: "rose", label: "Rose", swatch: "hsl(338 76% 45%)" },
  { value: "soft-pop", label: "Soft Pop", swatch: "hsl(263 80% 55%)" },
  { value: "brutalist", label: "Brutalist", swatch: "hsl(14 92% 54%)" },
];

export const FONT_OPTIONS: { value: FontPreset; label: string }[] = [
  { value: "inter", label: "Inter" },
  { value: "system", label: "System" },
  { value: "geist", label: "Geist-like" },
  { value: "public-sans", label: "Public Sans-like" },
  { value: "mono", label: "Mono" },
  { value: "serif", label: "Serif" },
];

export const DEFAULT_PREFERENCES = {
  themePreset: "default" as ThemePreset,
  font: "inter" as FontPreset,
  contentLayout: "centered" as ContentLayout,
  navbarStyle: "sticky" as NavbarStyle,
  sidebarVariant: "sidebar" as SidebarVariant,
  sidebarCollapsible: "icon" as SidebarCollapsible,
};

export type Preferences = typeof DEFAULT_PREFERENCES;
