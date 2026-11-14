import { cache } from "react";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import { db } from "./db/client";
import { courses, practiceSessions, stepProgress, steps, userContext } from "./db/schema";
import type { CourseWithSteps, ProgressMap } from "./course-state";

export type SessionSummary = { createdAt: string; durationSec: number; fillerCount: number };

export const getCourses = cache(async (): Promise<CourseWithSteps[]> => {
  const [courseRows, stepRows] = await Promise.all([
    db.select().from(courses).orderBy(asc(courses.sortOrder)),
    db.select().from(steps).orderBy(asc(steps.position)),
  ]);
  return courseRows.map((course) => ({ ...course, steps: stepRows.filter((step) => step.courseId === course.id) }));
});

export const getCourse = cache(async (courseId: string): Promise<CourseWithSteps | undefined> => {
  const [[course], courseSteps] = await Promise.all([
    db.select().from(courses).where(eq(courses.id, courseId)),
    db.select().from(steps).where(eq(steps.courseId, courseId)).orderBy(asc(steps.position)),
  ]);
  return course ? { ...course, steps: courseSteps } : undefined;
});

export const getProgress = cache(async (userId: string): Promise<ProgressMap> => {
  const rows = await db.select().from(stepProgress).where(eq(stepProgress.userId, userId));
  return Object.fromEntries(rows.map((row) => [row.stepId, { status: row.status, bestScore: row.bestScore }]));
});

export const getRecentSessions = cache(async (userId: string): Promise<SessionSummary[]> => {
  const since = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ createdAt: practiceSessions.createdAt, durationSec: practiceSessions.durationSec, fillerCount: practiceSessions.fillerCount })
    .from(practiceSessions)
    .where(and(eq(practiceSessions.userId, userId), gte(practiceSessions.createdAt, since)))
    .orderBy(asc(practiceSessions.createdAt));
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
});

export const getSessionCount = cache(async (userId: string): Promise<number> => {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(practiceSessions).where(eq(practiceSessions.userId, userId));
  return count;
});

export const getUserContext = cache(async (userId: string) => {
  const [row] = await db.select().from(userContext).where(eq(userContext.userId, userId));
  return row ?? { userId, goal: null, role: null, notes: [] as string[], updatedAt: new Date() };
});

export const getPracticeSession = cache(async (userId: string, sessionId: string) => {
  const [row] = await db
    .select()
    .from(practiceSessions)
    .where(and(eq(practiceSessions.id, sessionId), eq(practiceSessions.userId, userId)));
  return row;
});

export const getAttemptCount = cache(async (userId: string, stepId: string): Promise<number> => {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(practiceSessions)
    .where(and(eq(practiceSessions.userId, userId), eq(practiceSessions.stepId, stepId)));
  return count;
});
