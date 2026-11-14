"use client";

import type { CoachId } from "backend/coach-prompt";
import { setCoach, usePreferences } from "@/lib/preferences";
import { JensenAvatar } from "@/components/JensenAvatar";
import { Mascot } from "@/components/Mascot";

const COACH_OPTIONS: { id: CoachId; name: string; detail: string; Avatar: typeof Mascot }[] = [
  { id: "yap", name: "Yap", detail: "Purple speech bubble · warm female voice", Avatar: Mascot },
  { id: "jensen", name: "Jensen", detail: "Glasses and a leather jacket · deep male voice", Avatar: JensenAvatar },
];

export function CoachChoice({ labelledBy }: { labelledBy: string }) {
  const { coach } = usePreferences();
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid gap-3 sm:grid-cols-2">
      {COACH_OPTIONS.map(({ id, name, detail, Avatar }) => {
        const selected = coach === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setCoach(id)}
            className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors duration-200 ${
              selected ? "border-accent bg-tint shadow-[0_0_0_4px_var(--tint)]" : "border-line hover:border-line-strong"
            }`}
          >
            <Avatar state={selected ? "celebrating" : "listening"} size={64} className="!mx-0 shrink-0" />
            <span className="min-w-0">
              <span className="block text-[16px] font-bold">{name}</span>
              <span className="block text-[14px] text-muted">{detail}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
