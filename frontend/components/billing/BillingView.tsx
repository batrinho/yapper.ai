"use client";

import { useState } from "react";
import { Check, CreditCard } from "lucide-react";
import type { Plan } from "backend/db/schema";
import { FREE_PRACTICES, formatPrice, PAID_PLANS, type PaidPlan } from "backend/plans";
import { Page, ProgressBar } from "@/components/ui";
import { PLAN_FEATURES } from "@/components/billing/PaywallDialog";
import { PlanPicker } from "@/components/billing/PlanPicker";
import { usePlanCheckout } from "@/components/billing/usePlanCheckout";

type Props = { plan: Plan; renewsAt: string | null; freeLeft: number | null };

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function CurrentPlan({ plan, renewsAt, freeLeft }: Props) {
  if (plan === "free") {
    const used = FREE_PRACTICES - (freeLeft ?? 0);
    return (
      <section className="card p-6" aria-labelledby="current-title">
        <p className="text-[13px] font-medium text-muted">Current plan</p>
        <h2 id="current-title" className="mt-1 text-[24px] font-bold tracking-[-0.02em]">
          Free
        </h2>
        <div className="mt-4 flex justify-between text-[14px]">
          <span className="text-muted">Free voice practices</span>
          <span className="font-bold">
            {used} of {FREE_PRACTICES} used
          </span>
        </div>
        <ProgressBar value={(used / FREE_PRACTICES) * 100} className="mt-2" />
        <p className="mt-3 text-[14px] text-muted">
          Chapter 1 of every course is free, with {FREE_PRACTICES} voice practices.{" "}
          {freeLeft ? `${freeLeft} free practice${freeLeft === 1 ? "" : "s"} left.` : "You've used them all. Pick a plan below to unlock everything."}
        </p>
      </section>
    );
  }

  const paid = PAID_PLANS[plan];
  return (
    <section className="card p-6" aria-labelledby="current-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-muted">Current plan</p>
          <h2 id="current-title" className="mt-1 text-[24px] font-bold tracking-[-0.02em]">
            {paid.name}
          </h2>
        </div>
        <span className="chip chip-tint">Active</span>
      </div>
      <p className="mt-2 text-[15px]">
        <span className="font-bold">{formatPrice(paid.price)}</span>
        <span className="text-muted"> / {paid.period}</span>
      </p>
      {renewsAt && <p className="mt-1 text-[14px] text-muted">Renews on {formatDate(renewsAt)}</p>}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {PLAN_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-[14px]">
            <Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BillingView(props: Props) {
  const { plan } = props;
  const currentPaid = plan === "free" ? null : plan;
  const [selected, setSelected] = useState<PaidPlan>(currentPaid ?? "annual");
  const checkout = usePlanCheckout();
  const saving = checkout.status === "saving";

  const action =
    plan === "free" ? "Let's go" : selected === currentPaid ? "Current plan" : `Switch to ${PAID_PLANS[selected].name}`;

  return (
    <Page width="max-w-[760px]">
      <h1 className="page-title">Billing</h1>
      <p className="mt-2 text-[16px] text-muted">Your plan, usage and payment details.</p>

      <div className="mt-8 flex flex-col gap-6">
        <CurrentPlan {...props} />

        <section className="card p-6" aria-labelledby="plans-title">
          <h2 id="plans-title" className="section-title">
            {plan === "free" ? "Upgrade your plan" : "Change plan"}
          </h2>
          <p className="mt-1 text-[14px] text-muted">Every chapter and unlimited voice practice on either plan.</p>
          <div className="mt-4">
            <PlanPicker selected={selected} onSelect={setSelected} current={currentPaid} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => checkout.choose(selected)}
              disabled={saving || selected === currentPaid}
              className="btn btn-primary h-[48px] px-6"
            >
              {saving ? "One sec…" : action}
            </button>
            {currentPaid && (
              <button type="button" onClick={() => checkout.choose("free")} disabled={saving} className="btn btn-ghost">
                Cancel subscription
              </button>
            )}
            {checkout.status === "error" && (
              <p role="alert" className="text-[13px] font-medium text-accent-ink">
                Couldn&rsquo;t update your plan. Try again.
              </p>
            )}
          </div>
        </section>

        <section className="card flex items-center gap-4 p-6" aria-labelledby="payment-title">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
            <CreditCard size={22} aria-hidden />
          </span>
          <div>
            <h2 id="payment-title" className="text-[16px] font-bold">
              Payment method
            </h2>
            <p className="text-[14px] text-muted">Demo mode for the Business Cup. No card is stored and nothing is charged.</p>
          </div>
        </section>
      </div>
    </Page>
  );
}
