import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { trialSettings } from "backend/coach-prompt";
import { starterQuestions } from "backend/onboarding";
import { getUserContext } from "backend/queries";
import { getCurrentUser } from "@/lib/auth";
import { TrialChat } from "@/components/onboarding/TrialChat";

export const metadata: Metadata = { title: "Your first chat" };

export default async function TrialPage({ searchParams }: PageProps<"/onboarding/trial">) {
  const user = await getCurrentUser();
  if (!user) redirect("/welcome");
  if (user.trialUsedAt) redirect(user.onboardedAt ? "/" : "/onboarding");

  const [{ q }, context] = await Promise.all([searchParams, getUserContext(user.id)]);
  const starters = starterQuestions(context.profile);
  const question = starters[Number(q)] ?? starters[0];

  return <TrialChat question={question} settings={trialSettings(user.name, context, question)} />;
}
