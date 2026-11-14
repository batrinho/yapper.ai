import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export const SESSION_COOKIE = "yapper_session";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
} as const;

function signature(userId: string): string {
  return createHmac("sha256", env("SESSION_SECRET")).update(userId).digest("base64url");
}

export function signSession(userId: string): string {
  return `${userId}.${signature(userId)}`;
}

export function readSession(value: string | undefined): string | null {
  const [userId, given] = value?.split(".") ?? [];
  if (!userId || !given) return null;
  const expected = Buffer.from(signature(userId));
  const actual = Buffer.from(given);
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? userId : null;
}
