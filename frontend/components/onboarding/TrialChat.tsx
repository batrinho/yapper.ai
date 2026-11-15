"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { TRIAL_LABELS, type CoachSettings } from "backend/coach-prompt";
import { formatClock } from "backend/dates";
import { usePreferences } from "@/lib/preferences";
import { CoachAvatar } from "@/components/CoachAvatar";
import { LogoMark, Wordmark } from "@/components/ui";
import { Captions } from "@/components/voice/Captions";
import { Transcript } from "@/components/voice/TaskPanel";
import { useVoiceAgent, type PracticeRef } from "@/components/voice/useVoiceAgent";
import {
  ConnectingSkeleton,
  Controls,
  PermissionCard,
  sessionClock,
  STATUS,
  useMouthSync,
} from "@/components/voice/VoiceChat";
import { Waveform } from "@/components/voice/Waveform";

const TRIAL: PracticeRef = { trial: true };

async function finishOnboarding() {
  await fetch("/api/onboarding/complete", { method: "POST" }).catch(() => null);
}

export function TrialChat({ question, settings }: { question: string; settings: CoachSettings }) {
  const router = useRouter();
  const { coach } = usePreferences();
  const voice = useVoiceAgent({ settings, labels: TRIAL_LABELS, coach, practice: TRIAL });
  const mascotRef = useRef<HTMLDivElement>(null);
  const [micAllowed, setMicAllowed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useMouthSync(mascotRef, voice.agentLevelRef, voice.mood === "talking");

  useEffect(() => {
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((status) => setMicAllowed(status.state === "granted"))
      .catch(() => {});
  }, []);

  async function finish() {
    setLeaving(true);
    await voice.end();
    await finishOnboarding();
    router.replace("/");
    router.refresh();
  }

  const live = voice.phase === "live";
  const status =
    voice.phase === "permission"
      ? { title: "Your first chat", sub: "Free, and it doesn't use your 3 practices." }
      : voice.phase === "connecting"
        ? { title: "Waking up your coach…", sub: "Getting your question ready" }
        : STATUS[voice.mood];

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex h-[72px] items-center justify-between gap-3 border-b border-line px-4 sm:px-8">
        <div className="flex items-center gap-2">
          <LogoMark size={26} />
          <Wordmark />
        </div>
        <span className="flex items-center gap-1.5 text-[16px] font-bold tabular-nums" aria-label={`Chat time ${formatClock(voice.elapsed)}`}>
          <Timer size={18} className="text-muted" aria-hidden />
          {sessionClock(voice.elapsed)}
        </span>
      </header>

      <div className="grid flex-1 gap-6 p-4 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className={`card ${voice.mood} flex min-h-[600px] flex-col items-center justify-center gap-5 bg-surface px-5 py-10`} aria-label="Coach">
          <div className="relative grid place-items-center">
            <span aria-hidden className="halo absolute size-[248px] rounded-full bg-tint" />
            <CoachAvatar ref={mascotRef} state={voice.mood} size={230} className="relative" />
          </div>
          <div className="text-center" aria-live="polite">
            <h1 className="flex items-center justify-center gap-2.5 text-[22px] font-bold">
              <span className="status-dot size-2.5 rounded-full bg-accent" aria-hidden />
              {status.title}
            </h1>
            <p className="mt-1 max-w-md text-[16px] text-muted">{status.sub}</p>
          </div>

          {voice.phase === "permission" && <PermissionCard error={voice.error} micAllowed={micAllowed} freeLeft={null} onStart={voice.start} />}
          {voice.phase === "connecting" && <ConnectingSkeleton />}
          {live && (
            <>
              <Captions caption={voice.caption} />
              <Waveform mood={voice.mood} levelRef={voice.levelRef} />
              <Controls mood={voice.mood} paused={voice.paused} busy={leaving} onPause={voice.pause} onResume={voice.resume} onEnd={finish} />
            </>
          )}
          {!live && (
            <button type="button" onClick={finish} disabled={leaving} className="btn btn-ghost">
              Skip and go to my courses
            </button>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          <section className="card p-6" aria-labelledby="question-title">
            <h2 id="question-title" className="text-[13px] text-muted">
              Your question
            </h2>
            <p className="mt-3 text-[20px] font-bold leading-snug tracking-[-0.01em]">&ldquo;{question}&rdquo;</p>
            <p className="mt-4 text-[14px] text-muted">No score, no pressure. Just talk, and tap End when you&rsquo;re done.</p>
          </section>
          <Transcript lines={voice.lines} speaking={live && voice.mood === "listening" ? voice.interim : ""} live={live} />
        </aside>
      </div>
    </div>
  );
}
