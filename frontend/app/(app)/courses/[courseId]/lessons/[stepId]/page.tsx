import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser, requireUserId } from "@/lib/auth";
import { stepStatuses } from "backend/course-state";
import { needsSubscription } from "backend/plans";
import { getCourse, getProgress } from "backend/queries";
import { ProGate } from "@/components/billing/ProGate";
import { LessonView } from "@/components/course/LessonView";

type Props = PageProps<"/courses/[courseId]/lessons/[stepId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId, stepId } = await params;
  const course = await getCourse(courseId);
  return { title: course?.steps.find((step) => step.id === stepId)?.title ?? "Lesson" };
}

export default async function LessonPage({ params }: Props) {
  const [userId, { courseId, stepId }] = await Promise.all([requireUserId(), params]);
  const [user, course, progress] = await Promise.all([requireUser(), getCourse(courseId), getProgress(userId)]);
  const index = course?.steps.findIndex((step) => step.id === stepId) ?? -1;
  if (!course || index === -1 || course.steps[index].kind !== "video") notFound();

  if (stepStatuses(course, progress)[index] === "locked") redirect(`/courses/${course.id}`);
  if (needsSubscription(user.plan, course.steps, index)) {
    return <ProGate title={course.steps[index].title} backHref={`/courses/${course.id}`} />;
  }
  return <LessonView course={course} index={index} />;
}
