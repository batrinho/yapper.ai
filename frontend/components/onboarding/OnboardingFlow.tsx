"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import type { Profile } from "backend/db/schema";
import { starterQuestions, SURVEY } from "backend/onboarding";
import { CoachAvatar } from "@/components/CoachAvatar";
import { CoachChoice } from "@/components/CoachChoice";

type Props = { userName: string; savedProfile: Profile | null; trialAvailable: boolean };
type Stage = "survey" | "coach" | "starters";

const TOTAL_STEPS = SURVEY.length + 2;

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${current + 1} of ${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= current ? "w-6 bg-accent" : "w-3 bg-track"}`} />
      ))}
    </div>
  );
}

async function finishOnboarding() {
  await fetch("/api/onboarding/complete", { method: "POST" });
}

export function OnboardingFlow({ userName, savedProfile, trialAvailable }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(savedProfile ? "coach" : "survey");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Profile>>(savedProfile ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = SURVEY[questionIndex];
  const stepIndex = stage === "survey" ? questionIndex : stage === "coach" ? SURVEY.length : SURVEY.length + 1;

  async function saveProfile(profile: Partial<Profile>) {
    setSaving(true);
    setError(null);
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    }).catch(() => null);
    setSaving(false);
    if (!response?.ok) return setError("Couldn't save your answers. Try again.");
    setStage("coach");
  }

  function answer(value: string) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (questionIndex < SURVEY.length - 1) setQuestionIndex(questionIndex + 1);
    else void saveProfile(next);
  }

  function back() {
    if (stage === "starters") return setStage("coach");
    if (stage === "coach") {
      setQuestionIndex(SURVEY.length - 1);
      return setStage("survey");
    }
    setQuestionIndex(Math.max(0, questionIndex - 1));
  }

  async function skip() {
    setSaving(true);
    await finishOnboarding();
    router.replace("/");
    router.refresh();
  }

  const canGoBack = stage !== "survey" || questionIndex > 0;

  return (
    <section className="card p-6 sm:p-8" aria-live="polite">
      <div className="flex items-center justify-between">
        <StepDots current={stepIndex} />
        {canGoBack && (
          <button type="button" onClick={back} className="flex items-center gap-1 text-[14px] text-muted hover:text-text">
            <ArrowLeft size={15} aria-hidden /> Back
          </button>
        )}
      </div>

      {stage === "survey" && (
        <div key={question.id} className="fade-up mt-6">
          {questionIndex === 0 && (
            <p className="text-[14px] font-semibold text-accent-ink">Hi {userName.split(" ")[0]}! A few quick questions so your coach can tailor practice.</p>
          )}
          <h1 className="mt-2 text-[24px] font-bold leading-tight tracking-[-0.02em]">{question.question}</h1>
          <div role="radiogroup" aria-label={question.question} className="mt-5 grid gap-3 sm:grid-cols-2">
            {question.options.map((option) => {
              const selected = answers[question.id] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={saving}
                  onClick={() => answer(option.value)}
                  className={`min-h-[56px] rounded-2xl border px-4 py-3 text-left text-[15px] font-semibold transition-colors duration-200 ${
                    selected ? "border-accent bg-tint text-accent-ink" : "border-line hover:border-line-strong hover:bg-surface"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {error && (
            <p role="alert" className="mt-3 text-[13px] font-medium text-accent-ink">
              {error}
            </p>
          )}
        </div>
      )}

      {stage === "coach" && (
        <div className="fade-up mt-6">
          <h1 id="coach-step-title" className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
            Pick your coach
          </h1>
          <p className="mt-1 text-[15px] text-muted">Each coach has its own voice. You can switch anytime in Settings.</p>
          <div className="mt-5">
            <CoachChoice labelledBy="coach-step-title" />
          </div>
          <button type="button" onClick={() => setStage("starters")} className="btn btn-primary mt-6 h-[52px] w-full text-[16px]">
            Continue <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      )}

      {stage === "starters" && (
        <div className="fade-up mt-6">
          <div className="flex items-center gap-4">
            <CoachAvatar state="talking" size={72} className="!mx-0 shrink-0" />
            <div>
              <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">Let&rsquo;s have your first chat</h1>
              <p className="mt-1 text-[14px] text-muted">
                {trialAvailable ? "It's free and doesn't use your 3 practices. Pick a question to start." : "You've already had your first chat."}
              </p>
            </div>
          </div>
          {trialAvailable && (
            <ul className="mt-5 flex flex-col gap-3">
              {starterQuestions(answers as Profile).map((starter, i) => (
                <li key={starter}>
                  <button
                    type="button"
                    onClick={() => router.push(`/onboarding/trial?q=${i}`)}
                    className="card card-link flex w-full items-center gap-3 p-4 text-left"
                  >
                    <MessageCircle size={20} className="shrink-0 text-accent" aria-hidden />
                    <span className="flex-1 text-[15px] font-semibold">&ldquo;{starter}&rdquo;</span>
                    <ArrowRight size={18} className="shrink-0 text-muted" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={skip} disabled={saving} className={`btn mt-5 w-full ${trialAvailable ? "btn-ghost" : "btn-primary h-[52px]"}`}>
            {trialAvailable ? "Skip for now" : "Go to my courses"}
          </button>
        </div>
      )}
    </section>
  );
}
