"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { CoachChoice } from "@/components/CoachChoice";
import { Page } from "@/components/ui";

function CoachPicker() {
  return (
    <section className="card mt-6 p-6" aria-labelledby="coach-title">
      <h2 id="coach-title" className="text-[17px] font-bold">
        Coach avatar
      </h2>
      <p className="mt-1 text-[15px] text-muted">Who coaches you in practice. Each coach has its own voice.</p>
      <div className="mt-4">
        <CoachChoice labelledBy="coach-title" />
      </div>
    </section>
  );
}

export function SettingsView() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const dark = theme === "dark";

  const reset = async () => {
    const response = await fetch("/api/progress", { method: "DELETE" }).catch(() => null);
    setConfirming(false);
    setResetDone(Boolean(response?.ok));
    router.refresh();
  };

  return (
    <Page width="max-w-[720px]">
      <h1 className="page-title">Settings</h1>

      <section className="card mt-8 flex items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-[17px] font-bold">Dark mode</h2>
          <p className="text-[15px] text-muted">Follows your system until you change it here.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          aria-label="Dark mode"
          onClick={toggle}
          className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${dark ? "bg-accent" : "bg-line-strong"}`}
        >
          <span className={`size-6 rounded-full bg-white shadow-sm transition-transform ${dark ? "translate-x-5" : ""}`} />
        </button>
      </section>

      <CoachPicker />

      <section className="card mt-6 p-6">
        <h2 className="text-[17px] font-bold">Reset progress</h2>
        <p className="mt-1 text-[15px] text-muted">
          Clears your completed lessons, scores, reports, streak and coach notes. This can&rsquo;t be undone.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {confirming ? (
            <>
              <button type="button" onClick={reset} className="btn btn-primary">
                Yes, reset everything
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="btn btn-ghost">
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setConfirming(true);
                setResetDone(false);
              }}
              className="btn btn-secondary"
            >
              Reset progress
            </button>
          )}
          <p role="status" className="text-[14px] text-muted">
            {resetDone && "Progress cleared. Fresh start!"}
          </p>
        </div>
      </section>
    </Page>
  );
}
