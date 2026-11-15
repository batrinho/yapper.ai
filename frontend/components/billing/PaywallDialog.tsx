"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { FREE_PRACTICES, type PaidPlan } from "backend/plans";
import { CoachAvatar } from "@/components/CoachAvatar";
import { PlanPicker } from "@/components/billing/PlanPicker";
import { usePlanCheckout } from "@/components/billing/usePlanCheckout";

export const PLAN_FEATURES = [
  "Every lesson and practice in all 5 courses",
  "Unlimited voice practice with your coach",
  "Full reports with AI feedback and a stronger version",
  "Your coach remembers what to work on",
];

const COPY = {
  practices: {
    eyebrow: "You're on a roll",
    title: `You've used your ${FREE_PRACTICES} free practices`,
    sub: "Pick a plan to keep practicing out loud with your coach.",
  },
  chapter: {
    eyebrow: "Lesson 1 is free",
    title: "Unlock the rest of the course",
    sub: "Every lesson after the first, and every practice outside the free course, is part of yapper Pro.",
  },
};

type Props = { reason: keyof typeof COPY; backHref: string };

export function PaywallDialog({ reason, backHref }: Props) {
  const copy = COPY[reason];
  const [selected, setSelected] = useState<PaidPlan>("annual");
  const checkout = usePlanCheckout(usePathname());

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        className="fade-up w-full max-w-[640px] rounded-3xl border border-line bg-bg p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center gap-4">
          <CoachAvatar state="celebrating" size={72} className="!mx-0 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-accent-ink">{copy.eyebrow}</p>
            <h2 id="paywall-title" className="text-[24px] font-bold leading-tight tracking-[-0.02em]">
              {copy.title}
            </h2>
          </div>
        </div>
        <p className="mt-3 text-[15px] text-muted">{copy.sub}</p>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {PLAN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-[14px]">
              <Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <PlanPicker selected={selected} onSelect={setSelected} />
        </div>

        <button
          type="button"
          onClick={() => checkout.choose(selected)}
          disabled={checkout.status === "saving"}
          className="btn btn-primary mt-6 h-[52px] w-full text-[16px]"
        >
          {checkout.status === "saving" ? "One sec…" : "Let's go"}
        </button>
        {checkout.status === "error" && (
          <p role="alert" className="mt-2 text-center text-[13px] font-medium text-accent-ink">
            Couldn&rsquo;t switch plans. Try again.
          </p>
        )}
        <p className="mt-3 text-center text-[12px] text-muted">Demo checkout for the Business Cup. No card needed and nothing is charged.</p>
        <Link href={backHref} className="btn btn-ghost mx-auto mt-2 flex w-fit">
          Not now
        </Link>
      </section>
    </div>
  );
}
