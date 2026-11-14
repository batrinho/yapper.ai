"use client";

import Link from "next/link";
import type { Plan } from "backend/db/schema";
import type { CourseWithSteps, ProgressMap } from "backend/course-state";
import { parseDay } from "backend/dates";
import { useToday } from "@/lib/hooks";
import type { SessionSummary } from "backend/queries";
import { minutesThisWeek, WEEKLY_GOAL_MINUTES, type Streak } from "backend/stats";
import { CourseCard } from "@/components/CourseCard";
import { Page, ProgressBar } from "@/components/ui";
import { CoachNote } from "@/components/home/CoachNote";
import { ContinueHero } from "@/components/home/ContinueHero";
import { StatCards } from "@/components/home/StatCards";

type Props = {
  userName: string;
  courses: CourseWithSteps[];
  progress: ProgressMap;
  sessions: SessionSummary[];
  streak: Streak;
  latestNote: string | null;
  practiceHref: string;
  plan: Plan;
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeView({ userName, courses, progress, sessions, streak, latestNote, practiceHref, plan }: Props) {
  const today = useToday();
  const dateLabel = today ? parseDay(today).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "";
  const weekMinutes = today ? minutesThisWeek(sessions, today).total : 0;

  return (
    <Page>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className={`transition-opacity duration-300 ${today ? "opacity-100" : "opacity-0"}`}>
          <p className="h-5 text-[14px] text-muted">{dateLabel}</p>
          <h1 className="page-title mt-1">
            {today ? greeting() : "Hello"}, {userName.split(" ")[0]}
          </h1>
        </div>
        {today && (
          <div className="flex items-center gap-3 text-[14px]">
            <span className="text-muted">Weekly goal</span>
            <ProgressBar value={(weekMinutes / WEEKLY_GOAL_MINUTES) * 100} className="w-32" />
            <span className="font-bold">
              {weekMinutes} / {WEEKLY_GOAL_MINUTES} min
            </span>
          </div>
        )}
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <ContinueHero courses={courses} progress={progress} plan={plan} />
        <CoachNote userName={userName} note={latestNote} practiceHref={practiceHref} />
      </div>

      <div className="mt-6">
        <StatCards sessions={sessions} streak={streak} />
      </div>

      <section className="mt-10" aria-labelledby="courses-title">
        <div className="flex items-center justify-between">
          <h2 id="courses-title" className="section-title">
            Your courses
          </h2>
          <Link href="/courses" className="text-[15px] font-semibold text-accent-ink hover:underline">
            See all
          </Link>
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} progress={progress} />
          ))}
        </div>
      </section>
    </Page>
  );
}
