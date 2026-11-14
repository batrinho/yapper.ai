import type { Plan } from "./db/schema";

export const FREE_PRACTICES = 3;

export const PAID_PLANS = {
  monthly: { name: "Monthly", price: 29.99, period: "month" },
  annual: { name: "Annual", price: 149.99, period: "year" },
} as const;

export type PaidPlan = keyof typeof PAID_PLANS;

const yearOfMonthly = PAID_PLANS.monthly.price * 12;

export const ANNUAL_SAVINGS = {
  amount: Math.round((yearOfMonthly - PAID_PLANS.annual.price) * 100) / 100,
  percent: Math.round(((yearOfMonthly - PAID_PLANS.annual.price) / yearOfMonthly) * 100),
  perMonth: Math.round((PAID_PLANS.annual.price / 12) * 100) / 100,
};

export function isPlan(value: unknown): value is Plan {
  return value === "free" || value === "monthly" || value === "annual";
}

export function renewalDate(plan: Plan, from = new Date()): Date | null {
  if (plan === "free") return null;
  const next = new Date(from);
  if (plan === "monthly") next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function freePracticesLeft(plan: Plan, attemptsUsed: number): number | null {
  return plan === "free" ? Math.max(0, FREE_PRACTICES - attemptsUsed) : null;
}

export const formatPrice = (amount: number) => `$${amount.toFixed(2)}`;

type StepLike = { kind: string };

export const isPaid = (plan: Plan) => plan !== "free";

/** Chapter 1 is the first video lesson plus the practices after it; it ends where Lesson 2 starts. */
export function freeStepCount(steps: StepLike[]): number {
  const secondLesson = steps.findIndex((step, i) => step.kind === "video" && steps.slice(0, i).some((s) => s.kind === "video"));
  return secondLesson === -1 ? steps.length : secondLesson;
}

export function needsSubscription(plan: Plan, steps: StepLike[], index: number): boolean {
  return !isPaid(plan) && index >= freeStepCount(steps);
}
