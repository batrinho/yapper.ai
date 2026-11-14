import type { Metadata } from "next";
import { requireUser, requireUserId } from "@/lib/auth";
import { getCourses, getProgress, getRecentSessions, getSessionCount } from "backend/queries";
import { ProgressView } from "@/components/pages/ProgressView";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressPage() {
  const userId = await requireUserId();
  const [user, courses, progress, sessions, sessionCount] = await Promise.all([
    requireUser(),
    getCourses(),
    getProgress(userId),
    getRecentSessions(userId),
    getSessionCount(userId),
  ]);

  return (
    <ProgressView
      courses={courses}
      progress={progress}
      sessions={sessions}
      sessionCount={sessionCount}
      streak={{ current: user.currentStreak, lastPracticeDate: user.lastPracticeDate }}
      bestStreak={user.bestStreak}
    />
  );
}
