import type { CSSProperties, ReactNode } from "react";
import type { Step } from "backend/db/schema";

export function Page({ children, width = "max-w-[1100px]" }: { children: ReactNode; width?: string }) {
  return <div className={`mx-auto w-full ${width} px-4 py-6 sm:px-8 md:px-12 md:py-10`}>{children}</div>;
}

export function ProgressRing({
  value,
  size,
  stroke,
  label,
  children,
}: {
  value: number;
  size: number;
  stroke: number;
  label: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ "--ring-c": circumference } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, delayMs = 0, className = "" }: { value: number; delayMs?: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-track ${className}`}>
      <div
        className="bar-fill h-full rounded-full bg-accent"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, animationDelay: `${delayMs}ms` }}
      />
    </div>
  );
}

export function PracticeBadge({ step }: { step: Step }) {
  if (step.kind === "video") return null;
  if (step.required) return <span className="chip chip-tint">Required practice</span>;
  return <span className="chip chip-outline">Optional</span>;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-tint-2 text-[13px] font-bold text-accent-ink"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function NumberTile({ n }: { n: number }) {
  return (
    <span className="grid size-7 place-items-center rounded-md bg-tint text-[13px] font-bold text-accent-ink">{n}</span>
  );
}

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path
        d="M10 3h12a9 9 0 0 1 9 9v3a9 9 0 0 1-9 9h-7l-6 5 1.5-5.4A9 9 0 0 1 1 15v-3a9 9 0 0 1 9-9Z"
        fill="#7C5CFF"
      />
      <circle cx="12" cy="13.5" r="2.6" fill="#fff" />
      <circle cx="20" cy="13.5" r="2.6" fill="#fff" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="text-[19px] font-bold tracking-[-0.02em]">
      yapper<span className="text-accent-ink">.ai</span>
    </span>
  );
}
