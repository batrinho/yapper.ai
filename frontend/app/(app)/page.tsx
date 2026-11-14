import { requireUser, requireUserId } from "@/lib/auth";
import { nextPracticeHref } from "backend/course-state";
import { getCourses, getProgress, getRecentSessions, getUserContext } from "backend/queries";
import { HomeView } from "@/components/home/HomeView";

export default async function HomePage() {
  const userId = await requireUserId();
  const [user, courses, progress, sessions, context] = await Promise.all([
    requireUser(),
    getCourses(),
    getProgress(userId),
    getRecentSessions(userId),
    getUserContext(userId),
  ]);

  return (
    <HomeView
      userName={user.name}
      courses={courses}
      progress={progress}
      sessions={sessions}
      streak={{ current: user.currentStreak, lastPracticeDate: user.lastPracticeDate }}
      latestNote={context.notes[0] ?? null}
      practiceHref={nextPracticeHref(courses, progress)}
      plan={user.plan}
    />
  );
}
