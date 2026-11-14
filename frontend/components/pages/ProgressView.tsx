import Link from "next/link";
import { courseSummary, type CourseWithSteps, type ProgressMap } from "backend/course-state";
import type { SkillProfile as Profile } from "backend/db/schema";
import type { SessionSummary } from "backend/queries";
import type { Streak } from "backend/stats";
import { CourseCard } from "@/components/CourseCard";
import { StatCards } from "@/components/home/StatCards";
import { SkillProfile } from "@/components/progress/SkillProfile";
import { Page } from "@/components/ui";

type Props = {
  courses: CourseWithSteps[];
  progress: ProgressMap;
  sessions: SessionSummary[];
  sessionCount: number;
  streak: Streak;
  bestStreak: number;
  skills: Profile | null;
};

export function ProgressView({ courses, progress, sessions, sessionCount, streak, bestStreak, skills }: Props) {
  const finished = courses.reduce((sum, course) => sum + courseSummary(course, progress).finished, 0);

  return (
    <Page>
      <h1 className="page-title">Progress</h1>
      <p className="mt-2 text-[16px] text-muted">Your speaking skills, streak, speaking time and filler rate, all in one place.</p>

      <div className="mt-8">
        <SkillProfile profile={skills} />
      </div>

      <dl className="mt-6 grid gap-6 sm:grid-cols-3">
        {[
          { label: "Practice sessions", value: sessionCount },
          { label: "Steps finished", value: finished },
          { label: "Best streak", value: `${bestStreak} day${bestStreak === 1 ? "" : "s"}` },
        ].map((item) => (
          <div key={item.label} className="card p-6">
            <dt className="text-[15px] font-medium">{item.label}</dt>
            <dd className="mt-3 text-[32px] font-bold leading-none tracking-[-0.02em]">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        <StatCards sessions={sessions} streak={streak} />
      </div>

      <section className="mt-10" aria-labelledby="by-course">
        <h2 id="by-course" className="section-title">
          By course
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} progress={progress} />
          ))}
        </div>
        {sessionCount === 0 && (
          <p className="mt-6 text-[15px] text-muted">
            No sessions yet.{" "}
            <Link href="/" className="font-semibold text-accent-ink hover:underline">
              Start your first lesson
            </Link>
          </p>
        )}
      </section>
    </Page>
  );
}
