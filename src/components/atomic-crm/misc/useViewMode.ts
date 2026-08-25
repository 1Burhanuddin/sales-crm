import { useState } from "react";

export function useViewMode<T extends string>(storageKey: string, defaultMode: T) {
  const [mode, setMode] = useState<T>(() => {
    if (typeof window === "undefined") return defaultMode;
    return (localStorage.getItem(storageKey) as T) || defaultMode;
  });

  const setViewMode = (value: T) => {
    setMode(value);
    localStorage.setItem(storageKey, value);
  };

  return [mode, setViewMode] as const;
}
