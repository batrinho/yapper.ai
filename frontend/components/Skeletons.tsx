import type { ReactNode } from "react";
import { Page } from "@/components/ui";

function Block({ className }: { className: string }) {
  return <div className={`shimmer ${className}`} />;
}

function Loading({ children, width }: { children: ReactNode; width?: string }) {
  return (
    <Page width={width}>
      <div role="status" aria-label="Loading">
        {children}
      </div>
    </Page>
  );
}

function CardGrid({ count, height }: { count: number; height: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Block key={i} className={`${height} rounded-2xl`} />
      ))}
    </div>
  );
}

function Breadcrumb() {
  return <Block className="h-4 w-56 rounded-md" />;
}

export function HomeSkeleton() {
  return (
    <Loading>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Block className="h-4 w-40 rounded-md" />
          <Block className="h-9 w-72 rounded-lg" />
        </div>
        <Block className="h-5 w-64 rounded-md" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <Block className="h-[360px] rounded-2xl" />
        <Block className="h-[360px] rounded-2xl" />
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Block className="h-[170px] rounded-2xl" />
        <Block className="h-[170px] rounded-2xl" />
        <Block className="h-[170px] rounded-2xl" />
      </div>
      <Block className="mb-4 mt-10 h-6 w-40 rounded-md" />
      <CardGrid count={3} height="h-[170px]" />
    </Loading>
  );
}

export function CoursesSkeleton() {
  return (
    <Loading>
      <Block className="h-9 w-44 rounded-lg" />
      <Block className="mt-3 h-5 w-[420px] max-w-full rounded-md" />
      <div className="mt-8">
        <CardGrid count={3} height="h-[170px]" />
      </div>
    </Loading>
  );
}

export function CourseSkeleton() {
  return (
    <Loading width="max-w-[1080px]">
      <Breadcrumb />
      <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex w-full max-w-[600px] flex-col gap-3">
          <Block className="h-9 w-80 max-w-full rounded-lg" />
          <Block className="h-5 w-full rounded-md" />
          <Block className="h-5 w-3/4 rounded-md" />
          <Block className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-4">
          <Block className="size-[88px] rounded-full" />
          <div className="flex flex-col gap-2">
            <Block className="h-5 w-28 rounded-md" />
            <Block className="h-4 w-24 rounded-md" />
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_288px]">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4">
              <Block className="mt-4 size-10 rounded-full" />
              <Block className="h-[84px] rounded-2xl" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Block className="h-[200px] rounded-2xl" />
          <Block className="h-[96px] rounded-2xl" />
        </div>
      </div>
    </Loading>
  );
}

export function LessonSkeleton() {
  return (
    <Loading width="max-w-[1160px]">
      <Breadcrumb />
      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_332px]">
        <div>
          <Block className="aspect-video w-full rounded-2xl" />
          <Block className="mt-6 h-9 w-96 max-w-full rounded-lg" />
          <div className="mt-3 flex items-center gap-3">
            <Block className="size-11 rounded-full" />
            <div className="flex flex-col gap-2">
              <Block className="h-4 w-36 rounded-md" />
              <Block className="h-4 w-56 rounded-md" />
            </div>
          </div>
          <Block className="mt-8 h-6 w-40 rounded-md" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Block className="h-[190px] rounded-2xl" />
            <Block className="h-[190px] rounded-2xl" />
            <Block className="h-[190px] rounded-2xl" />
          </div>
        </div>
        <Block className="h-[540px] rounded-2xl" />
      </div>
    </Loading>
  );
}

export function PracticeSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-dvh flex-col">
      <div className="flex h-[72px] items-center justify-between gap-3 border-b border-line px-4 sm:px-8">
        <Block className="h-5 w-20 rounded-md" />
        <Block className="hidden h-9 w-[420px] rounded-full sm:block" />
        <Block className="h-6 w-40 rounded-md" />
      </div>
      <div className="grid flex-1 gap-6 p-4 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card flex min-h-[640px] flex-col items-center justify-center gap-6 bg-surface lg:min-h-[700px]">
          <Block className="size-[248px] rounded-full sm:size-[272px]" />
          <Block className="h-7 w-56 rounded-lg" />
          <Block className="h-5 w-72 rounded-md" />
          <Block className="h-[220px] w-full max-w-[460px] rounded-2xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Block className="h-[260px] rounded-2xl" />
          <Block className="min-h-[320px] flex-1 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <Loading width="max-w-[1140px]">
      <Block className="h-4 w-48 rounded-md" />
      <Block className="mt-3 h-9 w-64 rounded-lg" />
      <Block className="mt-2 h-5 w-80 max-w-full rounded-md" />
      <div className="mt-8 flex flex-col gap-6">
        <Block className="h-[290px] rounded-2xl" />
        <Block className="h-[120px] rounded-2xl" />
        <Block className="mt-4 h-6 w-44 rounded-md" />
        <div className="grid gap-4 md:grid-cols-3">
          <Block className="h-[170px] rounded-2xl" />
          <Block className="h-[170px] rounded-2xl" />
          <Block className="h-[170px] rounded-2xl" />
        </div>
        <Block className="h-[360px] rounded-2xl" />
      </div>
    </Loading>
  );
}

export function ProgressSkeleton() {
  return (
    <Loading>
      <Block className="h-9 w-44 rounded-lg" />
      <Block className="mt-3 h-5 w-96 max-w-full rounded-md" />
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <Block className="h-[112px] rounded-2xl" />
        <Block className="h-[112px] rounded-2xl" />
        <Block className="h-[112px] rounded-2xl" />
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Block className="h-[170px] rounded-2xl" />
        <Block className="h-[170px] rounded-2xl" />
        <Block className="h-[170px] rounded-2xl" />
      </div>
      <Block className="mb-4 mt-10 h-6 w-32 rounded-md" />
      <CardGrid count={3} height="h-[170px]" />
    </Loading>
  );
}

export function ProfileSkeleton() {
  return (
    <Loading width="max-w-[720px]">
      <Block className="h-9 w-36 rounded-lg" />
      <Block className="mt-8 h-[112px] rounded-2xl" />
      <Block className="mt-6 h-[320px] rounded-2xl" />
    </Loading>
  );
}
