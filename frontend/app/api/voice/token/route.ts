import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "backend/db/client";
import { users, voiceAttempts, type AttemptKind, type User } from "backend/db/schema";
import { env } from "backend/env";
import { FREE_PRACTICES, freePracticesLeft, needsSubscription } from "backend/plans";
import { getAttemptsUsed, getCourse } from "backend/queries";
import { safeTimeZone } from "backend/timezone";
import { getCurrentUser, unauthorized } from "@/lib/auth";

const DAILY_LIMIT = 30;
const TOKEN_TTL_SECONDS = 60;
const RECONNECT_WINDOW_MS = 15 * 60 * 1000;

async function attemptsToday(userId: string, timeZone: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(voiceAttempts)
    .where(
      and(
        eq(voiceAttempts.userId, userId),
        sql`(${voiceAttempts.createdAt} at time zone ${timeZone})::date = (now() at time zone ${timeZone})::date`,
      ),
    );
  return count;
}

async function startedRecently(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - RECONNECT_WINDOW_MS);
  const [row] = await db
    .select({ id: voiceAttempts.id })
    .from(voiceAttempts)
    .where(and(eq(voiceAttempts.userId, userId), gte(voiceAttempts.createdAt, since)))
    .limit(1);
  return Boolean(row);
}

async function grantToken(): Promise<string | null> {
  const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
    method: "POST",
    headers: { Authorization: `Token ${env("DEEPGRAM_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ttl_seconds: TOKEN_TTL_SECONDS }),
  });
  if (!response.ok) {
    console.error("Deepgram token grant failed with status", response.status);
    return null;
  }
  const { access_token: token } = (await response.json()) as { access_token: string };
  return token;
}

const paywall = (error: string) => Response.json({ error, paywall: true }, { status: 402 });

/** Decides what kind of attempt this is, or why it isn't allowed. */
async function resolveAttempt(user: User, params: URLSearchParams): Promise<AttemptKind | Response> {
  if (params.get("trial") === "1") {
    return user.trialUsedAt ? Response.json({ error: "You've already had your free first chat." }, { status: 403 }) : "trial";
  }

  const course = await getCourse(params.get("course") ?? "");
  const index = course?.steps.findIndex((step) => step.id === params.get("step")) ?? -1;
  if (!course || index === -1) return Response.json({ error: "Unknown practice." }, { status: 404 });
  if (course.steps[index].kind === "placement") return "placement";
  if (needsSubscription(user.plan, course, index)) {
    return paywall("This practice is part of yapper Pro. Pick a plan to unlock it.");
  }
  if (freePracticesLeft(user.plan, await getAttemptsUsed(user.id)) === 0) {
    return paywall(`You've used your ${FREE_PRACTICES} free practices. Pick a plan to keep going.`);
  }
  return "practice";
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const params = new URL(request.url).searchParams;
  const isReconnect = params.get("reconnect") === "1" && (await startedRecently(user.id));

  let kind: AttemptKind | null = null;
  if (!isReconnect) {
    const attempt = await resolveAttempt(user, params);
    if (attempt instanceof Response) return attempt;
    kind = attempt;
    if ((await attemptsToday(user.id, safeTimeZone(params.get("tz")))) >= DAILY_LIMIT) {
      return Response.json(
        { error: `You've done ${DAILY_LIMIT} practices today. Nice work! Come back tomorrow for more.` },
        { status: 429 },
      );
    }
  }

  const token = await grantToken();
  if (!token) return Response.json({ error: "Couldn't reach the voice service. Try again in a moment." }, { status: 502 });

  if (kind) await db.insert(voiceAttempts).values({ userId: user.id, kind });
  if (kind === "trial") await db.update(users).set({ trialUsedAt: new Date() }).where(eq(users.id, user.id));
  return Response.json({ token });
}
