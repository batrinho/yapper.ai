import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { courseDuration, courseSummary, lessonCount, upNextLabel, type CourseWithSteps, type ProgressMap } from "backend/course-state";
import { ProgressRing } from "@/components/ui";

export function CourseCard({ course, progress }: { course: CourseWithSteps; progress: ProgressMap }) {
  const summary = courseSummary(course, progress);
  const next = summary.current;

  return (
    <Link href={`/courses/${course.id}`} className="card card-link flex flex-col p-6">
      <div className="flex items-center gap-4">
        <ProgressRing value={summary.percent} size={56} stroke={5} label={`${summary.percent}% complete`}>
          <span className="text-[13px] font-bold">{summary.percent}%</span>
        </ProgressRing>
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold leading-snug">{course.title}</h3>
          <p className="text-[14px] text-muted">
            {lessonCount(course)} lessons · {courseDuration(course)}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-muted">{next ? upNextLabel(next) : "Course complete"}</p>
          <p className="truncate text-[15px] font-medium">{next ? next.title : "Review any lesson"}</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
      </div>
    </Link>
  );
}
