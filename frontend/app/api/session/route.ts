import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "backend/db/client";
import { userContext, users } from "backend/db/schema";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "backend/session";

const NAME_PATTERN = /^[\p{L}\p{N} '-]{1,40}$/u;

function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ");
  return NAME_PATTERN.test(name) ? name : null;
}

async function findOrCreateUser(name: string) {
  const byName = sql`lower(${users.name}) = lower(${name})`;
  const [existing] = await db.select().from(users).where(byName);
  if (existing) return { user: existing, isNew: false };
  await db.insert(users).values({ name }).onConflictDoNothing();
  const [created] = await db.select().from(users).where(byName);
  await db.insert(userContext).values({ userId: created.id }).onConflictDoNothing();
  return { user: created, isNew: true };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = normalizeName(body?.name);
  if (!name) {
    return Response.json(
      { error: "Use 1–40 letters, numbers, spaces, apostrophes or hyphens." },
      { status: 400 },
    );
  }

  const { user, isNew } = await findOrCreateUser(name);
  (await cookies()).set(SESSION_COOKIE, signSession(user.id), sessionCookieOptions);
  return Response.json({ name: user.name, onboarding: isNew || !user.onboardedAt });
}

export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return new Response(null, { status: 204 });
}
