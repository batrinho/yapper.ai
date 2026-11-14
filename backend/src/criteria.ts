import type { PartFlags, Step } from "./db/schema";
import { structureName } from "./course-state";
import { formatClock } from "./dates";

export type LiveStats = {
  score: number | null;
  parts: PartFlags;
  fillers: number;
  speakingSec: number;
  hasSpoken: boolean;
};

export type Criterion = {
  id: "score" | "structure" | "fillers" | "duration";
  label: string;
  met: boolean;
  value: string;
};

export const NO_PARTS: PartFlags = { s: false, t: false, a: false, r: false };
export const PART_KEYS = ["s", "t", "a", "r"] as const;

const EMPTY_STATS: LiveStats = { score: null, parts: NO_PARTS, fillers: 0, speakingSec: 0, hasSpoken: false };

function durationLabel(minSec?: number, maxSec?: number): string {
  if (minSec !== undefined && maxSec !== undefined) return `Answer in ${minSec}–${maxSec} seconds`;
  if (maxSec !== undefined) return `Answer in under ${maxSec} seconds`;
  return `Speak for at least ${minSec} seconds`;
}

export function buildCriteria(step: Step, labels: string[], stats: LiveStats): Criterion[] {
  if (step.kind === "placement") return [];
  const minScore = step.minScore ?? 70;
  const { requireStructure, minSec, maxSec, maxFillers } = step.criteria ?? { requireStructure: false };
  const criteria: Criterion[] = [
    {
      id: "score",
      label: `Score ${minScore} or higher`,
      met: stats.score !== null && stats.score >= minScore,
      value: stats.score === null ? "In report" : `${stats.score}`,
    },
  ];

  if (requireStructure) {
    const found = PART_KEYS.filter((key) => stats.parts[key]).length;
    criteria.push({ id: "structure", label: `Use all four ${structureName(labels)} parts`, met: found === 4, value: `${found} of 4` });
  }

  if (maxFillers !== undefined) {
    criteria.push({
      id: "fillers",
      label: maxFillers === 0 ? "Zero filler words" : `Fewer than ${maxFillers + 1} filler words`,
      met: stats.hasSpoken && stats.fillers <= maxFillers,
      value: `${stats.fillers} so far`,
    });
  }

  if (minSec !== undefined || maxSec !== undefined) {
    criteria.push({
      id: "duration",
      label: durationLabel(minSec, maxSec),
      met: stats.speakingSec >= (minSec ?? 0) && stats.speakingSec <= (maxSec ?? Infinity),
      value: formatClock(stats.speakingSec),
    });
  }

  return criteria;
}

export function criteriaLabels(step: Step, labels: string[]): string[] {
  return buildCriteria(step, labels, EMPTY_STATS).map((criterion) => criterion.label);
}

export function passes(step: Step, labels: string[], stats: LiveStats): boolean {
  return buildCriteria(step, labels, stats).every((criterion) => criterion.met);
}

export function missingRequirements(step: Step, labels: string[], stats: LiveStats): string[] {
  const missingIndex = PART_KEYS.findIndex((key) => !stats.parts[key]);
  return buildCriteria(step, labels, stats)
    .filter((criterion) => !criterion.met)
    .map((criterion) => {
      switch (criterion.id) {
        case "score":
          return `score ${step.minScore ?? 70}+`;
        case "structure":
          return `land a clear ${labels[missingIndex] ?? "structure"}`;
        case "fillers":
          return step.criteria?.maxFillers === 0 ? "skip the filler words" : `keep fillers under ${(step.criteria?.maxFillers ?? 0) + 1}`;
        case "duration":
          return criterion.label.charAt(0).toLowerCase() + criterion.label.slice(1);
      }
    });
}
