export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col items-center px-4 py-10 sm:px-8" aria-busy="true" aria-label="Loading">
      <div className="shimmer size-[132px] rounded-full" />
      <div className="shimmer mt-6 h-9 w-80 max-w-full rounded-lg" />
      <div className="shimmer mt-3 h-5 w-96 max-w-full rounded-md" />
      <div className="mt-10 grid w-full gap-6 md:grid-cols-2">
        <div className="shimmer h-[300px] rounded-2xl" />
        <div className="shimmer h-[300px] rounded-2xl" />
      </div>
    </div>
  );
}
