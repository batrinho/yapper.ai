import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser, requireUserId } from "@/lib/auth";
import { nextPracticeHref } from "backend/course-state";
import { getCourses, getProgress } from "backend/queries";
import { Shell } from "@/components/Shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userId = await requireUserId();
  const [user, courses, progress] = await Promise.all([requireUser(), getCourses(), getProgress(userId)]);
  if (!user.onboardedAt) redirect("/onboarding");

  return (
    <Shell
      userName={user.name}
      streak={{ current: user.currentStreak, lastPracticeDate: user.lastPracticeDate }}
      practiceHref={nextPracticeHref(courses, progress)}
    >
      {children}
    </Shell>
  );
}
