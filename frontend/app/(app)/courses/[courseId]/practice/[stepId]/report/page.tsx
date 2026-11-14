import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { stepStatuses } from "backend/course-state";
import { getCourse, getPracticeSession, getProgress } from "backend/queries";
import { ReportView } from "@/components/report/ReportView";

export const metadata: Metadata = { title: "Practice report" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ReportPage({ params, searchParams }: PageProps<"/courses/[courseId]/practice/[stepId]/report">) {
  const [userId, { courseId, stepId }, { session: sessionId }] = await Promise.all([requireUserId(), params, searchParams]);
  if (typeof sessionId !== "string" || !UUID.test(sessionId)) notFound();

  const [course, session, progress] = await Promise.all([getCourse(courseId), getPracticeSession(userId, sessionId), getProgress(userId)]);
  const index = course?.steps.findIndex((step) => step.id === stepId) ?? -1;
  if (!course || index === -1 || !session || session.stepId !== stepId) notFound();

  const statuses = stepStatuses(course, progress);
  const nextOpen = session.passed && index + 1 < course.steps.length && statuses[index + 1] !== "locked";

  return (
    <ReportView
      course={course}
      index={index}
      session={{ ...session, createdAt: session.createdAt.toISOString() }}
      nextOpen={nextOpen}
      passedBefore={progress[stepId]?.status === "done"}
    />
  );
}
