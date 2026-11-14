import { NextResponse, type NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "backend/session";

export function proxy(request: NextRequest) {
  if (readSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/welcome", request.url));
}

export const config = {
  matcher: ["/((?!welcome|api/session|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
