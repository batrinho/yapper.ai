"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Flame } from "lucide-react";
import { useToday } from "@/lib/hooks";
import type { SessionSummary } from "backend/queries";
import { displayStreak, fillerStats, minutesThisWeek, weekDots, type DotState, type Streak } from "backend/stats";
import { weekdayName } from "backend/dates";

const DOT_STYLES: Record<DotState, string> = {
  done: "bg-accent",
  today: "border-2 border-dashed border-accent",
  missed: "bg-track",
  future: "bg-track",
};

function StatCard({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="card relative p-6" aria-label={title}>
      <h2 className="text-[15px] font-medium">{title}</h2>
      {children}
      <div className="absolute right-6 top-6">{aside}</div>
    </section>
  );
}

function BigNumber({ value, unit }: { value: string; unit: string }) {
  return (
    <p className="mt-3 flex items-baseline gap-1.5">
      <span className="text-[32px] font-bold leading-none tracking-[-0.02em]">{value}</span>
      <span className="text-[16px] text-muted">{unit}</span>
    </p>
  );
}

function StreakCard({ today, sessions, streak: saved }: { today: string | null; sessions: SessionSummary[]; streak: Streak }) {
  const streak = today ? displayStreak(saved, today) : 0;
  const dots = today ? weekDots(sessions, today) : [];

  return (
    <section className="card p-6" aria-label="Streak">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-medium">Streak</h2>
        <Flame size={18} className="fill-accent text-accent" aria-hidden />
      </div>
      <BigNumber value={today ? String(streak) : "–"} unit={streak === 1 ? "day" : "days"} />
      <ol className="mt-5 flex justify-between" aria-label="This week">
        {dots.map((dot) => (
          <li key={dot.key} className="flex flex-col items-center gap-2">
            <span className={`size-[22px] rounded-full ${DOT_STYLES[dot.state]}`} aria-hidden />
            <span className={`text-[12px] ${dot.state === "today" ? "font-bold text-accent-ink" : "text-faint"}`}>
              {dot.letter}
              <span className="sr-only">{`: ${dot.state}`}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MinutesCard({ today, sessions }: { today: string | null; sessions: SessionSummary[] }) {
  const week = today ? minutesThisWeek(sessions, today) : null;
  const max = week ? Math.max(1, ...week.days.map((d) => d.minutes)) : 1;

  return (
    <StatCard
      title="Minutes spoken"
      aside={
        <div className="flex h-14 items-end gap-[5px]" aria-hidden>
          {week?.days.map((day) => (
            <span
              key={day.key}
              className={`w-[6px] rounded-full ${day.key === week.best?.key ? "bg-accent" : "bg-tint-2"}`}
              style={{ height: `${Math.max(8, (day.minutes / max) * 100)}%` }}
            />
          ))}
        </div>
      }
    >
      <BigNumber value={week ? String(week.total) : "–"} unit="this week" />
      <p className="mt-4 text-[14px] text-muted">
        {week?.best
          ? `Most on ${weekdayName(week.best.key)} · ${Math.round(week.best.minutes)} min`
          : "No practice yet this week"}
      </p>
    </StatCard>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((v, i) => {
    const x = 4 + (i / (values.length - 1)) * 104;
    const y = 6 + (max === min ? 14 : ((max - v) / (max - min)) * 28);
    return [x, y] as const;
  });
  const [lastX, lastY] = points[points.length - 1];
  return (
    <svg width="112" height="40" viewBox="0 0 112 40" aria-hidden className="shrink-0">
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3.5" fill="var(--accent)" />
    </svg>
  );
}

function FillerCard({ today, sessions }: { today: string | null; sessions: SessionSummary[] }) {
  const stats = today ? fillerStats(sessions, today) : null;
  const improving = stats?.change !== null && stats?.change !== undefined && stats.change >= 0;

  return (
    <StatCard title="Filler words" aside={stats && <Sparkline values={stats.history} />}>
      <BigNumber value={stats?.current != null ? stats.current.toFixed(1) : "–"} unit="per min" />
      <p className={`mt-4 flex items-center gap-1.5 text-[14px] font-semibold ${improving ? "text-accent-ink" : "text-muted"}`}>
        {stats?.change == null ? (
          <span className="font-normal">Practice to see your trend</span>
        ) : (
          <>
            {improving ? <ArrowDown size={16} aria-hidden /> : <ArrowUp size={16} aria-hidden />}
            {Math.abs(stats.change)}% {improving ? "fewer" : "more"} than last week
          </>
        )}
      </p>
    </StatCard>
  );
}

export function StatCards({ sessions, streak }: { sessions: SessionSummary[]; streak: Streak }) {
  const today = useToday();
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StreakCard today={today} sessions={sessions} streak={streak} />
      <MinutesCard today={today} sessions={sessions} />
      <FillerCard today={today} sessions={sessions} />
    </div>
  );
}
