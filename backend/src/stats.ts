import { addDays, dayKey, lastDays, weekOf, weekdayName } from "./dates";
import type { SessionSummary } from "./queries";

export const WEEKLY_GOAL_MINUTES = 120;

export type Streak = { current: number; lastPracticeDate: string | null };
export type DotState = "done" | "today" | "missed" | "future";

const localDay = (iso: string) => dayKey(new Date(iso));

export function displayStreak({ current, lastPracticeDate }: Streak, today: string): number {
  return lastPracticeDate && lastPracticeDate >= addDays(today, -1) ? current : 0;
}

export function weekDots(sessions: SessionSummary[], today: string) {
  const days = new Set(sessions.map((s) => localDay(s.createdAt)));
  return weekOf(today).map((key) => {
    let state: DotState = "future";
    if (days.has(key)) state = "done";
    else if (key === today) state = "today";
    else if (key < today) state = "missed";
    return { key, letter: weekdayName(key, "narrow"), state };
  });
}

export function minutesThisWeek(sessions: SessionSummary[], today: string) {
  const days = lastDays(today, 7).map((key) => ({
    key,
    minutes: sessions.filter((s) => localDay(s.createdAt) === key).reduce((sum, s) => sum + s.durationSec / 60, 0),
  }));
  const total = Math.round(days.reduce((sum, day) => sum + day.minutes, 0));
  const best = days.reduce((top, day) => (day.minutes > top.minutes ? day : top), days[0]);
  return { days, total, best: best.minutes > 0 ? best : null };
}

function fillerRate(sessions: SessionSummary[]): number | null {
  const minutes = sessions.reduce((sum, s) => sum + s.durationSec / 60, 0);
  return minutes > 0 ? sessions.reduce((sum, s) => sum + s.fillerCount, 0) / minutes : null;
}

export function fillerStats(sessions: SessionSummary[], today: string) {
  const weekStart = addDays(today, -6);
  const lastWeekStart = addDays(today, -13);
  const current = fillerRate(sessions.filter((s) => localDay(s.createdAt) >= weekStart));
  const previous = fillerRate(sessions.filter((s) => localDay(s.createdAt) >= lastWeekStart && localDay(s.createdAt) < weekStart));
  const change = current !== null && previous ? Math.round(((previous - current) / previous) * 100) : null;
  const history = sessions.slice(-8).map((s) => (s.durationSec > 0 ? s.fillerCount / (s.durationSec / 60) : 0));
  return { current, change, history };
}
