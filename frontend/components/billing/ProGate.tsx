import { Lock } from "lucide-react";
import { Page } from "@/components/ui";
import { PaywallDialog } from "@/components/billing/PaywallDialog";

/** Shown instead of a lesson or practice that needs a subscription. */
export function ProGate({ title, backHref }: { title: string; backHref: string }) {
  return (
    <Page width="max-w-[720px]">
      <div className="card flex flex-col items-center p-10 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-lock">
          <Lock size={24} aria-hidden />
        </span>
        <p className="mt-4 text-[13px] font-semibold text-accent-ink">yapper Pro</p>
        <h1 className="mt-1 text-[22px] font-bold">{title}</h1>
      </div>
      <PaywallDialog reason="chapter" backHref={backHref} />
    </Page>
  );
}
