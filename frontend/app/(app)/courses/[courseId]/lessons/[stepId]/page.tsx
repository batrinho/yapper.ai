import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { stepStatuses } from "backend/course-state";
import { getCourse, getProgress } from "backend/queries";
import { LessonView } from "@/components/course/LessonView";

type Props = PageProps<"/courses/[courseId]/lessons/[stepId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId, stepId } = await params;
  const course = await getCourse(courseId);
  return { title: course?.steps.find((step) => step.id === stepId)?.title ?? "Lesson" };
}

export default async function LessonPage({ params }: Props) {
  const [userId, { courseId, stepId }] = await Promise.all([requireUserId(), params]);
  const [course, progress] = await Promise.all([getCourse(courseId), getProgress(userId)]);
  const index = course?.steps.findIndex((step) => step.id === stepId) ?? -1;
  if (!course || index === -1 || course.steps[index].kind !== "video") notFound();

  if (stepStatuses(course, progress)[index] === "locked") redirect(`/courses/${course.id}`);
  return <LessonView course={course} index={index} />;
}
