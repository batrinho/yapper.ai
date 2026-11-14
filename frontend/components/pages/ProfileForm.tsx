"use client";

import { useState, type FormEvent } from "react";

export function ProfileForm({ goal, role }: { goal: string | null; role: string | null }) {
  const [values, setValues] = useState({ goal: goal ?? "", role: role ?? "" });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    }).catch(() => null);
    setStatus(response?.ok ? "saved" : "error");
  }

  const field = "mt-1 h-11 w-full rounded-xl border border-line-strong bg-bg px-3 text-[15px] outline-none focus:border-accent";

  return (
    <form onSubmit={save} className="card mt-6 flex flex-col gap-4 p-6">
      <div>
        <h2 className="section-title">Tell your coach about you</h2>
        <p className="mt-1 text-[14px] text-muted">Optional. Your coach uses this to tailor follow-up questions.</p>
      </div>
      <label className="text-[14px] font-medium">
        Your goal
        <input
          value={values.goal}
          maxLength={200}
          onChange={(event) => setValues({ ...values, goal: event.target.value })}
          placeholder="Land a product manager role this spring"
          className={field}
        />
      </label>
      <label className="text-[14px] font-medium">
        Your role
        <input
          value={values.role}
          maxLength={200}
          onChange={(event) => setValues({ ...values, role: event.target.value })}
          placeholder="Data analyst at a fintech startup"
          className={field}
        />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === "saving"} className="btn btn-primary">
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        <p role="status" className="text-[14px] text-muted">
          {status === "saved" && "Saved. Your coach will use this next practice."}
          {status === "error" && "Couldn't save. Try again."}
        </p>
      </div>
    </form>
  );
}
