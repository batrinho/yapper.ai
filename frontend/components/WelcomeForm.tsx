"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function WelcomeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Something went wrong. Try again.");
      router.replace(data.onboarding ? "/onboarding" : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 text-left">
      <label htmlFor="name" className="sr-only">
        Your name
      </label>
      <input
        id="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={40}
        autoComplete="given-name"
        autoFocus
        placeholder="Your name"
        aria-describedby="name-note"
        aria-invalid={Boolean(error)}
        className="h-12 w-full rounded-xl border border-line-strong bg-bg px-4 text-[16px] outline-none transition-colors focus:border-accent"
      />
      <p id="name-note" className="mt-2 text-[13px] text-muted">
        Use the same name to come back to your progress.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-accent-ink">
          {error}
        </p>
      )}
      <button type="submit" disabled={submitting || !name.trim()} className="btn btn-primary mt-5 h-[52px] w-full text-[16px]">
        {submitting ? "One sec…" : "Continue"}
      </button>
    </form>
  );
}
