import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { getCourse, getProgress, getUserContext } from "backend/queries";
import { CourseView } from "@/components/course/CourseView";

type Props = PageProps<"/courses/[courseId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).courseId);
  return { title: course?.title ?? "Course" };
}

export default async function CoursePage({ params }: Props) {
  const [userId, { courseId }] = await Promise.all([requireUserId(), params]);
  const [course, progress, context] = await Promise.all([getCourse(courseId), getProgress(userId), getUserContext(userId)]);
  if (!course) notFound();
  return <CourseView course={course} progress={progress} latestNote={context.notes[0] ?? null} />;
}
