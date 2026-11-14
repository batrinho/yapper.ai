"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, ChevronLeft, Lock, Play, RotateCw, Square } from "lucide-react";
import type { PracticeSession, Step } from "backend/db/schema";
import { lessonBefore, lessonNumber, stepHref, stepName, type CourseWithSteps } from "backend/course-state";
import { missingRequirements, PART_KEYS, type LiveStats } from "backend/criteria";
import { dayKey, formatDuration } from "backend/dates";
import { useToday } from "@/lib/hooks";
import { countWords } from "backend/speech";
import { CoachAvatar } from "@/components/CoachAvatar";
import { usePreferences } from "@/lib/preferences";
import { NumberTile, Page, ProgressBar, ProgressRing } from "@/components/ui";
import { HighlightedText } from "@/components/voice/TaskPanel";

type Session = Omit<PracticeSession, "createdAt"> & { createdAt: string };
type Props = { course: CourseWithSteps; index: number; session: Session; nextOpen: boolean; passedBefore: boolean };

const BURST_DOTS = 8;

function statsFor(session: Session): LiveStats {
  const speakingSec = session.wpm ? Math.round((countWords(session.transcript) / session.wpm) * 60) : session.durationSec;
  return { score: session.overall, parts: session.star, fillers: session.fillerCount, speakingSec, hasSpoken: true };
}

