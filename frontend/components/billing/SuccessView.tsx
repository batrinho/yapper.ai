import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Check, Mic, Sparkles } from "lucide-react";
import type { Plan } from "backend/db/schema";
import { formatPrice, PAID_PLANS } from "backend/plans";
import { CoachAvatar } from "@/components/CoachAvatar";
import { Page } from "@/components/ui";

type Props = {
  name: string;
  plan: Exclude<Plan, "free">;
  renewsAt: string | null;
  courses: { id: string; title: string; lessons: number }[];
  continueHref: string;
  continueLabel: string;
};

const CONFETTI = 28;
const CONFETTI_COLORS = ["var(--accent)", "var(--tint-2)", "#ffb547", "#3ddc97", "#ff6b8b"];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** Deterministic spread so server and client render the same pieces. */
function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden" aria-hidden>
      {Array.from({ length: CONFETTI }, (_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              "--r": `${(i * 53) % 360}deg`,
              "--drift": `${((i * 29) % 80) - 40}px`,
              animationDelay: `${(i % 7) * 90}ms`,
              animationDuration: `${1600 + ((i * 131) % 900)}ms`,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function Receipt({ plan, renewsAt }: Pick<Props, "plan" | "renewsAt">) {
  const paid = PAID_PLANS[plan];
  const rows = [
    { label: "Plan", value: `yapper Pro · ${paid.name}` },
    { label: "Price", value: `${formatPrice(paid.price)} / ${paid.period}` },
    renewsAt && { label: "Renews on", value: formatDate(renewsAt) },
    { label: "Charged today", value: "$0.00 · demo checkout" },
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <section className="card fade-up p-6" style={{ animationDelay: "250ms" }} aria-labelledby="receipt-title">
      <h2 id="receipt-title" className="text-[15px] font-bold">
        Receipt
      </h2>
      <dl className="mt-4 flex flex-col gap-3 text-[15px]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
            <dt className="text-muted">{row.label}</dt>
            <dd className="text-right font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[12px] text-muted">Demo for the Business Cup. No card was stored and nothing was charged.</p>
    </section>
  );
}

function Unlocked({ courses }: Pick<Props, "courses">) {
  return (
    <section className="card fade-up p-6" style={{ animationDelay: "350ms" }} aria-labelledby="unlocked-title">
      <h2 id="unlocked-title" className="text-[15px] font-bold">
        Now unlocked
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {courses.map((course, i) => (
          <li key={course.id} className="pop-in flex items-center gap-3" style={{ animationDelay: `${600 + i * 120}ms` }}>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-white">
              <Check size={15} strokeWidth={3} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug">{course.title}</span>
            <span className="shrink-0 text-[13px] text-muted">{course.lessons} lessons</span>
          </li>
        ))}
        <li className="pop-in flex items-center gap-3" style={{ animationDelay: `${600 + courses.length * 120}ms` }}>
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-white">
            <Mic size={14} aria-hidden />
          </span>
          <span className="text-[15px] font-semibold">Unlimited voice practice with full reports</span>
        </li>
      </ul>
    </section>
  );
}

export function SuccessView({ name, plan, renewsAt, courses, continueHref, continueLabel }: Props) {
  const firstName = name.split(" ")[0];

  return (
    <Page width="max-w-[860px]">
      <div className="relative">
        <Confetti />
        <header className="relative flex flex-col items-center pt-4 text-center">
          <div className="success-pop relative">
            <CoachAvatar state="celebrating" size={132} />
          </div>
          <p className="fade-up mt-4 flex items-center gap-1.5 text-[14px] font-semibold text-accent-ink" style={{ animationDelay: "100ms" }}>
            <Sparkles size={16} aria-hidden />
            Payment successful
          </p>
          <h1 className="page-title fade-up mt-1" style={{ animationDelay: "150ms" }}>
            Welcome to yapper Pro, {firstName}!
          </h1>
          <p className="fade-up mt-2 max-w-[520px] text-[16px] text-muted" style={{ animationDelay: "200ms" }}>
            Your {PAID_PLANS[plan].name.toLowerCase()} plan is active. Every lesson and every practice is open, and your coach is ready when you are.
          </p>
          <div className="fade-up mt-6 flex flex-wrap justify-center gap-3" style={{ animationDelay: "250ms" }}>
            <Link href={continueHref} className="btn btn-primary h-[52px] px-6 text-[16px]">
              {continueLabel}
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href="/courses" className="btn btn-secondary h-[52px] px-6 text-[16px]">
              Browse courses
            </Link>
          </div>
        </header>

        <div className="relative mt-10 grid gap-6 md:grid-cols-2">
          <Unlocked courses={courses} />
          <Receipt plan={plan} renewsAt={renewsAt} />
        </div>

        <p className="mt-6 text-center text-[14px] text-muted">
          Change or cancel anytime in{" "}
          <Link href="/billing" className="font-semibold text-accent-ink hover:underline">
            Billing
          </Link>
          .
        </p>
      </div>
    </Page>
  );
}
