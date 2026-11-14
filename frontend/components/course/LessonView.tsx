"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, CircleCheck, Lock, Mic } from "lucide-react";
import type { Step } from "backend/db/schema";
import { lessonNumber, stepHref, stepName, type CourseWithSteps } from "backend/course-state";
import { criteriaLabels } from "backend/criteria";
import { Mascot } from "@/components/Mascot";
import { Avatar, initials, NumberTile, Page, PracticeBadge } from "@/components/ui";
import { VideoPlayer } from "@/components/course/VideoPlayer";

type Leave = (href: string, skipPractice?: boolean) => void;

function updateStep(stepId: string, status: "done" | "skipped") {
  return fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stepId, status }),
  });
}

function PracticeCta({ course, practice, afterIndex, onLeave }: { course: CourseWithSteps; practice: Step; afterIndex: number; onLeave: Leave }) {
  const after = course.steps[afterIndex];
  const footnote = !practice.required
    ? "Extra reps. Skipping won't lock anything."
    : after
      ? `Passing unlocks ${stepName(course, afterIndex)}`
      : "Passing completes the course";

  return (
    <section className="card bg-surface p-6" aria-labelledby="cta-title">
      <div className="flex items-start justify-between gap-3">
        <Mascot state="listening" size={72} className="!mx-0" />
        <PracticeBadge step={practice} />
      </div>
      <p className="mt-4 text-[13px] text-muted">Practice · Voice · {practice.durationMin} min</p>
      <h2 id="cta-title" className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.02em]">
        {practice.title}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">Your coach asks: &ldquo;{practice.taskQuestion}&rdquo;</p>
      <div className="mt-5 rounded-xl border border-line bg-bg p-4">
        <p className="text-[13px] font-medium text-muted">To pass</p>
        <ul className="mt-2 flex flex-col gap-2">
          {criteriaLabels(practice, course.structureLabels).map((label) => (
            <li key={label} className="flex items-center gap-2.5 text-[15px]">
              <CircleCheck size={18} className="shrink-0 text-accent" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={() => onLeave(stepHref(course.id, practice))} className="btn btn-primary mt-5 h-[52px] w-full text-[17px]">
        <Mic size={20} aria-hidden />
        Practice with coach
      </button>
      {!practice.required && (
        <button
          type="button"
          onClick={() => onLeave(after ? stepHref(course.id, after) : `/courses/${course.id}`, true)}
          className="btn btn-ghost mt-2 w-full"
        >
          Skip for now
        </button>
      )}
      <p className="mt-4 flex items-start gap-2 text-[13px] text-muted">
        <Lock size={14} className="mt-0.5 shrink-0" aria-hidden />
        {footnote}
      </p>
    </section>
  );
}

function NextLessonCta({ course, nextIndex, onLeave }: { course: CourseWithSteps; nextIndex: number; onLeave: Leave }) {
  const next = course.steps[nextIndex];
  return (
    <section className="card bg-surface p-6" aria-labelledby="cta-title">
      <Mascot state="listening" size={72} className="!mx-0" />
      <p className="mt-4 text-[13px] text-muted">{next ? "Up next" : "Course complete"}</p>
      <h2 id="cta-title" className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.02em]">
        {next ? `${stepName(course, nextIndex)} · ${next.title}` : course.title}
      </h2>
      <button
        type="button"
        onClick={() => onLeave(next ? stepHref(course.id, next) : `/courses/${course.id}`)}
        className="btn btn-primary mt-5 h-[52px] w-full text-[17px]"
      >
        {next ? "Next lesson" : "Back to course"}
        <ArrowRight size={18} aria-hidden />
      </button>
    </section>
  );
}

export function LessonView({ course, index }: { course: CourseWithSteps; index: number }) {
  const router = useRouter();
  const step = course.steps[index];
  const next = course.steps[index + 1];
  const lesson = lessonNumber(course, index);

  const markWatched = () => updateStep(step.id, "done");
  const leave: Leave = async (href, skipPractice = false) => {
    await markWatched();
    if (skipPractice && next) await updateStep(next.id, "skipped");
    router.push(href);
    router.refresh();
  };

  return (
    <Page width="max-w-[1160px]">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[14px] text-muted">
        <Link href="/courses" className="hover:text-text">
          Courses
        </Link>
        <ChevronRight size={14} aria-hidden />
        <Link href={`/courses/${course.id}`} className="hover:text-text">
          {course.title}
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span className="font-medium text-text" aria-current="page">
          Lesson {lesson}
        </span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_332px]">
        <article className="min-w-0">
          <VideoPlayer step={step} lesson={lesson} onPlay={markWatched} />
          <h1 className="page-title mt-6">{step.title}</h1>
          {step.speakerName && (
            <div className="mt-3 flex items-center gap-3">
              <Avatar initials={initials(step.speakerRole?.includes(",") ? step.speakerRole.split(",")[0] : step.speakerName)} size={44} />
              <div>
                <p className="text-[16px] font-semibold">{step.speakerName}</p>
                <p className="text-[14px] text-muted">{step.speakerRole}</p>
              </div>
            </div>
          )}

          {step.takeaways && step.takeaways.length > 0 && (
            <>
              <h2 className="section-title mt-8">{step.takeaways.length} key takeaways</h2>
              <ol className="mt-4 grid gap-4 md:grid-cols-3">
                {step.takeaways.map((takeaway, i) => (
                  <li key={takeaway.title} className="card p-5">
                    <NumberTile n={i + 1} />
                    <h3 className="mt-3 text-[16px] font-bold leading-snug">{takeaway.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{takeaway.body}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </article>

        <div className="lg:sticky lg:top-8 lg:self-start">
          {next && next.kind !== "video" ? (
            <PracticeCta course={course} practice={next} afterIndex={index + 2} onLeave={leave} />
          ) : (
            <NextLessonCta course={course} nextIndex={index + 1} onLeave={leave} />
          )}
        </div>
      </div>
    </Page>
  );
}
