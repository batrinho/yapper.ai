import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Plan } from "backend/db/schema";

/**
 * Saves a plan. Buying or switching to a paid plan lands on the success screen,
 * which links back to `returnTo` (the page that showed the paywall).
 */
export function usePlanCheckout(returnTo?: string) {
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
    if (plan === "free") {
      setStatus("idle");
      router.refresh();
      return;
    }
    const params = new URLSearchParams(returnTo ? { next: returnTo } : {});
    router.push(`/billing/success${params.size ? `?${params}` : ""}`);
  }

  return { status, choose };
}
