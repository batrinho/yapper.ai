import type { Metadata } from "next";
import { requireUser, requireUserId } from "@/lib/auth";
import { getSessionCount, getUserContext } from "backend/queries";
import { Avatar, initials, Page } from "@/components/ui";
import { ProfileForm } from "@/components/pages/ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const userId = await requireUserId();
  const [user, context, sessions] = await Promise.all([requireUser(), getUserContext(userId), getSessionCount(userId)]);

  return (
    <Page width="max-w-[720px]">
      <h1 className="page-title">Profile</h1>
      <section className="card mt-8 flex items-center gap-5 p-6">
        <Avatar initials={initials(user.name)} size={64} />
        <div>
          <p className="text-[20px] font-bold">{user.name}</p>
          <p className="text-[15px] text-muted">
            {sessions} practice{sessions === 1 ? "" : "s"} · Best streak {user.bestStreak} day{user.bestStreak === 1 ? "" : "s"}
          </p>
        </div>
      </section>
      <ProfileForm goal={context.goal} role={context.role} />
      {context.notes.length > 0 && (
        <section className="card mt-6 p-6" aria-labelledby="notes-title">
          <h2 id="notes-title" className="section-title">
            What your coach remembers
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-[15px] text-muted">
            {context.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}
