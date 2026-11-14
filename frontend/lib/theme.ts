import { useEffect, useSyncExternalStore } from "react";
import { useHydrated } from "@/lib/hooks";
import { setTheme, usePreferences, type Theme } from "@/lib/preferences";
import { DARK_QUERY } from "@/lib/theme-script";

function subscribeToSystem(listener: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function useSystemTheme(): Theme {
  return useSyncExternalStore(
    subscribeToSystem,
    () => (window.matchMedia(DARK_QUERY).matches ? "dark" : "light"),
    () => "light",
  );
}

export function useTheme() {
  const stored = usePreferences().theme;
  const system = useSystemTheme();
  const theme = stored ?? system;
  return { theme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}

export function useApplyTheme() {
  const { theme } = useTheme();
  const hydrated = useHydrated();
  useEffect(() => {
    if (hydrated) document.documentElement.dataset.theme = theme;
  }, [hydrated, theme]);
}
