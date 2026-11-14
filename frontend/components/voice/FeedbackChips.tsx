import type { ReactNode } from "react";
import type { PartFlags } from "backend/db/schema";
import { PART_KEYS } from "backend/criteria";
import { formatBreakdown, type FillerCount } from "backend/speech";

type Chip = { label: string; value: ReactNode; detail?: string; good: boolean };

type Props = {
  labels: string[];
  wpm: number;
  fillers: FillerCount;
  maxFillers: number;
  parts: PartFlags;
  wordsPerSentence: number | null;
};

function clarityLabel(wordsPerSentence: number | null): string {
  if (wordsPerSentence === null) return "–";
  return wordsPerSentence <= 24 ? "Clear" : "Wordy";
}

export function FeedbackChips({ labels, wpm, fillers, maxFillers, parts, wordsPerSentence }: Props) {
  const chips: Chip[] = [
    { label: "Pace", value: wpm ? `${wpm} wpm` : "–", good: wpm >= 120 && wpm <= 160 },
    {
      label: "Filler words",
      value: fillers.total,
      detail: fillers.total ? formatBreakdown(fillers) : undefined,
      good: fillers.total <= maxFillers,
    },
    {
      label: "Structure",
      value: (
        <span>
          {labels.map((label, i) => (
            <span key={label} className={parts[PART_KEYS[i]] ? "font-bold" : "font-normal text-faint"}>
              {i > 0 && " · "}
              {label[0]}
            </span>
          ))}
        </span>
      ),
      good: PART_KEYS.every((key) => parts[key]),
    },
    { label: "Clarity", value: clarityLabel(wordsPerSentence), good: wordsPerSentence !== null && wordsPerSentence <= 24 },
  ];

  return (
    <ul className="flex flex-wrap justify-center gap-2" aria-label="Live feedback">
      {chips.map((chip, i) => (
        <li
          key={chip.label}
          className="fade-up flex h-[34px] items-center gap-2 rounded-full border border-line bg-bg px-3.5 text-[14px]"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span
            aria-hidden
            className={`size-2 rounded-full ${chip.good ? "bg-accent" : "border-[1.5px] border-muted"}`}
          />
          <span className="text-muted">{chip.label}</span>
          <span className="font-bold">{chip.value}</span>
          {chip.detail && <span className="text-muted">{chip.detail}</span>}
          <span className="sr-only">{chip.good ? "(good)" : "(watch)"}</span>
        </li>
      ))}
    </ul>
  );
}
