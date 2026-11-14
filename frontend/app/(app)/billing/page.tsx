import type { Metadata } from "next";
import { freePracticesLeft } from "backend/plans";
import { getAttemptsUsed } from "backend/queries";
import { requireUser, requireUserId } from "@/lib/auth";
import { BillingView } from "@/components/billing/BillingView";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const userId = await requireUserId();
  const [user, attemptsUsed] = await Promise.all([requireUser(), getAttemptsUsed(userId)]);

  return (
    <BillingView
      plan={user.plan}
      renewsAt={user.planRenewsAt?.toISOString() ?? null}
      freeLeft={freePracticesLeft(user.plan, attemptsUsed)}
    />
  );
}
