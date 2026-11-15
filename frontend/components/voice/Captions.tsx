"use client";

import { useEffect, useState } from "react";
import type { Caption } from "@/components/voice/useVoiceAgent";

/** Pace used until the caption's audio length is known (Aura voices speak about 160 words a minute). */
const DEFAULT_WORD_MS = 375;
const TICK_MS = 80;

/** Reveals a coach caption word by word, timed to when its audio started and how long it lasts. */
function useRevealedText(caption: Caption): string {
  const startsAt = caption?.role === "coach" ? caption.startsAt : undefined;
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (startsAt === undefined) return;
    const id = setInterval(() => setNow(performance.now()), TICK_MS);
    return () => clearInterval(id);
  }, [startsAt]);

  if (!caption) return "";
  if (startsAt === undefined) return caption.text;
  const words = caption.text.split(" ");
  const wordMs = caption.durationMs ? caption.durationMs / words.length : DEFAULT_WORD_MS;
  const count = Math.floor((now - startsAt) / wordMs) + 1;
  return words.slice(0, Math.min(words.length, Math.max(1, count))).join(" ");
}

export function Captions({ caption }: { caption: Caption }) {
  const text = useRevealedText(caption);
  if (!caption) return <div className="h-[72px]" aria-hidden />;

  return (
    <div className="flex h-[72px] w-full max-w-[560px] flex-col items-center justify-center text-center" aria-live="off">
      <p className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${caption.role === "coach" ? "text-accent-ink" : "text-faint"}`}>
        {caption.role === "coach" ? "Coach" : "You"}
      </p>
      <p className="mt-1 line-clamp-2 text-[17px] font-medium leading-snug">{text}</p>
    </div>
  );
}