function sentence(parts: string[]): string {
  const text = parts.join(" and ");
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}.` : "";
}

function splitTip(tip: string): { title: string; body: string } {
  const [title, ...rest] = tip.split(" — ");
  return { title: title.trim(), body: rest.join(" — ").trim() };
}

function ScoreCard({ course, step, session }: { course: CourseWithSteps; step: Step; session: Session }) {
  const { scores, star, passed } = session;
  const labels = course.structureLabels;
  const missing = labels.filter((_, i) => !star[PART_KEYS[i]]);
  const structureNote =
    missing.length === 0 ? "All four parts" : missing.length === 1 ? `No clear ${missing[0]}` : `Missing ${missing.join(", ")}`;
  const paceNote = session.wpm ? `${session.wpm} wpm${session.wpm > 160 ? ", a bit fast" : session.wpm < 120 ? ", a bit slow" : ""}` : "";

  const rows = [
    { label: "Structure", note: structureNote, value: scores.structure },
    { label: "Clarity", note: "", value: scores.clarity },
    { label: "Pace", note: paceNote, value: scores.pace },
    { label: "Filler words", note: `${session.fillerCount} total`, value: scores.filler },
    { label: "Confidence", note: "", value: scores.confidence },
  ];

  const bubble = session.coachLine ?? (passed ? "That answer passes. Onward!" : "So close. One more try and you're through.");

  return (
    <section className="card grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)] xl:grid-cols-[auto_minmax(0,1fr)_240px]">
      <div className="flex flex-col items-center gap-4">
        <ProgressRing value={scores.overall} size={148} stroke={10} label={`Score ${scores.overall} out of 100`}>
          <span className="flex flex-col items-center">
            <span className="text-[44px] font-extrabold leading-none tracking-[-0.03em]">{scores.overall}</span>
            <span className="mt-1 text-[13px] text-muted">out of 100</span>
          </span>
        </ProgressRing>
        <span className={`chip ${passed ? "chip-tint" : "chip-outline text-text"}`}>
          {passed ? "Passed" : "Not yet"} · needed {step.minScore ?? 70}
        </span>
      </div>

      <ul className="flex flex-col justify-center gap-4">
        {rows.map((row, i) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-[15px]">
              <span>
                <span className="font-bold">{row.label}</span>
                {row.note && <span className="ml-2 text-[14px] text-muted">{row.note}</span>}
              </span>
              <span className="font-bold tabular-nums">{row.value}</span>
            </div>
            <ProgressBar value={row.value} delayMs={i * 90} className="mt-2" />
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center justify-center gap-3 md:col-span-2 xl:col-span-1">
        <CoachAvatar state={passed ? "celebrating" : "talking"} size={140} />
        <p className="max-w-[240px] rounded-2xl bg-surface-2 px-5 py-3 text-center text-[15px] leading-snug">{bubble}</p>
      </div>
    </section>
  );
}

function UnlockBadge() {
  return (
    <div className="relative size-16 shrink-0" aria-hidden>
      {Array.from({ length: BURST_DOTS }, (_, i) => (
        <span
          key={i}
          className="burst-dot"
          style={{ "--a": `${i * (360 / BURST_DOTS)}deg`, background: i % 2 ? "var(--tint-2)" : "var(--accent)" } as CSSProperties}
        />
      ))}
      <span className="unlock-badge relative grid size-16 place-items-center rounded-2xl text-white">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="11" width="14" height="10" rx="2.5" />
          <path className="unlock-shackle" d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
    </div>
  );
}

function NextStepCard({ course, step, index }: { course: CourseWithSteps; step: Step; index: number }) {
  const next = course.steps[index + 1];
  let title = course.title;
  let sub = "You finished every step. Nice work.";
  let action = { label: "Back to courses", href: "/courses" };
  let label = "Course complete";

  if (next?.kind === "video") {
    const after = course.steps[index + 2];
    const n = lessonNumber(course, index + 1);
    label = step.required ? "Next lesson unlocked" : "Up next";
    title = `Lesson ${n} · ${next.title}`;
    sub = `${next.durationMin} min lecture${after && after.kind !== "video" ? `, then ${after.required ? "a required" : "an optional"} practice` : ""}`;
    action = { label: `Start Lesson ${n}`, href: stepHref(course.id, next) };
  } else if (next) {
    label = step.required ? "Next step unlocked" : "Up next";
    title = next.title;
    sub = `Voice practice · ${next.durationMin} min`;
    action = { label: "Start practice", href: stepHref(course.id, next) };
  }

  return (
    <section className="unlock-card flex flex-col gap-5 rounded-2xl bg-tint p-6 sm:flex-row sm:items-center sm:p-7">
      <UnlockBadge />
      <div className="unlock-copy min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-accent-ink">{label}</p>
        <h2 className="mt-0.5 text-[22px] font-bold leading-tight tracking-[-0.02em]">{title}</h2>
        <p className="mt-1 text-[15px] text-muted">{sub}</p>
      </div>
      <Link href={action.href} className="btn btn-primary h-[52px] shrink-0 px-6 text-[16px]">
        {action.label}
        <ArrowRight size={18} aria-hidden />
      </Link>
    </section>
  );
}

function RetryCard({ course, step, index, session, passedBefore }: { course: CourseWithSteps; step: Step; index: number; session: Session; passedBefore: boolean }) {
  const lecture = lessonBefore(course, index);
  const gap = (step.minScore ?? 70) - session.overall;
  const nextName = index + 1 < course.steps.length ? stepName(course, index + 1) : "The course finish";
  const missing = missingRequirements(step, course.structureLabels, statsFor(session));
  const overline = passedBefore
    ? "Your earlier pass still counts"
    : step.required
      ? `${nextName} stays locked for now`
      : "Optional practice · nothing gets locked";

  return (
    <section className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
      <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-surface-2 text-lock">
        <Lock size={26} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-muted">{overline}</p>
        <h2 className="mt-0.5 text-[22px] font-bold leading-tight tracking-[-0.02em]">
          {gap > 0 ? `You're ${gap} point${gap === 1 ? "" : "s"} from passing` : "One rule left to pass"}
        </h2>
        <p className="mt-1 text-[15px] text-muted">{sentence(missing)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {lecture && (
          <Link href={stepHref(course.id, lecture.step)} className="btn btn-ghost">
            Rewatch lecture
          </Link>
        )}
        <Link href={stepHref(course.id, step)} className="btn btn-primary h-[52px] px-6 text-[16px]">
          <RotateCw size={18} aria-hidden />
          Try again
        </Link>
      </div>
    </section>
  );
}

