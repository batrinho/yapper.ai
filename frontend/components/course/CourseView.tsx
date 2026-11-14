import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Clock, Flag, Gauge, Lock, Mic, SkipForward, SquarePlay } from "lucide-react";
import { Fragment } from "react";
import type { Plan, Step } from "backend/db/schema";
import { freeStepCount, isPaid } from "backend/plans";
import {
  courseDuration,
  courseSummary,
  isOptional,
  lessonCount,
  passSummary,
  practiceCount,
  stepHref,
  type CourseWithSteps as Course,
  type ProgressMap as Progress,
  startingLevel,
  type StepStatus,
} from "backend/course-state";
import { CoachAvatar } from "@/components/CoachAvatar";
import { Page, PracticeBadge, ProgressRing } from "@/components/ui";

function StepIcon({ step, size = 18 }: { step: Step; size?: number }) {
  if (step.kind === "video") return <SquarePlay size={size} strokeWidth={1.75} aria-hidden />;
  if (step.kind === "final") return <Flag size={size} strokeWidth={1.75} aria-hidden />;
  if (step.kind === "placement") return <Gauge size={size} strokeWidth={1.75} aria-hidden />;
  return <Mic size={size} strokeWidth={1.75} aria-hidden />;
}

function overline(step: Step, status: StepStatus): string {
  return status === "current" && step.kind !== "placement" ? `${step.overline} · Up next` : step.overline;
}

function meta(course: Course, step: Step, status: StepStatus): string {
  if (step.kind === "video") return `${step.durationMin} min`;
  if (step.kind === "final") return `Voice · ${step.durationMin} min · Completes the course`;
  if (step.kind === "placement") return `Voice · ${step.durationMin} min · No pass mark, just shows where you start`;
  const extra = status === "current" ? ` · ${passSummary(step, course.structureLabels)}` : "";
  return `Voice · ${step.durationMin} min${extra}`;
}

function PathNode({ step, status }: { step: Step; status: StepStatus }) {
  const shape = step.kind === "final" ? "rounded-[12px]" : "rounded-full";
  const base = `relative z-10 grid size-10 shrink-0 place-items-center ${shape}`;

  switch (status) {
    case "done":
      return (
        <span className={`${base} bg-accent text-white`}>
          <Check size={18} strokeWidth={2.5} aria-hidden />
        </span>
      );
    case "current":
      return (
        <span className={`${base} node-current border-2 border-accent bg-bg text-accent-ink`}>
          <StepIcon step={step} size={17} />
        </span>
      );
    case "skipped":
      return (
        <span className={`${base} border border-dashed border-line-strong bg-bg text-muted`}>
          <SkipForward size={15} aria-hidden />
        </span>
      );
    case "available":
      return (
        <span className={`${base} border border-line-strong bg-bg text-muted`}>
          <StepIcon step={step} size={16} />
        </span>
      );
    default:
      return (
        <span className={`${base} bg-surface-2 text-lock`}>
          <Lock size={15} aria-hidden />
        </span>
      );
  }
}

