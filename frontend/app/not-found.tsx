import Link from "next/link";
import { Mascot } from "@/components/Mascot";
import { Page } from "@/components/ui";

export default function NotFound() {
  return (
    <Page width="max-w-[560px]">
      <div className="flex flex-col items-center py-16 text-center">
        <Mascot state="thinking" size={140} />
        <h1 className="page-title mt-6">We couldn&rsquo;t find that page</h1>
        <p className="mt-2 text-[16px] text-muted">It may have moved. Let&rsquo;s get you back on track.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Back home
        </Link>
      </div>
    </Page>
  );
}
