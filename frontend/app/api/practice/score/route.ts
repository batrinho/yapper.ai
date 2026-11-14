import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "backend/db/client";
import { practiceSessions, stepProgress, userContext, users, type Scores, type Step } from "backend/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { criteriaLabels, passes } from "backend/criteria";
import { addDays } from "backend/dates";
import { getCourse } from "backend/queries";
import { answerCoverage, buildReport, countFillerWords, fillerScore, overallScore, paceScore, scaleScores, speakingMinutes, transcribe } from "backend/scoring";
import { nextSkillProfile, scaleSkills, speechSignals } from "backend/skills";
import { localDate, safeTimeZone } from "backend/timezone";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_SECONDS = 10 * 60;
const MAX_NOTES = 10;
type SubScore = keyof Omit<Scores, "overall">;
const STRENGTHS: Record<SubScore, string> = {
  structure: "clear structure",
  clarity: "clear wording",
  pace: "steady pace",
  filler: "few filler words",
  confidence: "confident delivery",
};
const WORK_ON: Record<SubScore, string> = {
  structure: "covering every part of the answer",
  clarity: "shorter, clearer sentences",
  pace: "a steadier pace",
  filler: "cutting filler words",
  confidence: "a more confident delivery",
};

const conversationSchema = z.array(z.object({ role: z.enum(["coach", "user"]), text: z.string() })).max(200);

function parseJson(value: unknown): unknown {
  try {
    return JSON.parse(String(value ?? "[]"));
  } catch {
    return null;
  }
}

function badRequest(error: string, status = 400) {
  return Response.json({ error }, { status });
}

function nextStreak(user: { currentStreak: number; bestStreak: number; lastPracticeDate: string | null }, today: string) {
  if (user.lastPracticeDate === today) return { currentStreak: user.currentStreak, bestStreak: user.bestStreak };
  const current = user.lastPracticeDate === addDays(today, -1) ? user.currentStreak + 1 : 1;
  return { currentStreak: current, bestStreak: Math.max(user.bestStreak, current) };
}

function noteFor(step: Step, scores: Scores, today: string): string {
  const ranked = (Object.keys(STRENGTHS) as SubScore[]).sort((a, b) => scores[b] - scores[a]);
  const date = new Date(`${today}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${date} · ${step.title} · Strength: ${STRENGTHS[ranked[0]]} · Work on: ${WORK_ON[ranked[ranked.length - 1]]}`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const courseId = form?.get("courseId");
  const stepId = form?.get("stepId");
  const durationSec = Number(form?.get("durationSec"));
  const conversation = conversationSchema.safeParse(parseJson(form?.get("conversation")));
  if (!(audio instanceof Blob) || typeof courseId !== "string" || typeof stepId !== "string" || !conversation.success) {
    return badRequest("Missing audio or practice details.");
  }
  if (audio.size === 0) return badRequest("The recording was empty. Try again and speak a little longer.");
  if (audio.size > MAX_BYTES) return badRequest("That recording is over 25 MB. Keep practices under 10 minutes.", 413);
  if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > MAX_SECONDS) {
    return badRequest("Practices can be up to 10 minutes long.");
  }

  const course = await getCourse(courseId);
  const step = course?.steps.find((item) => item.id === stepId && item.kind !== "video");
  if (!course || !step) return badRequest("Unknown practice.", 404);

  const transcript = await transcribe(audio).catch((error) => {
    console.error("Transcription failed:", error instanceof Error ? error.message : error);
    return null;
  });
  if (!transcript) return badRequest("Couldn't transcribe your answer. Try again.", 502);
  if (!transcript.text.trim()) return badRequest("We couldn't hear an answer in that recording.", 422);

  const minutes = speakingMinutes(transcript.words);
  const fillerCount = countFillerWords(transcript.words);
  const wpm = minutes > 0 ? Math.round(transcript.words.length / minutes) : 0;
  const fillersPerMinute = minutes > 0 ? fillerCount / minutes : 0;
  const labels = course.structureLabels;
  const coachTurns = conversation.data.filter((line) => line.role === "coach").map((line) => line.text);
  const report = await buildReport({
    transcript: transcript.text,
    coachTurns,
    step,
    labels,
    criteria: criteriaLabels(step, labels).join("; "),
    fillersPerMinute,
    wpm,
    signals: speechSignals(transcript.words),
  });

  const coverage = answerCoverage(transcript.words.length, step);
  const partial = scaleScores({ ...report.scores, pace: paceScore(wpm), filler: fillerScore(fillersPerMinute) }, coverage);
  const scores: Scores = { ...partial, overall: overallScore(partial) };
  const skills = scaleSkills(report.skills, coverage);
  const passed = passes(step, labels, {
    score: scores.overall,
    parts: report.star,
    fillers: fillerCount,
    speakingSec: Math.round(minutes * 60),
    hasSpoken: true,
  });

  const [session] = await db
    .insert(practiceSessions)
    .values({
      userId: user.id,
      courseId,
      stepId,
      passed,
      overall: scores.overall,
      scores,
      star: report.star,
      tips: report.tips,
      improvedAnswer: report.improvedAnswer,
      skills,
      coachLine: report.coachLine,
      transcript: transcript.text,
      fillerCount,
      wpm,
      durationSec: Math.round(durationSec),
    })
    .returning({ id: practiceSessions.id });

  const progressKey = and(eq(stepProgress.userId, user.id), eq(stepProgress.courseId, courseId), eq(stepProgress.stepId, stepId));
  if (passed) {
    await db
      .insert(stepProgress)
      .values({ userId: user.id, courseId, stepId, status: "done", bestScore: scores.overall })
      .onConflictDoUpdate({
        target: [stepProgress.userId, stepProgress.courseId, stepProgress.stepId],
        set: { status: "done", bestScore: sql`greatest(coalesce(${stepProgress.bestScore}, 0), ${scores.overall})`, updatedAt: new Date() },
      });
  } else {
    await db
      .update(stepProgress)
      .set({ bestScore: sql`greatest(coalesce(${stepProgress.bestScore}, 0), ${scores.overall})`, updatedAt: new Date() })
      .where(progressKey);
  }

  const today = localDate(safeTimeZone(form?.get("timeZone")));
  await db.update(users).set({ ...nextStreak(user, today), lastPracticeDate: today }).where(eq(users.id, user.id));

  const [context] = await db
    .select({ notes: userContext.notes, skills: userContext.skills })
    .from(userContext)
    .where(eq(userContext.userId, user.id));
  const notes = [noteFor(step, scores, today), ...(context?.notes ?? [])].slice(0, MAX_NOTES);
  const skillProfile = nextSkillProfile(context?.skills ?? null, skills, coverage);
  await db
    .insert(userContext)
    .values({ userId: user.id, notes, skills: skillProfile })
    .onConflictDoUpdate({ target: userContext.userId, set: { notes, skills: skillProfile, updatedAt: new Date() } });

  return Response.json({ sessionId: session.id });
}
