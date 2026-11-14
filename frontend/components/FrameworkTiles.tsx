export function FrameworkTiles({ labels }: { labels: string[] }) {
  return (
    <ul className="grid w-full max-w-[280px] grid-cols-2 gap-3" aria-label="Answer structure">
      {labels.map((label) => (
        <li key={label} className="rounded-xl border border-line bg-bg p-3.5">
          <span className="grid size-7 place-items-center rounded-md bg-accent text-[13px] font-bold text-white">{label[0]}</span>
          <p className="mt-2 text-[14px] font-semibold">{label}</p>
        </li>
      ))}
    </ul>
  );
}
