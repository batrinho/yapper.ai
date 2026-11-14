import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  courseSummary,
  lessonBefore,
  lessonCount,
  lessonNumber,
  stepHref,
  stepName,
  type CourseWithSteps,
  type ProgressMap,
} from "backend/course-state";
import { FrameworkTiles } from "@/components/FrameworkTiles";
import { ProgressBar } from "@/components/ui";

type Action = { label: string; href: string };
type HeroContent = { chip: string; course: CourseWithSteps; title: string; copy: string; lesson: number; percent: number; primary: Action; secondary?: Action };

function pickCourse(courses: CourseWithSteps[], progress: ProgressMap) {
  const open = courses.filter((course) => courseSummary(course, progress).current);
  return open.find((course) => courseSummary(course, progress).finished > 0) ?? open[0];
}

function heroContent(courses: CourseWithSteps[], progress: ProgressMap): HeroContent | null {
  const course = pickCourse(courses, progress);
  if (!course) return null;

  const summary = courseSummary(course, progress);
  const index = summary.currentIndex;
  const step = course.steps[index];
  const base = { course, percent: summary.percent, lesson: Math.max(1, lessonNumber(course, index)) };

  if (Object.keys(progress).length === 0) {
    return {
      ...base,
      chip: "Start here",
      title: "Start your first lesson",
      copy: "Watch a short lecture, then practice out loud with your coach. It takes about ten minutes.",
      primary: { label: "Watch lesson", href: stepHref(course.id, step) },
    };
  }

  if (step.kind === "video") {
    return {
      ...base,
      chip: "Continue",
      title: step.title,
      copy: `Next up: a ${step.durationMin}-minute lecture${step.speakerRole ? ` from ${step.speakerRole.split(",")[0]}` : ""}.`,
      primary: { label: "Watch lesson", href: stepHref(course.id, step) },
    };
  }

  const lecture = lessonBefore(course, index);
  const passLine = !step.required
    ? "It's optional, so skip it if you like."
    : step.kind === "final"
      ? "Pass it to complete the course."
      : `Pass it to unlock ${index + 1 < course.steps.length ? stepName(course, index + 1) : "the next step"}.`;

  return {
    ...base,
    chip: "Continue",
    title: lecture?.step.title ?? step.title,
    copy: `${lecture ? "You finished the lecture. " : ""}Next: a ${step.durationMin}-minute voice practice. ${passLine}`,
    primary: { label: "Practice with coach", href: stepHref(course.id, step) },
    secondary: lecture ? { label: "Rewatch lecture", href: stepHref(course.id, lecture.step) } : undefined,
  };
}

export function ContinueHero({ courses, progress }: { courses: CourseWithSteps[]; progress: ProgressMap }) {
  const hero = heroContent(courses, progress);

  if (!hero) {
    return (
      <section className="card flex flex-col justify-center p-7 lg:min-h-[360px]">
        <span className="chip chip-tint w-fit">All done</span>
        <h2 className="mt-4 text-[26px] font-bold tracking-[-0.02em]">You finished every course</h2>
        <p className="mt-2 max-w-md text-[16px] text-muted">Keep your streak alive with another practice, or revisit any lesson.</p>
        <Link href="/courses" className="btn btn-primary mt-6 w-fit">
          Review courses
        </Link>
      </section>
    );
  }

  return (
    <section className="card grid overflow-hidden md:grid-cols-[1.4fr_1fr]" aria-labelledby="continue-title">
      <div className="flex flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip chip-tint">{hero.chip}</span>
          <span className="text-[14px] text-muted">{hero.course.title}</span>
        </div>
        <h2 id="continue-title" className="mt-5 text-[26px] font-bold leading-tight tracking-[-0.02em]">
          {hero.title}
        </h2>
        <p className="mt-2 text-[16px] leading-relaxed text-muted">{hero.copy}</p>
        <div className="mt-6">
          <div className="flex justify-between text-[14px]">
            <span className="text-muted">
              Lesson {hero.lesson} of {lessonCount(hero.course)}
            </span>
            <span className="font-bold">{hero.percent}%</span>
          </div>
          <ProgressBar value={hero.percent} className="mt-2" />
        </div>
        <div className="mt-7 flex flex-col items-start gap-2">
          <Link href={hero.primary.href} className="btn btn-primary">
            {hero.primary.label}
            <ArrowRight size={18} aria-hidden />
          </Link>
          {hero.secondary && (
            <Link href={hero.secondary.href} className="btn btn-ghost">
              {hero.secondary.label}
            </Link>
          )}
        </div>
      </div>
      <div className="hidden place-items-center bg-tint p-7 md:grid">
        <FrameworkTiles labels={hero.course.structureLabels} />
      </div>
    </section>
  );
}
