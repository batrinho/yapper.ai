import { and, eq, sql } from "drizzle-orm";
import { db } from "backend/db/client";
import { practiceSessions, stepProgress, steps, userContext, users } from "backend/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (typeof body?.stepId !== "string" || (status !== "done" && status !== "skipped")) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const [step] = await db.select().from(steps).where(eq(steps.id, body.stepId));
  const allowed = step && (status === "done" ? step.kind === "video" : step.kind === "practice" && !step.required);
  if (!allowed) return Response.json({ error: "That step can't be updated this way." }, { status: 400 });

  await db
    .insert(stepProgress)
    .values({ userId: user.id, courseId: step.courseId, stepId: step.id, status })
    .onConflictDoUpdate({
      target: [stepProgress.userId, stepProgress.courseId, stepProgress.stepId],
      set: { status: sql`case when ${stepProgress.status} = 'done' then 'done' else excluded.status end`, updatedAt: new Date() },
    });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await db.delete(stepProgress).where(eq(stepProgress.userId, user.id));
  await db.delete(practiceSessions).where(eq(practiceSessions.userId, user.id));
  await db.update(users).set({ currentStreak: 0, bestStreak: 0, lastPracticeDate: null }).where(eq(users.id, user.id));
  await db.update(userContext).set({ notes: [], updatedAt: new Date() }).where(and(eq(userContext.userId, user.id)));
  return new Response(null, { status: 204 });
}
