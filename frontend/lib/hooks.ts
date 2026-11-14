import { useSyncExternalStore } from "react";
import { todayKey } from "backend/dates";

const noopSubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function useToday(): string | null {
  return useSyncExternalStore(noopSubscribe, todayKey, () => null);
}
