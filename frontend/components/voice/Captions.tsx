"use client";

import { useEffect, useState } from "react";
import type { Caption } from "@/components/voice/useVoiceAgent";

const WORD_MS = 300;

function useRevealedWords(text: string, animate: boolean): string {
  const words = text.split(" ");
  const [shown, setShown] = useState({ text, count: animate ? 1 : words.length });
  const count = shown.text === text ? shown.count : animate ? 1 : words.length;

  useEffect(() => {
    if (!animate || count >= words.length) return;
    const id = setTimeout(() => setShown({ text, count: count + 1 }), WORD_MS);
    return () => clearTimeout(id);
  }, [animate, count, text, words.length]);

  return words.slice(0, count).join(" ");
}

export function Captions({ caption, coachTalking }: { caption: Caption; coachTalking: boolean }) {
  const text = useRevealedWords(caption?.text ?? "", caption?.role === "coach" && coachTalking);
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
