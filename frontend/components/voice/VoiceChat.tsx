"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronLeft, Flag, Mic, MicOff, Pause, Play, RotateCw, Timer, WifiOff } from "lucide-react";
import type { Step } from "backend/db/schema";
import type { CoachSettings } from "backend/coach-prompt";
import { FREE_PRACTICES } from "backend/plans";
import type { CourseWithSteps } from "backend/course-state";
import { buildCriteria } from "backend/criteria";
import { formatClock } from "backend/dates";
import { countFillers, countWords, wordsPerMinute } from "backend/speech";
import type { MascotState } from "@/components/Mascot";
import { CoachAvatar } from "@/components/CoachAvatar";
import { PaywallDialog } from "@/components/billing/PaywallDialog";
import { usePreferences } from "@/lib/preferences";
import { PracticeBadge } from "@/components/ui";
import { Captions } from "@/components/voice/Captions";
import { FeedbackChips } from "@/components/voice/FeedbackChips";
import { TaskPanel } from "@/components/voice/TaskPanel";
import { useVoiceAgent } from "@/components/voice/useVoiceAgent";
import { Waveform } from "@/components/voice/Waveform";

type Props = {
  course: CourseWithSteps;
  step: Step;
  settings: CoachSettings;
  attempt: number;
  freeLeft: number | null;
  lessonLabel: string | null;
  backHref: string;
};

type Recording = { audio: Blob; mimeType: string };

const MIC_HINT: Record<MascotState, string> = {
  listening: "Tap to pause",
  talking: "Just talk to interrupt",
  thinking: "One sec",
  celebrating: "Tap End when you're ready",
  sleeping: "Tap to resume",
};

export const STATUS: Record<MascotState, { title: string; sub: string }> = {
  listening: { title: "Listening…", sub: "Take your time. Just talk; your coach is listening." },
  talking: { title: "Coach is talking", sub: "Jump in anytime. Speaking interrupts the coach." },
  thinking: { title: "Thinking…", sub: "Checking your structure" },
  celebrating: { title: "Nailed it!", sub: "That answer passes. End when you're ready." },
  sleeping: { title: "Paused", sub: "Breathe. Pick up right where you left off." },
};

