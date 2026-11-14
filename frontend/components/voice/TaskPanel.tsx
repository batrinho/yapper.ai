"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { PartFlags, Step } from "backend/db/schema";
import { PART_KEYS, type Criterion } from "backend/criteria";
import type { Line } from "@/components/voice/useVoiceAgent";
import { splitFillers } from "backend/speech";

export function HighlightedText({ text }: { text: string }) {
  return (
    <>
      {splitFillers(text).map((part, i) =>
        part.filler ? (
          <mark key={i} className="filler">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function StructureTiles({ labels, parts, active }: { labels: string[]; parts: PartFlags; active: boolean }) {
  const nextIndex = PART_KEYS.findIndex((key) => !parts[key]);
  return (
    <span className="flex gap-1" aria-hidden>
      {labels.map((label, i) => {
        const style = parts[PART_KEYS[i]]
          ? "bg-accent text-white"
          : active && i === nextIndex
            ? "tile-progress bg-tint-2 text-accent-ink"
            : "bg-track text-muted";
        return (
          <span key={label} title={label} className={`grid size-6 place-items-center rounded-md text-[11px] font-bold ${style}`}>
            {label[0]}
          </span>
        );
      })}
    </span>
  );
}

function CriterionRow({ criterion, labels, parts, active }: { criterion: Criterion; labels: string[]; parts: PartFlags; active: boolean }) {
  return (
    <li className="flex items-center gap-3 text-[15px]">
      <span
        className={`grid size-[22px] shrink-0 place-items-center rounded-full transition-colors duration-300 ${
          criterion.met ? "bg-accent text-white" : "border-[1.5px] border-line-strong"
        }`}
      >
        {criterion.met && <Check size={13} strokeWidth={3} aria-hidden />}
        <span className="sr-only">{criterion.met ? "Met:" : "Pending:"}</span>
      </span>
      <span className="min-w-0 flex-1">{criterion.label}</span>
      {criterion.id === "structure" ? (
        <StructureTiles labels={labels} parts={parts} active={active} />
      ) : (
        <span className={`shrink-0 font-semibold ${criterion.met && criterion.id === "score" ? "text-accent-ink" : "text-muted"}`}>
          {criterion.value}
        </span>
      )}
    </li>
  );
}

type Props = {
  step: Step;
  labels: string[];
  attempt: number;
  criteria: Criterion[];
  parts: PartFlags;
  lines: Line[];
  speaking: string;
  live: boolean;
};

export function TaskPanel({ step, labels, attempt, criteria, parts, lines: turns, speaking, live }: Props) {
  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <section className="card p-6" aria-labelledby="task-title">
        <div className="flex items-center justify-between text-[13px] text-muted">
          <h2 id="task-title">Your task</h2>
          <span>Attempt {attempt}</span>
        </div>
        <p className="mt-3 text-[20px] font-bold leading-snug tracking-[-0.01em]">&ldquo;{step.taskQuestion}&rdquo;</p>
        <hr className="my-5 border-line" />
        <h3 className="text-[13px] text-muted">{criteria.length ? "To pass" : "No pass mark"}</h3>
        {criteria.length === 0 && (
          <p className="mt-2 text-[15px] text-muted">Just answer naturally. Your coach is listening for where you&rsquo;re starting.</p>
        )}
        <ul className="mt-3 flex flex-col gap-3" aria-live="polite">
          {criteria.map((criterion) => (
            <CriterionRow key={criterion.id} criterion={criterion} labels={labels} parts={parts} active={live} />
          ))}
        </ul>
      </section>

      <Transcript lines={turns} speaking={speaking} live={live} />
    </aside>
  );
}

export function Transcript({ lines: turns, speaking, live }: { lines: Line[]; speaking: string; live: boolean }) {
  const [open, setOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, speaking]);

  return (
    <section className="card flex min-h-0 flex-1 flex-col" aria-labelledby="transcript-title">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-2">
          <h2 id="transcript-title" className="text-[17px] font-bold">
            Transcript
          </h2>
          {live && (
            <span className="chip chip-tint h-[22px] px-2">
              <span className="status-dot size-1.5 rounded-full bg-accent" aria-hidden />
              Live
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="transcript-body"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[14px] text-muted hover:bg-surface-2 hover:text-text"
        >
          {open ? "Hide" : "Show"}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
            aria-hidden
          />
        </button>
      </div>
      {open && (
        <div
          id="transcript-body"
          ref={scrollRef}
          className="flex max-h-[420px] min-h-[160px] flex-col gap-4 overflow-y-auto px-6 py-5 text-[15px] leading-relaxed"
        >
          {turns.length === 0 && !speaking && (
            <p className="text-muted">Your conversation will show up here as you talk.</p>
          )}
          {turns.map((turn, i) => (
            <div key={i}>
              <p className={`text-[13px] font-semibold ${turn.role === "coach" ? "text-accent-ink" : "text-faint"}`}>
                {turn.role === "coach" ? "Coach" : "You"}
              </p>
              <p className={turn.role === "coach" ? "" : "text-muted"}>
                {turn.role === "user" ? <HighlightedText text={turn.text} /> : turn.text}
              </p>
            </div>
          ))}
          {speaking && (
            <div>
              <p className="text-[13px] font-semibold text-faint">You · speaking</p>
              <p>
                <HighlightedText text={speaking} />
                <span className="caret" aria-hidden />
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
