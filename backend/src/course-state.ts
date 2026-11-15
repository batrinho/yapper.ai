import type { Course, Step } from "./db/schema";

export type CourseWithSteps = Course & { steps: Step[] };
export type ProgressMap = Record<string, { status: "done" | "skipped"; bestScore: number | null }>;
export type StepStatus = "done" | "skipped" | "current" | "available" | "locked";

export const isPractice = (step: Step) => step.kind !== "video";
export const isOptional = (step: Step) => isPractice(step) && !step.required;

export function stepStatuses(course: CourseWithSteps, progress: ProgressMap): StepStatus[] {
  let blocked = false;
  let currentFound = false;
  return course.steps.map((step) => {
    const record = progress[step.id]?.status;
    let status: StepStatus;
    if (record) status = record;
    else if (blocked) status = "locked";
    else if (!currentFound) status = "current";
    else status = "available";

    if (status === "current") currentFound = true;
    if (isPractice(step) && step.required && record !== "done") blocked = true;
    return status;
  });
}

export function courseSummary(course: CourseWithSteps, progress: ProgressMap) {
  const statuses = stepStatuses(course, progress);
  const finished = statuses.filter((s) => s === "done" || s === "skipped").length;
  const total = course.steps.length;
  const currentIndex = statuses.indexOf("current");
  const scores = course.steps.flatMap((step) => progress[step.id]?.bestScore ?? []);
  return {
    statuses,
    finished,
    total,
    percent: total ? Math.round((finished / total) * 100) : 0,
    currentIndex,
    current: currentIndex === -1 ? undefined : course.steps[currentIndex],
    averageScore: scores.length ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null,
  };
}

export function lessonNumber(course: CourseWithSteps, index: number): number {
  return course.steps.slice(0, index + 1).filter((step) => step.kind === "video").length;
}

export const lessonCount = (course: CourseWithSteps) => course.steps.filter((s) => s.kind === "video").length;
export const practiceCount = (course: CourseWithSteps) => course.steps.filter(isPractice).length;

export function courseDuration(course: CourseWithSteps): string {
  if (course.durationLabel) return course.durationLabel;
  const minutes = course.steps.reduce((sum, step) => sum + step.durationMin, 0);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
}

export function lessonBefore(course: CourseWithSteps, index: number): { step: Step; index: number } | undefined {
  for (let i = index; i >= 0; i--) {
    if (course.steps[i].kind === "video") return { step: course.steps[i], index: i };
  }
  return undefined;
}

export function stepName(course: CourseWithSteps, index: number): string {
  const step = course.steps[index];
  if (step.kind === "video") return `Lesson ${lessonNumber(course, index)}`;
  if (step.kind === "placement") return "Level check";
  return step.kind === "final" ? "Final practice" : step.title;
}

export function stepHref(courseId: string, step: Step): string {
  return step.kind === "video" ? `/courses/${courseId}/lessons/${step.id}` : `/courses/${courseId}/practice/${step.id}`;
}

export function upNextLabel(step: Step): string {
  if (step.kind === "video") return "Next lesson";
  if (step.kind === "placement") return "Start here · Level check";
  if (step.kind === "final") return "Up next · Final practice";
  return step.required ? "Up next · Required practice" : "Up next · Optional practice";
}

export function structureName(labels: string[]): string {
  return labels.map((label) => label[0]).join("");
}

export function passSummary(step: Step, labels: string[]): string {
  const min = step.minScore ?? 70;
  return step.criteria?.requireStructure ? `Score ${min}+ with all four ${structureName(labels)} parts` : `Score ${min}+`;
}

export function nextPracticeHref(courses: CourseWithSteps[], progress: ProgressMap): string {
  for (const course of courses) {
    const statuses = stepStatuses(course, progress);
    const index = course.steps.findIndex(
      (step, i) => isPractice(step) && (statuses[i] === "current" || statuses[i] === "available"),
    );
    if (index !== -1) return stepHref(course.id, course.steps[index]);
  }
  return "/courses";
}

export type Level = "Beginner" | "Intermediate" | "Advanced";

export function levelFor(score: number): Level {
  if (score >= 75) return "Advanced";
  if (score >= 50) return "Intermediate";
  return "Beginner";
}

export function startingLevel(course: CourseWithSteps, progress: ProgressMap): Level | null {
  const check = course.steps.find((step) => step.kind === "placement");
  const score = check ? progress[check.id]?.bestScore : null;
  return score == null ? null : levelFor(score);
}
