"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { Play, WifiOff } from "lucide-react";
import type { Step } from "backend/db/schema";

function subscribeOnline(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

export function VideoPlayer({ step, lesson, onPlay }: { step: Step; lesson: number; onPlay: () => void }) {
  const [playing, setPlaying] = useState(false);
  const online = useOnline();

  if (!step.youtubeId) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-2xl border border-line bg-surface-2 text-[15px] text-muted">
        This lesson&rsquo;s video is coming soon.
      </div>
    );
  }

  if (playing && online) {
    return (
      <iframe
        className="aspect-video w-full rounded-2xl border border-line bg-black"
        src={`https://www.youtube-nocookie.com/embed/${step.youtubeId}?autoplay=1&rel=0`}
        title={step.title}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  const play = () => {
    if (!online) return;
    setPlaying(true);
    onPlay();
  };

  return (
    <button
      type="button"
      onClick={play}
      aria-label={online ? `Play lesson: ${step.title}` : "Video unavailable offline"}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-line bg-[var(--poster)] text-left text-white"
    >
      <Image
        src={`https://i.ytimg.com/vi/${step.youtubeId}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(min-width: 1024px) 760px, 100vw"
        className="object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-70"
        priority
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" aria-hidden />
      <span className="absolute left-5 top-4 rounded-md bg-black/50 px-2 py-1 text-[13px] font-semibold sm:left-7 sm:top-6">
        {step.durationMin} min
      </span>
      <span className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c9bcff] sm:text-[13px]">Lesson {lesson}</span>
        <span className="mt-1 block text-[22px] font-bold leading-tight tracking-[-0.02em] sm:text-[32px]">{step.title}</span>
      </span>
      <span className="absolute inset-0 grid place-items-center">
        {online ? (
          <span className="grid size-16 place-items-center rounded-full bg-white shadow-lg transition-transform duration-200 group-hover:scale-105 sm:size-20">
            <Play size={26} className="ml-1 fill-accent text-accent" aria-hidden />
          </span>
        ) : (
          <span className="flex max-w-xs flex-col items-center gap-2 rounded-xl bg-black/70 px-5 py-4 text-center text-[14px]">
            <WifiOff size={22} aria-hidden />
            You&rsquo;re offline. The video will load when you&rsquo;re back online.
          </span>
        )}
      </span>
    </button>
  );
}
