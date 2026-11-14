import { eq } from "drizzle-orm";
import { db } from "backend/db/client";
import { users } from "backend/db/schema";
import { isPlan, renewalDate } from "backend/plans";
import { getCurrentUser, unauthorized } from "@/lib/auth";

/** Demo checkout: switches the plan without taking any payment. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!isPlan(body?.plan)) return Response.json({ error: "Unknown plan." }, { status: 400 });

  const planRenewsAt = renewalDate(body.plan);
  await db.update(users).set({ plan: body.plan, planRenewsAt }).where(eq(users.id, user.id));
  return Response.json({ plan: body.plan, planRenewsAt });
}
