import { ANNUAL_SAVINGS, formatPrice, PAID_PLANS, type PaidPlan } from "backend/plans";

type Props = { selected: PaidPlan; onSelect: (plan: PaidPlan) => void; current?: PaidPlan | null };

export function PlanPicker({ selected, onSelect, current }: Props) {
  const options: { id: PaidPlan; note: string; badge?: string }[] = [
    { id: "annual", note: `${formatPrice(ANNUAL_SAVINGS.perMonth)}/mo, billed yearly`, badge: `Save ${ANNUAL_SAVINGS.percent}%` },
    { id: "monthly", note: "Billed every month. Cancel anytime." },
  ];

  return (
    <div role="radiogroup" aria-label="Plan" className="grid gap-3 sm:grid-cols-2">
      {options.map(({ id, note, badge }) => {
        const plan = PAID_PLANS[id];
        const isSelected = selected === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(id)}
            className={`relative flex flex-col rounded-2xl border p-5 text-left transition-colors duration-200 ${
              isSelected ? "border-accent bg-tint shadow-[0_0_0_4px_var(--tint)]" : "border-line bg-bg hover:border-line-strong"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-semibold">{plan.name}</span>
              {current === id ? (
                <span className="chip chip-outline">Current</span>
              ) : (
                badge && <span className="chip chip-tint">{badge}</span>
              )}
            </span>
            <span className="mt-2 flex items-baseline gap-1">
              <span className="text-[28px] font-bold tracking-[-0.02em]">{formatPrice(plan.price)}</span>
              <span className="text-[14px] text-muted">/ {plan.period}</span>
            </span>
            <span className="mt-1 text-[13px] text-muted">{note}</span>
            {id === "annual" && (
              <span className="mt-3 text-[13px] font-semibold text-accent-ink">
                You save {formatPrice(ANNUAL_SAVINGS.amount)} a year vs monthly
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
