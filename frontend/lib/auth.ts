import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "backend/db/client";
import { users, type User } from "backend/db/schema";
import { readSession, SESSION_COOKIE } from "backend/session";

export const sessionUserId = cache(async (): Promise<string | null> => readSession((await cookies()).get(SESSION_COOKIE)?.value));

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const userId = await sessionUserId();
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/welcome");
  return user;
}

export async function requireUserId(): Promise<string> {
  const userId = await sessionUserId();
  if (!userId) redirect("/welcome");
  return userId;
}

export function unauthorized() {
  return Response.json({ error: "Please sign in again." }, { status: 401 });
}
