import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { nextPracticeHref } from "backend/course-state";
import { getCourses, getProgress } from "backend/queries";
import { requireUser } from "@/lib/auth";
import { SuccessView } from "@/components/billing/SuccessView";

export const metadata: Metadata = { title: "Welcome to Pro" };

/** Only same-site paths, so the "continue" link can't send people elsewhere. */
function safeNext(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("/billing")) return null;
  return /^\/[\\/]/.test(value) ? null : value;
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BillingSuccessPage({ searchParams }: Props) {
  const [user, { next }] = await Promise.all([requireUser(), searchParams]);
  if (user.plan === "free") redirect("/billing");

  const [courses, progress] = await Promise.all([getCourses(), getProgress(user.id)]);
  const back = safeNext(next);

  return (
    <SuccessView
      name={user.name}
      plan={user.plan}
      renewsAt={user.planRenewsAt?.toISOString() ?? null}
      courses={courses.map((course) => ({ id: course.id, title: course.title, lessons: course.steps.filter((s) => s.kind === "video").length }))}
      continueHref={back ?? nextPracticeHref(courses, progress)}
      continueLabel={back ? "Continue where you left off" : "Start your next practice"}
    />
  );
}
