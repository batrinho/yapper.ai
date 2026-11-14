import { getCurrentUser, unauthorized } from "@/lib/auth";
import { COACHES, isCoachId } from "backend/coach-prompt";
import { env } from "backend/env";

const MAX_CHARS = 1500;

export async function POST(request: Request) {
  if (!(await getCurrentUser())) return unauthorized();

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_CHARS) {
    return Response.json({ error: `Send between 1 and ${MAX_CHARS} characters.` }, { status: 400 });
  }

  const coach: unknown = body?.coach;
  const voice = COACHES[isCoachId(coach) ? coach : "yap"].voice;
  const response = await fetch(`https://api.deepgram.com/v1/speak?model=${voice}`, {
    method: "POST",
    headers: { Authorization: `Token ${env("DEEPGRAM_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok || !response.body) {
    console.error("Deepgram TTS failed with status", response.status);
    return Response.json({ error: "Your coach lost their voice. Try again." }, { status: 502 });
  }

  return new Response(response.body, {
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "audio/mpeg", "Cache-Control": "no-store" },
  });
}
