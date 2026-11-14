import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Plan } from "backend/db/schema";

export function usePlanCheckout(onDone?: () => void) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function choose(plan: Plan) {
    setStatus("saving");
    const response = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    }).catch(() => null);
    if (!response?.ok) {
      setStatus("error");
      return;
    }
    setStatus("idle");
    onDone?.();
    router.refresh();
  }

  return { status, choose };
}
