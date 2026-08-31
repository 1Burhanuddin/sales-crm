import { createContext, useContext, useEffect, useMemo } from "react";
import { useStore } from "ra-core";

import {
  DEFAULT_PREFERENCES,
  type ContentLayout,
  type FontPreset,
  type NavbarStyle,
  type NoteCorners,
  type Preferences,
  type SidebarCollapsible,
  type SidebarVariant,
  type ThemePreset,
} from "./preferencesConfig";

type PreferencesContextValue = Preferences & {
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void;
  restoreDefaults: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(
  null,
);

/**
 * Layout/appearance preferences (theme preset, font, page layout, navbar
 * behavior, sidebar style) — separate from ThemeProvider's light/dark mode,
 * which stays the single source of truth for that (see theme-provider.tsx).
 * Persisted via ra-core's useStore (localStorage), one key per field, same
 * mechanism the existing dark-mode toggle already uses.
 */
export const PreferencesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [themePreset, setThemePreset] = useStore<ThemePreset>(
    "preferences.themePreset",
    DEFAULT_PREFERENCES.themePreset,
  );
  const [font, setFont] = useStore<FontPreset>(
    "preferences.font",
    DEFAULT_PREFERENCES.font,
  );
  const [contentLayout, setContentLayout] = useStore<ContentLayout>(
    "preferences.contentLayout",
    DEFAULT_PREFERENCES.contentLayout,
  );
  const [navbarStyle, setNavbarStyle] = useStore<NavbarStyle>(
    "preferences.navbarStyle",
    DEFAULT_PREFERENCES.navbarStyle,
  );
  const [sidebarVariant, setSidebarVariant] = useStore<SidebarVariant>(
    "preferences.sidebarVariant",
    DEFAULT_PREFERENCES.sidebarVariant,
  );
  const [sidebarCollapsible, setSidebarCollapsible] =
    useStore<SidebarCollapsible>(
      "preferences.sidebarCollapsible",
      DEFAULT_PREFERENCES.sidebarCollapsible,
    );
  const [noteCorners, setNoteCorners] = useStore<NoteCorners>(
    "preferences.noteCorners",
    DEFAULT_PREFERENCES.noteCorners,
  );

  // Theme preset -> a class on <html>, alongside the existing light/dark
  // class ThemeProvider already manages there (see index.css for the
  // .theme-*/.dark.theme-* rules this drives).
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.forEach((c) => {
      if (c.startsWith("theme-")) root.classList.remove(c);
    });
    if (themePreset !== "default") {
      root.classList.add(`theme-${themePreset}`);
    }
  }, [themePreset]);

  // Font preset -> a class on <body> (font-family cascades down from
  // there), higher specificity than the plain `body {}` rule in index.css.
  useEffect(() => {
    const body = window.document.body;
    body.classList.forEach((c) => {
      if (c.startsWith("font-")) body.classList.remove(c);
    });
    body.classList.add(`font-${font}`);
  }, [font]);

  const setPreference: PreferencesContextValue["setPreference"] = (
    key,
    value,
  ) => {
    switch (key) {
      case "themePreset":
        setThemePreset(value as ThemePreset);
        break;
      case "font":
        setFont(value as FontPreset);
        break;
      case "contentLayout":
        setContentLayout(value as ContentLayout);
        break;
      case "navbarStyle":
        setNavbarStyle(value as NavbarStyle);
        break;
      case "sidebarVariant":
        setSidebarVariant(value as SidebarVariant);
        break;
      case "sidebarCollapsible":
        setSidebarCollapsible(value as SidebarCollapsible);
        break;
      case "noteCorners":
        setNoteCorners(value as NoteCorners);
        break;
    }
  };

  const restoreDefaults = () => {
    setThemePreset(DEFAULT_PREFERENCES.themePreset);
    setFont(DEFAULT_PREFERENCES.font);
    setContentLayout(DEFAULT_PREFERENCES.contentLayout);
    setNavbarStyle(DEFAULT_PREFERENCES.navbarStyle);
    setSidebarVariant(DEFAULT_PREFERENCES.sidebarVariant);
    setSidebarCollapsible(DEFAULT_PREFERENCES.sidebarCollapsible);
    setNoteCorners(DEFAULT_PREFERENCES.noteCorners);
  };

  const value = useMemo<PreferencesContextValue>(
    () => ({
      themePreset,
      font,
      contentLayout,
      navbarStyle,
      sidebarVariant,
      sidebarCollapsible,
      noteCorners,
      setPreference,
      restoreDefaults,
    }),
    [
      themePreset,
      font,
      contentLayout,
      navbarStyle,
      sidebarVariant,
      sidebarCollapsible,
      noteCorners,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
