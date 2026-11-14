import type { Metadata } from "next";
import { requireUserId } from "@/lib/auth";
import { getCourses, getProgress } from "backend/queries";
import { CourseCard } from "@/components/CourseCard";
import { Page } from "@/components/ui";

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesPage() {
  const userId = await requireUserId();
  const [courses, progress] = await Promise.all([getCourses(), getProgress(userId)]);

  return (
    <Page>
      <h1 className="page-title">Courses</h1>
      <p className="mt-2 max-w-xl text-[16px] text-muted">
        Short lectures, then practice out loud with your coach. Required practices unlock the next lesson.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} progress={progress} />
        ))}
      </div>
    </Page>
  );
}