function StepAction({
  course,
  step,
  status,
  progress,
  lockedHint,
  pro,
}: {
  course: Course;
  step: Step;
  status: StepStatus;
  progress: Progress;
  lockedHint: string;
  pro: boolean;
}) {
  const href = stepHref(course.id, step);

  if (pro) {
    return (
      <Link href="/billing" className="btn btn-secondary btn-sm">
        <Lock size={14} aria-hidden />
        Unlock with Pro
      </Link>
    );
  }

  if (status === "done") {
    const best = progress[step.id]?.bestScore;
    const note = step.kind === "video" ? "Watched" : best ? `Passed · ${best}` : "Passed";
    const reviewHref = href;
    return (
      <>
        <span className="text-[14px] text-muted">{note}</span>
        <Link href={reviewHref} className="btn btn-ghost btn-sm text-text">
          Review
        </Link>
      </>
    );
  }
  if (status === "skipped") {
    return (
      <>
        <span className="text-[14px] text-muted">Skipped</span>
        <Link href={href} className="btn btn-ghost btn-sm text-text">
          Try it
        </Link>
      </>
    );
  }
  if (status === "current") {
    return (
      <Link href={href} className="btn btn-primary">
        {step.kind === "video" ? "Watch lesson" : "Start practice"}
        <ArrowRight size={18} aria-hidden />
      </Link>
    );
  }
  if (status === "available") {
    return (
      <Link href={href} className="btn btn-secondary btn-sm">
        {step.kind === "video" ? "Watch" : "Start"}
      </Link>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-[14px] text-muted">
      <Lock size={14} aria-hidden />
      {lockedHint}
    </span>
  );
}

function PathCard({
  course,
  step,
  status,
  progress,
  lockedHint,
  pro,
}: {
  course: Course;
  step: Step;
  status: StepStatus;
  progress: Progress;
  lockedHint: string;
  pro: boolean;
}) {
  const locked = status === "locked" || pro;
  const final = step.kind === "final";
  const border =
    status === "current"
      ? "border-accent shadow-[0_0_0_4px_var(--tint)]"
      : final
        ? "border-dashed border-line-strong"
        : "border-line";

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${border} ${locked ? "bg-surface" : "bg-bg"}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${
            status === "current" ? "bg-tint text-accent-ink" : "bg-surface-2 text-muted"
          }`}
        >
          <StepIcon step={step} />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-muted">{overline(step, status)}</p>
          <h3 className={`text-[16px] font-semibold ${locked ? "text-muted" : ""}`}>{step.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <span>{meta(course, step, status)}</span>
            <PracticeBadge step={step} />
            {pro && <span className="chip chip-tint">Pro</span>}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-[52px] sm:pl-0">
        <StepAction course={course} step={step} status={status} progress={progress} lockedHint={lockedHint} pro={pro} />
      </div>
    </div>
  );
}

function ProBanner() {
  return (
    <li className="mb-3 ml-14 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-accent bg-tint px-5 py-4">
      <div>
        <p className="text-[13px] font-semibold text-accent-ink">yapper Pro</p>
        <p className="text-[15px] font-semibold">Chapter 1 is free. Unlock the rest of the course.</p>
      </div>
      <Link href="/billing" className="btn btn-primary btn-sm">
        See plans
      </Link>
    </li>
  );
}

function CoursePath({ course, progress, plan }: { course: Course; progress: Progress; plan: Plan }) {
  const freeCount = freeStepCount(course.steps);
  const proLocked = !isPaid(plan);
  const { statuses } = courseSummary(course, progress);
  const blockerIndex = statuses.findIndex(
    (status, i) => (status === "current" || status === "available") && !isOptional(course.steps[i]),
  );
  const blocker = course.steps[blockerIndex];
  const lockedHint = blocker?.kind === "video" ? "Watch lesson to unlock" : "Pass practice to unlock";

  return (
    <ol className="flex flex-col" aria-label="Lesson path">
      {course.steps.map((step, index) => {
        const status = statuses[index];
        const isLast = index === course.steps.length - 1;
        const pro = proLocked && index >= freeCount;
        return (
          <Fragment key={step.id}>
            {proLocked && index === freeCount && <ProBanner />}
            <li className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-4 pb-3">
              <div className="relative flex justify-center pt-4">
                <PathNode step={step} status={status} />
                {!isLast && (
                  <span
                    aria-hidden
                    className={`absolute left-1/2 top-14 -bottom-4 w-0.5 -translate-x-1/2 ${
                      status === "done" ? "bg-accent" : "bg-line"
                    }`}
                  />
                )}
              </div>
              <PathCard
                course={course}
                step={step}
                status={status}
                progress={progress}
                lockedHint={lockedHint}
                pro={pro}
              />
              <span className="sr-only">{pro ? "Status: needs Pro" : `Status: ${status}`}</span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

function UnlockLegend({ note }: { note: string | null }) {
  return (
    <aside className="flex flex-col gap-4">
      <section className="card bg-surface p-5" aria-labelledby="unlock-title">
        <h2 id="unlock-title" className="text-[15px] font-bold">
          How unlocking works
        </h2>
        <dl className="mt-4 grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-3 text-[13px] text-muted">
          <dt>
            <span className="chip chip-tint">Required practice</span>
          </dt>
          <dd>Pass to open the next lesson.</dd>
          <dt>
            <span className="chip chip-outline">Optional</span>
          </dt>
          <dd>Extra reps. Skip anytime, come back later.</dd>
          <dt>
            <span className="chip chip-outline border-dashed text-text">Final practice</span>
          </dt>
          <dd>A full mock that completes the course.</dd>
        </dl>
      </section>
      <section className="card flex items-center gap-3 p-5">
        <CoachAvatar state="listening" size={56} className="!mx-0 shrink-0" />
        <p className="text-[14px] leading-relaxed text-muted">
          &ldquo;{note ? note.split(" · ").slice(1).join(" · ") : "Finish a practice and I'll leave you a note here."}&rdquo;
        </p>
      </section>
    </aside>
  );
}

type CourseViewProps = { course: Course; progress: Progress; latestNote: string | null; plan: Plan };

export function CourseView({ course, progress, latestNote, plan }: CourseViewProps) {
  const level = startingLevel(course, progress);
  const summary = courseSummary(course, progress);

  return (
    <Page width="max-w-[1080px]">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px] text-muted">
        <Link href="/courses" className="hover:text-text">
          Courses
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span className="font-medium text-text" aria-current="page">
          {course.title}
        </span>
      </nav>

      <header className="mt-5 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-[600px]">
          <h1 className="page-title">{course.title}</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-muted">{course.description}</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted">
            <li className="flex items-center gap-1.5">
              <SquarePlay size={15} aria-hidden /> {lessonCount(course)} lessons
            </li>
            <li className="flex items-center gap-1.5">
              <Mic size={15} aria-hidden /> {practiceCount(course)} voice practices
            </li>
            <li className="flex items-center gap-1.5">
              <Clock size={15} aria-hidden /> About {courseDuration(course)}
            </li>
          </ul>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing value={summary.percent} size={88} stroke={8} label={`${summary.percent}% complete`}>
            <span className="text-[19px] font-bold">{summary.percent}%</span>
          </ProgressRing>
          <div>
            <p className="text-[16px] font-bold">
              {summary.finished} of {summary.total} steps
            </p>
            <p className="text-[14px] text-muted">
              {level ? `Starting level: ${level}` : summary.averageScore !== null ? `Average score ${summary.averageScore}` : "Take the level check to start"}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_288px]">
        <CoursePath course={course} progress={progress} plan={plan} />
        <UnlockLegend note={latestNote} />
      </div>
    </Page>
  );
}
