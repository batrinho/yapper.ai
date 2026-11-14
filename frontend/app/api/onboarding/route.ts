import { db } from "backend/db/client";
import { userContext } from "backend/db/schema";
import { isProfile, SURVEY } from "backend/onboarding";
import { getCurrentUser, unauthorized } from "@/lib/auth";

const goalLabel = (value: string) => SURVEY.find((q) => q.id === "goal")?.options.find((o) => o.value === value)?.label ?? null;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!isProfile(body?.profile)) return Response.json({ error: "Please answer every question." }, { status: 400 });

  const profile = body.profile;
  const goal = goalLabel(profile.goal);
  await db
    .insert(userContext)
    .values({ userId: user.id, profile, goal })
    .onConflictDoUpdate({ target: userContext.userId, set: { profile, goal, updatedAt: new Date() } });

  return Response.json({ ok: true });
}
