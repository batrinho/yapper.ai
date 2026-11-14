"use client";

import type { Ref } from "react";
import { usePreferences } from "@/lib/preferences";
import { JensenAvatar } from "@/components/JensenAvatar";
import { Mascot, type MascotState } from "@/components/Mascot";

type Props = { state: MascotState; size: number; className?: string; ref?: Ref<HTMLDivElement> };

export function CoachAvatar(props: Props) {
  const { coach } = usePreferences();
  return coach === "jensen" ? <JensenAvatar {...props} /> : <Mascot {...props} />;
}
