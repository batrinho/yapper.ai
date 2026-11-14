"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { MascotState } from "@/components/Mascot";

const BAR_COUNT = 44;
const envelope = (i: number) => Math.sin((Math.PI * (i + 0.5)) / BAR_COUNT);

export function Waveform({ mood, levelRef }: { mood: MascotState; levelRef: RefObject<number> }) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const bars = barsRef.current;
    if (mood !== "listening" && mood !== "talking") {
      bars.forEach((bar) => bar?.style.removeProperty("transform"));
      return;
    }
    let frame = 0;
    let tick = 0;
    const draw = () => {
      tick += 1;
      const level = levelRef.current;
      bars.forEach((bar, i) => {
        if (!bar) return;
        const jitter = 0.6 + 0.4 * Math.abs(Math.sin(tick * 0.09 + i * 1.7));
        bar.style.transform = `scaleY(${Math.min(1, Math.max(0.1, level * jitter * 1.8))})`;
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [mood, levelRef]);

  return (
    <div className="flex h-12 w-full max-w-[420px] items-center justify-center gap-[5px]" aria-hidden>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <span key={i} className="flex h-full items-center">
          <span
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className="bar block"
            style={{ height: `${Math.round(28 + 72 * envelope(i))}%` }}
          />
        </span>
      ))}
    </div>
  );
}
