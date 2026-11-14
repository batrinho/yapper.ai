import { useSyncExternalStore } from "react";
import type { CoachId } from "backend/coach-prompt";

export type Theme = "light" | "dark";
type Preferences = { theme: Theme | null; sidebarCollapsed: boolean; coach: CoachId };

export const PREFERENCES_KEY = "yapper-prefs";
const DEFAULTS: Preferences = { theme: null, sidebarCollapsed: false, coach: "yap" };
const listeners = new Set<() => void>();
let cache: Preferences | null = null;

function read(): Preferences {
  if (cache) return cache;
  try {
    cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "{}") };
  } catch {
    cache = DEFAULTS;
  }
  return cache!;
}

function update(patch: Partial<Preferences>) {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(cache));
  } catch {
    // Private mode: keep the preference for this tab only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, read, () => DEFAULTS);
}

export const setTheme = (theme: Theme) => update({ theme });
export const setSidebarCollapsed = (sidebarCollapsed: boolean) => update({ sidebarCollapsed });
export const setCoach = (coach: CoachId) => update({ coach });
