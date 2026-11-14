import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Mascot } from "@/components/Mascot";
import { LogoMark, Wordmark } from "@/components/ui";
import { WelcomeForm } from "@/components/WelcomeForm";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex items-center justify-center gap-2">
          <LogoMark size={28} />
          <Wordmark />
        </div>
        <section className="card p-8 text-center" aria-labelledby="welcome-title">
          <Mascot state="listening" size={120} />
          <h1 id="welcome-title" className="mt-4 text-[24px] font-bold leading-tight tracking-[-0.02em]">
            What should your coach call you?
          </h1>
          <WelcomeForm />
        </section>
      </div>
    </main>
  );
}
