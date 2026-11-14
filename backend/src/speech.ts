const FILLER_PATTERN = /\b(uh-huh|mhmm|you know|basically|actually|sort of|kind of|um+|uh+|hmm+|mm+|like(?=,)|(?<=,\s?)like)\b/gi;

export type FillerCount = { total: number; breakdown: [string, number][] };

function normalizeFiller(word: string): string {
  const lower = word.toLowerCase();
  if (/^um+$/.test(lower)) return "um";
  if (/^uh+$/.test(lower)) return "uh";
  if (/^hmm+$/.test(lower)) return "hmm";
  if (/^mm+$/.test(lower)) return "mm";
  return lower;
}

export function countFillers(text: string): FillerCount {
  const counts = new Map<string, number>();
  for (const match of text.matchAll(FILLER_PATTERN)) {
    const word = normalizeFiller(match[0]);
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const breakdown = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return { total: breakdown.reduce((sum, [, n]) => sum + n, 0), breakdown };
}

export function formatBreakdown({ breakdown }: FillerCount): string {
  return breakdown
    .slice(0, 3)
    .map(([word, n]) => `${word} ×${n}`)
    .join(" · ");
}

export function splitFillers(text: string): { text: string; filler: boolean }[] {
  const parts: { text: string; filler: boolean }[] = [];
  let last = 0;
  for (const match of text.matchAll(FILLER_PATTERN)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start), filler: false });
    parts.push({ text: match[0], filler: true });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), filler: false });
  return parts;
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function wordsPerMinute(words: number, seconds: number): number {
  return seconds >= 5 ? Math.round((words / seconds) * 60) : 0;
}