export function sessionClock(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function useRememberedMicrophone(setMicAllowed: (allowed: boolean) => void) {
  useEffect(() => {
    let cancelled = false;
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((status) => {
        if (!cancelled && status.state === "granted") setMicAllowed(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setMicAllowed]);
}

export function useMouthSync(mascotRef: RefObject<HTMLDivElement | null>, levelRef: RefObject<number>, talking: boolean) {
  useEffect(() => {
    const wrapper = mascotRef.current;
    const mouth = wrapper?.querySelector<SVGGElement>(".ym-mouth");
    if (!wrapper || !mouth || !talking) return;
    wrapper.classList.add("ym-sync");
    let frame = 0;
    const tick = () => {
      mouth.style.transform = `scaleY(${Math.min(1, Math.max(0.25, levelRef.current * 2.2))})`;
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      wrapper.classList.remove("ym-sync");
      mouth.style.removeProperty("transform");
    };
  }, [mascotRef, levelRef, talking]);
}

export function VoiceChat({ course, step, settings, attempt, freeLeft, lessonLabel, backHref }: Props) {
  const router = useRouter();
  const labels = course.structureLabels;
  const { coach } = usePreferences();
  const practice = useMemo(() => ({ courseId: course.id, stepId: step.id }), [course.id, step.id]);
  const voice = useVoiceAgent({ settings, labels, coach, practice });
  const mascotRef = useRef<HTMLDivElement>(null);
  const [scoring, setScoring] = useState<"idle" | "busy" | "failed">("idle");
  const [savedRecording, setSavedRecording] = useState<Recording | null>(null);
  const [micAllowed, setMicAllowed] = useState(false);
  useMouthSync(mascotRef, voice.agentLevelRef, voice.mood === "talking");
  useRememberedMicrophone(setMicAllowed);

  const fillers = countFillers(voice.userAnswer);
  const words = countWords(voice.userAnswer);
  const sentences = voice.userAnswer.split(/[.!?]+/).filter((s) => s.trim()).length;
  const criteria = buildCriteria(step, labels, {
    score: null,
    parts: voice.parts,
    fillers: fillers.total,
    speakingSec: voice.speakingSec,
    hasSpoken: words > 0,
  });
  const mood: MascotState = scoring === "busy" ? "thinking" : voice.mood;
  const showPaywall = freeLeft === 0 || voice.error?.kind === "paywall";
  const cardError = voice.error?.kind === "paywall" ? null : voice.error;
  const live = voice.phase === "live";

  async function score(recording: Recording) {
    setScoring("busy");
    const form = new FormData();
    form.append("audio", new File([recording.audio], "answer.webm", { type: recording.mimeType }));
    form.append("courseId", course.id);
    form.append("stepId", step.id);
    form.append("durationSec", String(voice.elapsed));
    form.append("conversation", JSON.stringify(voice.lines));
    form.append("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    try {
      const response = await fetch("/api/practice/score", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.sessionId) throw new Error(data.error);
      router.push(`/courses/${course.id}/practice/${step.id}/report?session=${data.sessionId}`);
      router.refresh();
    } catch {
      setSavedRecording(recording);
      setScoring("failed");
    }
  }

  async function endSession() {
    const recording = await voice.end();
    if (!recording || words === 0) {
      router.push(backHref);
      return;
    }
    await score(recording);
  }

  const status =
    scoring === "busy"
      ? { title: "Scoring your answer…", sub: "Counting fillers and checking your structure" }
      : voice.phase === "permission"
        ? { title: "Hi, I'm your coach", sub: "Let's get your mic set up first." }
        : voice.phase === "connecting"
          ? { title: "Waking up your coach…", sub: `Loading ${lessonLabel ?? course.title} and your goal` }
          : STATUS[mood];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-8 md:h-[72px] md:py-0">
        <Link href={backHref} className="flex items-center gap-1 text-[16px] font-medium text-muted hover:text-text">
          <ChevronLeft size={18} aria-hidden />
          {lessonLabel ? "Lesson" : "Course"}
        </Link>
        <p className="order-3 hidden w-full truncate rounded-full border border-line px-4 py-2 text-center text-[14px] text-muted sm:block md:order-none md:w-auto">
          <span className="font-semibold text-text">{course.title}</span>
          {lessonLabel && <> · {lessonLabel}</>} · Goal: <span className="font-semibold text-accent-ink">{step.practiceGoal}</span>
        </p>
        <div className="flex items-center gap-4">
          <PracticeBadge step={step} />
          <span className="flex items-center gap-1.5 text-[16px] font-bold tabular-nums" aria-label={`Session time ${formatClock(voice.elapsed)}`}>
            <Timer size={18} className="text-muted" aria-hidden />
            {sessionClock(voice.elapsed)}
          </span>
        </div>
      </header>

      <div className="grid flex-1 gap-6 p-4 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section
          className={`card ${mood} flex min-h-[640px] flex-col items-center justify-center gap-5 bg-surface px-5 py-10 lg:min-h-[700px]`}
          aria-label="Coach"
        >
          <div className="relative grid place-items-center">
            <span aria-hidden className="halo absolute size-[248px] rounded-full bg-tint sm:size-[272px]" />
            <CoachAvatar ref={mascotRef} state={mood} size={230} className="relative sm:!w-[250px]" />
          </div>

          <div className="text-center" aria-live="polite">
            <h1 className="flex items-center justify-center gap-2.5 text-[22px] font-bold">
              <span className="status-dot size-2.5 rounded-full bg-accent" aria-hidden />
              {status.title}
            </h1>
            <p className="mt-1 max-w-md text-[16px] text-muted">{status.sub}</p>
          </div>

          {voice.phase === "permission" && (
            <PermissionCard error={cardError} micAllowed={micAllowed} freeLeft={freeLeft} onStart={voice.start} />
          )}
          {voice.phase === "connecting" && <ConnectingSkeleton />}

          {live && (
            <>
              <Captions caption={voice.caption} coachTalking={mood === "talking"} />
              <Waveform mood={mood} levelRef={voice.levelRef} />
              <FeedbackChips
                labels={labels}
                wpm={wordsPerMinute(words, voice.speakingSec)}
                fillers={fillers}
                maxFillers={step.criteria?.maxFillers ?? 3}
                parts={voice.parts}
                wordsPerSentence={sentences ? Math.round(words / sentences) : null}
              />
              {voice.error?.kind === "lost" ? (
                <Notice message={voice.error.message}>
                  <button type="button" onClick={voice.retry} className="btn btn-secondary btn-sm">
                    <RotateCw size={15} aria-hidden /> Retry
                  </button>
                  <button type="button" onClick={endSession} className="btn btn-primary btn-sm">
                    <Flag size={15} aria-hidden /> End
                  </button>
                </Notice>
              ) : scoring === "failed" && savedRecording ? (
                <Notice message="Couldn't score that answer. Your recording is still here.">
                  <button type="button" onClick={() => score(savedRecording)} className="btn btn-primary btn-sm">
                    <RotateCw size={15} aria-hidden /> Try again
                  </button>
                </Notice>
              ) : (
                <Controls mood={mood} paused={voice.paused} busy={scoring === "busy"} onPause={voice.pause} onResume={voice.resume} onEnd={endSession} />
              )}
            </>
          )}
        </section>

        <TaskPanel
          step={step}
          labels={labels}
          attempt={attempt}
          criteria={criteria}
          parts={voice.parts}
          lines={voice.lines}
          speaking={live && mood === "listening" ? voice.interim : ""}
          live={live}
        />
      </div>
      {showPaywall && <PaywallDialog reason="practices" backHref={backHref} />}
    </div>
  );
}

type ControlsProps = {
  mood: MascotState;
  paused: boolean;
  busy: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
};

export function Controls({ mood, paused, busy, onPause, onResume, onEnd }: ControlsProps) {
  const toggle = paused ? onResume : onPause;
  return (
    <div className="mt-4 flex items-start justify-center gap-8 sm:gap-12">
      <RoundControl label={paused ? "Resume" : "Pause"} onClick={toggle} disabled={busy}>
        {paused ? <Play size={20} aria-hidden /> : <Pause size={20} aria-hidden />}
      </RoundControl>
      <div className="flex flex-col items-center gap-3">
        <div className="relative size-24">
          <span className="ring" />
          <span className="ring" />
          <span className="ring" />
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            aria-label={paused ? "Resume microphone" : "Pause microphone"}
            aria-pressed={!paused}
            className={`relative grid size-24 place-items-center rounded-full transition-all duration-200 disabled:opacity-55 ${
              mood === "talking" || paused ? "border-2 border-accent bg-bg text-accent-ink" : "bg-btn text-white hover:bg-btn-hover"
            }`}
          >
            <Mic size={30} aria-hidden />
          </button>
        </div>
        <span className="text-[15px] font-semibold">{MIC_HINT[mood]}</span>
      </div>
      <RoundControl label="End" onClick={onEnd} disabled={busy}>
        <Flag size={20} aria-hidden />
      </RoundControl>
    </div>
  );
}

function RoundControl({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 pt-5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="grid size-14 place-items-center rounded-full border border-line-strong bg-bg transition-colors hover:bg-surface-2 disabled:opacity-55"
      >
        {children}
      </button>
      <span className="text-[15px] text-muted" aria-hidden>
        {label}
      </span>
    </div>
  );
}

function Notice({ message, children }: { message: string; children: ReactNode }) {
  return (
    <div role="alert" className="mt-2 flex w-full max-w-[520px] flex-wrap items-center gap-3 rounded-2xl border border-line bg-bg p-4">
      <WifiOff size={18} className="text-accent-ink" aria-hidden />
      <p className="min-w-0 flex-1 text-[15px]">{message}</p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export type PermissionCardProps = {
  error: { kind: string; message: string } | null;
  micAllowed: boolean;
  freeLeft: number | null;
  onStart: () => void;
};

export function PermissionCard({ error, micAllowed, freeLeft, onStart }: PermissionCardProps) {
  const denied = error?.kind === "mic-denied";
  const Icon = denied ? MicOff : Mic;
  const title = denied
    ? "Your microphone is blocked"
    : error
      ? "Couldn't start the practice"
      : micAllowed
        ? "Your mic is ready"
        : "Turn on your microphone";
  const body = denied
    ? "Click the lock icon in your browser's address bar, set Microphone to Allow, then try again."
    : error
      ? error.message
      : micAllowed
        ? "Tap start when you're ready and your coach will say hi."
        : "Your coach needs to hear you to give feedback. yapper listens only during this practice.";

  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-line bg-bg p-7 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-tint text-accent-ink">
        <Icon size={24} aria-hidden />
      </span>
      <h2 className="mt-4 text-[20px] font-bold">{title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
      <button type="button" onClick={onStart} className="btn btn-primary mt-6 h-[52px] w-full text-[16px]">
        {error ? "Try again" : micAllowed ? "Start practice" : "Allow microphone"}
      </button>
      {!error && !micAllowed && <p className="mt-3 text-[13px] text-muted">Your browser will ask next. Choose &ldquo;Allow&rdquo;. It remembers next time.</p>}
      {freeLeft !== null && freeLeft > 0 && (
        <p className="mt-3 text-[13px] font-semibold text-accent-ink">
          {freeLeft} of {FREE_PRACTICES} free practices left
        </p>
      )}
    </div>
  );
}

export function ConnectingSkeleton() {
  return (
    <div className="flex w-full max-w-[490px] flex-col items-center gap-6" aria-hidden>
      <div className="shimmer h-12 w-full rounded-xl" />
      <div className="flex gap-3">
        <div className="shimmer h-[34px] w-28 rounded-full" />
        <div className="shimmer h-[34px] w-36 rounded-full" />
        <div className="shimmer h-[34px] w-32 rounded-full" />
      </div>
      <div className="flex items-center gap-12">
        <div className="shimmer size-14 rounded-full" />
        <div className="shimmer size-24 rounded-full" />
        <div className="shimmer size-14 rounded-full" />
      </div>
    </div>
  );
}
