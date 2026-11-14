import { db } from "backend/db/client";
import { userContext } from "backend/db/schema";
import { getCurrentUser, unauthorized } from "@/lib/auth";

const MAX_LENGTH = 200;

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, MAX_LENGTH);
  return trimmed || null;
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const goal = optionalText(body?.goal);
  const role = optionalText(body?.role);

  await db
    .insert(userContext)
    .values({ userId: user.id, goal: goal ?? null, role: role ?? null })
    .onConflictDoUpdate({ target: userContext.userId, set: { goal: goal ?? null, role: role ?? null, updatedAt: new Date() } });

  return Response.json({ goal: goal ?? null, role: role ?? null });
}
