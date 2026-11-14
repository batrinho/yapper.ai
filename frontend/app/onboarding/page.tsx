import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserContext } from "backend/queries";
import { getCurrentUser } from "@/lib/auth";
import { LogoMark, Wordmark } from "@/components/ui";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/welcome");
  if (user.onboardedAt) redirect("/");
  const context = await getUserContext(user.id);

  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-[600px]">
        <div className="mb-6 flex items-center justify-center gap-2">
          <LogoMark size={28} />
          <Wordmark />
        </div>
        <OnboardingFlow userName={user.name} savedProfile={context.profile} trialAvailable={!user.trialUsedAt} />
      </div>
    </main>
  );
}
