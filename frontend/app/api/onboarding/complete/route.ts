import { eq } from "drizzle-orm";
import { db } from "backend/db/client";
import { users } from "backend/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.onboardedAt) await db.update(users).set({ onboardedAt: new Date() }).where(eq(users.id, user.id));
  return Response.json({ ok: true });
}
