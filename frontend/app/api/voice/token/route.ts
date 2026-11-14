import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "backend/db/client";
import { voiceAttempts } from "backend/db/schema";
import { env } from "backend/env";
import { FREE_PRACTICES, freePracticesLeft } from "backend/plans";
import { getAttemptsUsed } from "backend/queries";
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

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const params = new URL(request.url).searchParams;
  const isReconnect = params.get("reconnect") === "1" && (await startedRecently(user.id));

  if (!isReconnect) {
    if (freePracticesLeft(user.plan, await getAttemptsUsed(user.id)) === 0) {
      return Response.json(
        { error: `You've used your ${FREE_PRACTICES} free practices. Pick a plan to keep going.`, paywall: true },
        { status: 402 },
      );
    }
    if ((await attemptsToday(user.id, safeTimeZone(params.get("tz")))) >= DAILY_LIMIT) {
      return Response.json(
        { error: `You've done ${DAILY_LIMIT} practices today. Nice work! Come back tomorrow for more.` },
        { status: 429 },
      );
    }
  }

  const token = await grantToken();
  if (!token) return Response.json({ error: "Couldn't reach the voice service. Try again in a moment." }, { status: 502 });

  if (!isReconnect) await db.insert(voiceAttempts).values({ userId: user.id });
  return Response.json({ token });
}
