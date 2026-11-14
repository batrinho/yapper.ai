"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { SkillProfile as Profile } from "backend/db/schema";
import { levelFor } from "backend/course-state";
import { averageSkill, rankedSkills, SKILLS } from "backend/skills";
import { ProgressRing } from "@/components/ui";

const STAGGER_MS = 120;
const COUNT_MS = 1100;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Counts from 0 up to `target`, in step with the bar's CSS animation. */
function useCountUp(target: number, delayMs: number): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (prefersReducedMotion()) return setValue(target);
      start ??= now + delayMs;
      const t = Math.min(1, Math.max(0, (now - start) / COUNT_MS));
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, delayMs]);

  return value;
}

function Delta({ change, delayMs }: { change: number; delayMs: number }) {
  if (change === 0) return <span className="text-[13px] text-faint">no change</span>;
  const up = change > 0;
  return (
    <span
      className={`pop-in inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums ${up ? "bg-tint text-accent-ink" : "bg-surface-2 text-muted"}`}
      style={{ animationDelay: `${delayMs + COUNT_MS - 200}ms` }}
      aria-label={`${up ? "up" : "down"} ${Math.abs(change)} since your last practice`}
    >
      {up ? <ArrowUp size={12} aria-hidden /> : <ArrowDown size={12} aria-hidden />}
      {Math.abs(change)}
    </span>
  );
}

function SkillBar({ label, description, value, previous, index }: { label: string; description: string; value: number | null; previous: number | null; index: number }) {
  const delay = index * STAGGER_MS;
  const shown = useCountUp(value ?? 0, delay);
  const improved = value !== null && previous !== null && value > previous;

  return (
    <li>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight">{label}</p>
          <p className="mt-0.5 text-[13px] text-muted">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {value !== null && previous !== null && <Delta change={value - previous} delayMs={delay} />}
          <span className="w-9 text-right text-[20px] font-bold leading-none tabular-nums tracking-[-0.02em]">{value === null ? "–" : shown}</span>
        </div>
      </div>
      <div
        className="relative mt-2.5 h-2.5 overflow-hidden rounded-full bg-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value ?? 0}
      >
        {value !== null && (
          <div
            className={`skill-fill relative h-full overflow-hidden rounded-full bg-accent ${improved ? "skill-sheen" : ""}`}
            style={{ width: `${value}%`, "--d": `${delay}ms` } as CSSProperties}
          />
        )}
        {previous !== null && value !== null && previous !== value && (
          <span
            className="pop-in absolute inset-y-0 w-0.5 rounded-full bg-text/40"
            style={{ left: `calc(${previous}% - 1px)`, animationDelay: `${delay + COUNT_MS}ms` }}
            title={`Before your last practice: ${previous}`}
            aria-hidden
          />
        )}
      </div>
    </li>
  );
}

export function SkillProfile({ profile }: { profile: Profile | null }) {
  const average = profile ? averageSkill(profile.current) : null;
  const ranked = profile ? rankedSkills(profile.current) : [];
  const updated = profile ? new Date(profile.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;

  return (
    <section className="card p-6 sm:p-8" aria-labelledby="skills-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="skills-title" className="section-title">
          Speaking skills
        </h2>
        <p className="text-[13px] text-muted">
          {profile
            ? `Updated after every practice · ${profile.practices} so far · last ${updated}`
            : "Your coach scores these after every practice"}
        </p>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
        <div className="flex flex-col items-center justify-center gap-3 md:border-r md:border-line md:pr-10">
          <ProgressRing value={average ?? 0} size={148} stroke={10} label={average === null ? "No skill score yet" : `Average skill ${average} out of 100`}>
            <span className="flex flex-col items-center">
              <span className="text-[40px] font-extrabold leading-none tracking-[-0.03em]">{average ?? "–"}</span>
              <span className="mt-1 text-[13px] text-muted">average</span>
            </span>
          </ProgressRing>
          {average !== null ? (
            <>
              <span className="chip chip-tint">{levelFor(average)}</span>
              <p className="max-w-[200px] text-center text-[13px] leading-snug text-muted">
                Strongest: <span className="font-semibold text-text">{ranked[0].label}</span>
                <br />
                Focus next: <span className="font-semibold text-text">{ranked[ranked.length - 1].label}</span>
              </p>
            </>
          ) : (
            <Link href="/courses" className="btn btn-primary">
              Start a practice
            </Link>
          )}
        </div>

        <ul className="flex flex-col justify-center gap-5">
          {SKILLS.map((skill, i) => (
            <SkillBar
              key={skill.key}
              index={i}
              label={skill.label}
              description={skill.description}
              value={profile ? profile.current[skill.key] : null}
              previous={profile?.previous ? profile.previous[skill.key] : null}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