function useCoachVoice() {
  const { coach } = usePreferences();
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  async function toggle(text: string) {
    if (state === "playing" || state === "loading") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    setState("loading");
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, coach }),
      });
      if (!response.ok) throw new Error();
      const audio = new Audio(URL.createObjectURL(await response.blob()));
      audio.onended = () => setState("idle");
      audioRef.current = audio;
      await audio.play();
      setState("playing");
    } catch {
      setState("error");
    }
  }

  return { state, toggle };
}

function ImprovedAnswer({ course, session }: { course: CourseWithSteps; session: Session }) {
  const voice = useCoachVoice();
  const active = voice.state === "playing" || voice.state === "loading";
  const fullAnswer = PART_KEYS.map((key) => session.improvedAnswer[key]).join(" ");

  return (
    <section className="card p-6 sm:p-7" aria-labelledby="improved-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="improved-title" className="section-title">
          Improved answer
        </h2>
        <button type="button" onClick={() => voice.toggle(fullAnswer)} aria-pressed={active} className="btn btn-secondary">
          {active ? <Square size={14} className="fill-current" aria-hidden /> : <Play size={14} className="fill-current" aria-hidden />}
          {voice.state === "loading" ? "Loading…" : active ? "Stop" : voice.state === "error" ? "Try again" : "Hear it from your coach"}
        </button>
      </div>
      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-0">
        <div className="md:pr-7">
          <h3 className="text-[14px] font-semibold text-muted">What you said</h3>
          <p className="mt-3 text-[16px] leading-[1.75] text-muted">
            &ldquo;
            <HighlightedText text={session.transcript} />
            &rdquo;
          </p>
        </div>
        <div className="border-line md:border-l md:pl-7">
          <h3 className="text-[14px] font-semibold text-accent-ink">Stronger version</h3>
          <ol className="mt-3 flex flex-col gap-4">
            {course.structureLabels.map((label, i) => (
              <li key={label} className="flex gap-3 text-[16px] leading-relaxed">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-accent text-[13px] font-bold text-white" title={label}>
                  {label[0]}
                </span>
                <span>{session.improvedAnswer[PART_KEYS[i]]}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function ReportView({ course, index, session, nextOpen, passedBefore }: Props) {
  const today = useToday();
  const step = course.steps[index];
  const created = new Date(session.createdAt);
  const when = today && dayKey(created) === today ? "Today" : created.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Page width="max-w-[1140px]">
      <Link href={`/courses/${course.id}`} className="flex w-fit items-center gap-1 text-[14px] text-muted hover:text-text">
        <ChevronLeft size={16} aria-hidden />
        {course.title}
      </Link>
      <h1 className="page-title mt-3">Practice report</h1>
      <p className="mt-1 text-[16px] text-muted">
        {step.title} · {formatDuration(session.durationSec)} · {when}
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <ScoreCard course={course} step={step} session={session} />
        {session.passed && nextOpen ? (
          <NextStepCard course={course} step={step} index={index} />
        ) : session.passed ? null : (
          <RetryCard course={course} step={step} index={index} session={session} passedBefore={passedBefore} />
        )}

        <section aria-labelledby="tips-title">
          <h2 id="tips-title" className="section-title mt-4">
            3 tips for next time
          </h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            {session.tips.slice(0, 3).map((tip, i) => {
              const { title, body } = splitTip(tip);
              return (
                <li key={tip} className="card p-6">
                  <NumberTile n={i + 1} />
                  <h3 className="mt-3 text-[16px] font-bold leading-snug">{title}</h3>
                  {body && <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>}
                </li>
              );
            })}
          </ol>
        </section>

        <ImprovedAnswer course={course} session={session} />

        <Link href={`/courses/${course.id}`} className="btn btn-ghost mx-auto mt-2">
          Back to course
        </Link>
      </div>
    </Page>
  );
}
