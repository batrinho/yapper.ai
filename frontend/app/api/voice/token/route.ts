import { and, eq, sql } from "drizzle-orm";
import { db } from "backend/db/client";
import { voiceAttempts } from "backend/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { env } from "backend/env";
import { safeTimeZone } from "backend/timezone";

const DAILY_LIMIT = 30;
const TOKEN_TTL_SECONDS = 60;

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

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const timeZone = safeTimeZone(new URL(request.url).searchParams.get("tz"));
  if ((await attemptsToday(user.id, timeZone)) >= DAILY_LIMIT) {
    return Response.json(
      { error: `You've done ${DAILY_LIMIT} practices today. Nice work! Come back tomorrow for more.` },
      { status: 429 },
    );
  }

  const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
    method: "POST",
    headers: { Authorization: `Token ${env("DEEPGRAM_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ttl_seconds: TOKEN_TTL_SECONDS }),
  });
  if (!response.ok) {
    console.error("Deepgram token grant failed with status", response.status);
    return Response.json({ error: "Couldn't reach the voice service. Try again in a moment." }, { status: 502 });
  }

  const { access_token: token } = (await response.json()) as { access_token: string };
  await db.insert(voiceAttempts).values({ userId: user.id });
  return Response.json({ token });
}
