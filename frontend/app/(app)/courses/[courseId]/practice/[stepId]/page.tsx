import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser, requireUserId } from "@/lib/auth";
import { coachSettings } from "backend/coach-prompt";
import { lessonBefore, lessonNumber, stepHref, stepStatuses } from "backend/course-state";
import { freePracticesLeft } from "backend/plans";
import { getAttemptCount, getAttemptsUsed, getCourse, getProgress, getUserContext } from "backend/queries";
import { VoiceChat } from "@/components/voice/VoiceChat";

type Props = PageProps<"/courses/[courseId]/practice/[stepId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId, stepId } = await params;
  const course = await getCourse(courseId);
  return { title: course?.steps.find((step) => step.id === stepId)?.title ?? "Practice" };
}

export default async function PracticePage({ params }: Props) {
  const [userId, { courseId, stepId }] = await Promise.all([requireUserId(), params]);
  const [user, course, progress, context, attempts, attemptsUsed] = await Promise.all([
    requireUser(),
    getCourse(courseId),
    getProgress(userId),
    getUserContext(userId),
    getAttemptCount(userId, stepId),
    getAttemptsUsed(userId),
  ]);
  const index = course?.steps.findIndex((step) => step.id === stepId) ?? -1;
  if (!course || index === -1 || course.steps[index].kind === "video") notFound();
  if (stepStatuses(course, progress)[index] === "locked") redirect(`/courses/${course.id}`);

  const step = course.steps[index];
  const lecture = lessonBefore(course, index);
  const settings = coachSettings(course, step, lecture?.step.title ?? course.title, user.name, context);

  return (
    <VoiceChat
      key={step.id}
      course={course}
      step={step}
      settings={settings}
      attempt={attempts + 1}
      freeLeft={freePracticesLeft(user.plan, attemptsUsed)}
      lessonLabel={lecture ? `Lesson ${lessonNumber(course, lecture.index)}` : null}
      backHref={lecture ? stepHref(course.id, lecture.step) : `/courses/${course.id}`}
    />
  );
}
