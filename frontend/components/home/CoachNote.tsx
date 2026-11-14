import Link from "next/link";
import { CoachAvatar } from "@/components/CoachAvatar";

export function CoachNote({ userName, note, practiceHref }: { userName: string; note: string | null; practiceHref: string }) {
  const firstName = userName.split(" ")[0];
  const message = note
    ? `Last time: ${note.split(" · ").slice(1).join(" · ")}`
    : `Hi ${firstName}! Watch a short lesson, then practice out loud with me. I'll remember how it went.`;

  return (
    <section className="card flex flex-col bg-surface p-6 sm:p-7" aria-labelledby="coach-title">
      <div className="flex items-center gap-4">
        <CoachAvatar state="listening" size={64} className="!mx-0 shrink-0" />
        <div>
          <p className="text-[14px] text-muted">{note ? "Your coach remembers" : "Meet your coach"}</p>
          <h2 id="coach-title" className="text-[17px] font-bold">
            From your coach
          </h2>
        </div>
      </div>
      <blockquote className="mt-5 rounded-2xl border border-line bg-bg p-5 text-[16px] leading-relaxed">&ldquo;{message}&rdquo;</blockquote>
      <div className="mt-auto pt-6">
        <Link href={practiceHref} className="btn btn-secondary w-full">
          Practice with your coach
        </Link>
      </div>
    </section>
  );
}
