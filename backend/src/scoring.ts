import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { PartFlags, PartTexts, Scores, Skills, Step } from "./db/schema";
import { env } from "./env";
import { clampSkills, describeSignals, heuristicSkills, type SpeechSignals } from "./skills";

type Word = { word: string; punctuated_word?: string; start: number; end: number; confidence?: number };
export type Transcript = { text: string; words: Word[] };

const SINGLE_FILLERS = new Set(["um", "uh", "hmm", "mm", "mhmm", "uh-huh", "basically", "actually"]);
const PAIR_FILLERS = new Set(["you know", "sort of", "kind of"]);
const LIKE_PAUSE_SEC = 0.3;
const PART_KEYS = ["s", "t", "a", "r"] as const;

// nova-2 keeps "um" and "uh" in real mic audio; nova-3 drops most of them.
const FILLER_MODEL = "nova-2";

export async function transcribe(audio: Blob): Promise<Transcript> {
  const params = new URLSearchParams({ model: FILLER_MODEL, filler_words: "true", smart_format: "true", language: "en" });
  const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: "POST",
    headers: { Authorization: `Token ${env("DEEPGRAM_API_KEY")}`, "Content-Type": audio.type || "audio/webm" },
    body: audio,
  });
  if (!response.ok) throw new Error(`Deepgram transcription failed with status ${response.status}`);
  const data = await response.json();
  const alternative = data.results?.channels?.[0]?.alternatives?.[0] ?? { transcript: "", words: [] };
  return { text: alternative.transcript ?? "", words: alternative.words ?? [] };
}

const clean = (word: string) => word.toLowerCase().replace(/[^a-z'-]/g, "");

function isFillerLike(words: Word[], i: number): boolean {
  const current = words[i].punctuated_word ?? words[i].word;
  const previous = words[i - 1];
  const next = words[i + 1];
  const commaAround = current.endsWith(",") || Boolean(previous?.punctuated_word?.endsWith(","));
  const pauseAround = (previous && words[i].start - previous.end >= LIKE_PAUSE_SEC) || (next && next.start - words[i].end >= LIKE_PAUSE_SEC);
  return commaAround || Boolean(pauseAround);
}

export function countFillerWords(words: Word[]): number {
  let count = 0;
  for (let i = 0; i < words.length; i++) {
    const word = clean(words[i].word);
    const pair = i + 1 < words.length ? `${word} ${clean(words[i + 1].word)}` : "";
    if (PAIR_FILLERS.has(pair)) {
      count += 1;
      i += 1;
    } else if (SINGLE_FILLERS.has(word) || (word === "like" && isFillerLike(words, i))) {
      count += 1;
    }
  }
  return count;
}

/** Gaps this long are the user listening to the coach, not part of their own speech. */
const TURN_GAP_SEC = 2;

/**
 * Time the user actually spent talking: words plus the natural pauses between them.
 * The recording also covers the coach's turns, so measuring first word to last word
 * made pace look about half as fast as it really was.
 */
export function speakingMinutes(words: Word[]): number {
  if (words.length < 2) return 0;
  let seconds = 0;
  for (let i = 0; i < words.length; i++) {
    seconds += Math.max(0, words[i].end - words[i].start);
    const gap = i > 0 ? words[i].start - words[i - 1].end : 0;
    if (gap > 0 && gap < TURN_GAP_SEC) seconds += gap;
  }
  return seconds / 60;
}

export function paceScore(wpm: number): number {
  if (wpm >= 120 && wpm <= 160) return 100;
  const distance = wpm < 120 ? 120 - wpm : wpm - 160;
  return Math.max(0, Math.round(100 - distance * 1.5));
}

export function fillerScore(fillersPerMinute: number): number {
  return Math.max(0, Math.round(100 - fillersPerMinute * 10));
}

export type Report = {
  star: PartFlags;
  scores: Pick<Scores, "structure" | "clarity" | "confidence">;
  skills: Skills;
  tips: string[];
  improvedAnswer: PartTexts;
  coachLine: string;
};

const reportSchema = z.object({
  star: z.object({ s: z.boolean(), t: z.boolean(), a: z.boolean(), r: z.boolean() }),
  scores: z.object({ structure: z.number(), clarity: z.number(), confidence: z.number() }),
  skills: z.object({ fluency: z.number(), pronunciation: z.number(), grammar: z.number(), vocabulary: z.number(), cohesion: z.number() }),
  tips: z.array(z.string()).length(3),
  improvedAnswer: z.object({ s: z.string(), t: z.string(), a: z.string(), r: z.string() }),
  coachLine: z.string(),
});

const modelOutputSchema = reportSchema.extend({ tips: z.array(z.string()) });

const REPORT_MODEL = "gpt-4.1-mini";

const clampScore = (n: number) => Math.round(Math.min(100, Math.max(0, n)));

type ReportInput = {
  transcript: string;
  coachTurns: string[];
  step: Step;
  labels: string[];
  criteria: string;
  fillersPerMinute: number;
  wpm: number;
  signals: SpeechSignals;
};

function reportInstructions(labels: string[]): string {
  const partMap = PART_KEYS.map((key, i) => `${key} = ${labels[i]}`).join(", ");
  return [
    "You are a speaking coach scoring one spoken practice answer from a verbatim transcript that keeps filler words.",
    `The four answer parts are ${partMap}. Mark a part true only if the speaker clearly covered it.`,
    "Score structure, clarity and confidence from 0 to 100. If the answer is very short, off topic, a joke or not a real attempt at the task, score all three below 20 and say so kindly in coachLine.",
    "Also score five speaking skills from 0 to 100, judging the speaker's language, not the content of the story:",
    "- fluency: smooth, continuous delivery. Use the pace, filler and pause numbers given, plus restarts and broken-off sentences in the transcript.",
    "- pronunciation: pronunciation and articulation. You cannot hear the audio, so judge it from the speech recognizer's confidence numbers and unsure words given: high confidence and few unsure words means clear articulation.",
    "- grammar: grammar and syntax. Accuracy and variety of sentence structure; ignore filler words and normal loose spoken style.",
    "- vocabulary: range and precision of word choice; penalize heavy repetition and vague words.",
    "- cohesion: how ideas connect into one clear line, with linking words and a logical order.",
    "If the answer is not a real attempt, score all five skills below 20 as well.",
    "Write exactly 3 tips, each a short title, then ' — ', then one specific sentence grounded in what they said.",
    "improvedAnswer rewrites the speaker's own story as one strong spoken sentence per part, keeping their facts.",
    "coachLine is one short, warm sentence the coach says about the answer. No markdown anywhere.",
  ].join("\n");
}

function reportRequest({ transcript, coachTurns, step, criteria, fillersPerMinute, wpm, signals }: ReportInput): string {
  return [
    `Task question: ${step.taskQuestion}`,
    `Goal: ${step.practiceGoal}`,
    `Pass criteria: ${criteria}`,
    `What the coach said: ${coachTurns.join(" / ") || "nothing"}`,
    "",
    `Delivery measurements:\n${describeSignals(signals, wpm, fillersPerMinute)}`,
    "",
    `Speaker transcript:\n${transcript}`,
  ].join("\n");
}

async function llmReport(input: ReportInput): Promise<Report | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const response = await new OpenAI().responses.parse({
    model: REPORT_MODEL,
    instructions: reportInstructions(input.labels),
    input: reportRequest(input),
    text: { format: zodTextFormat(modelOutputSchema, "practice_report") },
  });

  const parsed = reportSchema.safeParse(response.output_parsed);
  if (!parsed.success) return null;
  const { structure, clarity, confidence } = parsed.data.scores;
  return {
    ...parsed.data,
    scores: { structure: clampScore(structure), clarity: clampScore(clarity), confidence: clampScore(confidence) },
    skills: clampSkills(parsed.data.skills),
  };
}

const PART_CUES: Record<string, string[]> = {
  situation: ["when", "last year", "at my", "we were", "project", "team", "company", "ago"],
  task: ["my role", "i owned", "responsible", "my job", "i needed to", "i had to", "my goal"],
  action: ["i decided", "i built", "i proposed", "i talked", "i created", "i pulled", "i led", "i asked", "so i"],
  result: ["as a result", "in the end", "ended up", "increased", "decreased", "percent", "learned", "shipped", "saved"],
  hook: ["picture", "imagine", "i remember", "one day", "it was", "the first time"],
  stakes: ["worried", "afraid", "risk", "at stake", "could lose", "nervous", "mattered", "if i"],
  turn: ["but then", "suddenly", "that's when", "realized", "turned out", "until", "instead"],
  landing: ["ever since", "learned", "now i", "that's why", "since then", "the lesson", "in the end"],
  open: ["imagine", "what if", "raise your hand", "picture", "here's", "today"],
  point: ["my point", "the idea", "i believe", "the key", "what matters", "the one thing"],
  proof: ["for example", "for instance", "percent", "data", "study", "when i"],
  close: ["so next", "my ask", "remember", "to wrap up", "try this", "thank you", "in short", "let's", "does that work", "can we agree"],
  present: ["i'm a", "i am a", "i work", "currently", "right now", "these days", "my role"],
  past: ["before that", "started", "i used to", "previously", "background", "studied", "years ago"],
  future: ["next", "looking for", "excited", "i want to", "hoping", "goal", "going forward"],
  headline: ["bottom line", "in short", "the headline", "on track", "behind", "ahead", "overall"],
  progress: ["finished", "completed", "shipped", "done", "progress", "this week", "so far"],
  blockers: ["blocked", "waiting on", "risk", "issue", "problem", "delay", "need help", "challenge"],
  "next steps": ["next", "plan to", "will", "by friday", "tomorrow", "going to", "next week"],
  acknowledge: ["i hear", "i understand", "fair point", "good question", "you're right", "i see why", "that's a valid"],
  position: ["i still think", "i believe", "i recommend", "my view", "i chose", "the reason", "that's why"],
  evidence: ["data", "for example", "percent", "users", "tested", "results", "numbers", "we saw"],
  "next step": ["next step", "let's", "i suggest", "how about", "we could", "i'll follow up", "propose"],
  value: ["i delivered", "i led", "i saved", "i grew", "my results", "i've taken on", "impact"],
  market: ["market", "research", "industry", "similar roles", "data shows", "benchmark", "glassdoor", "range"],
  ask: ["i'm asking", "i'd like", "i would like", "i'm looking for", "can we", "i want", "my ask"],
};

const FILLER_PATTERN = /\b(um+|uh+|hmm+|mm+|mhmm|uh-huh|basically|actually|you know|sort of|kind of)\b,?\s*|,\s*like,\s*/gi;

function tidy(sentence: string): string {
  const text = sentence.replace(FILLER_PATTERN, " ").replace(/^(so|and|well)\b,?\s*/i, "").replace(/\s{2,}/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ownSentences(transcript: string, labels: string[]): PartTexts {
  const sentences = transcript.split(/(?<=[.!?])\s+/).map(tidy).filter((s) => s.split(" ").length >= 5);
  const used = new Set<string>();
  const pick = (label: string, i: number) => {
    const cues = PART_CUES[label.toLowerCase()] ?? [];
    const match = sentences.find((s) => !used.has(s) && cues.some((cue) => ` ${s.toLowerCase()} `.includes(cue))) ?? sentences.find((s) => !used.has(s));
    if (match) used.add(match);
    return match ?? `Add one clear sentence about the ${labels[i].toLowerCase()}.`;
  };
  return { s: pick(labels[0], 0), t: pick(labels[1], 1), a: pick(labels[2], 2), r: pick(labels[3], 3) };
}

function heuristicReport({ transcript, labels, fillersPerMinute, wpm, signals }: ReportInput): Report {
  const lower = ` ${transcript.toLowerCase()} `;
  const flags = PART_KEYS.map((_, i) => (PART_CUES[labels[i].toLowerCase()] ?? []).some((cue) => lower.includes(cue)));
  const star = { s: flags[0], t: flags[1], a: flags[2], r: flags[3] };
  const words = transcript.split(/\s+/).filter(Boolean).length;
  const found = flags.filter(Boolean).length;
  const lengthPenalty = words < 60 ? 20 : words < 120 ? 8 : 0;
  const hedges = lower.match(/\b(i think|maybe|i guess|probably|i mean)\b/g)?.length ?? 0;
  const missing = labels.find((_, i) => !flags[i]);

  const tooShort = words < 15;
  const tips = [
    tooShort && "Give a full answer — That was only a few words. Aim for at least 30 seconds on the question.",
    missing && `Land a clear ${missing} — Your answer didn't have a clear ${missing.toLowerCase()}. Give it its own sentence.`,
    fillersPerMinute > 2 && `Pause instead of filling — You used about ${fillersPerMinute.toFixed(1)} filler words a minute. A one-beat pause sounds more confident.`,
    words < 80 && "Add one concrete detail — A name, a number or a moment makes the answer easier to picture.",
    "Lead with stakes — One sentence of context, then why it mattered.",
    "End on an outcome — Finish with what changed, ideally with a number.",
  ].filter((tip): tip is string => Boolean(tip));

  const improvedAnswer = ownSentences(transcript, labels);

  return {
    star,
    scores: {
      structure: clampScore(30 + found * 17 - lengthPenalty / 2),
      clarity: clampScore(90 - fillersPerMinute * 6 - lengthPenalty),
      confidence: clampScore(88 - hedges * 6 - lengthPenalty),
    },
    skills: heuristicSkills(transcript, signals, paceScore(wpm), fillerScore(fillersPerMinute)),
    tips: tips.slice(0, 3),
    improvedAnswer,
    coachLine: tooShort
      ? "I need a real answer to score. Give it a full try next time."
      : missing
        ? `So close. Add a clear ${missing.toLowerCase()} and you're through.`
        : "Solid structure. Keep that energy next time.",
  };
}

export async function buildReport(input: ReportInput): Promise<Report> {
  try {
    const report = await llmReport(input);
    if (report) return report;
  } catch (error) {
    console.error("LLM report failed, using heuristic report:", error instanceof Error ? error.message : error);
  }
  return heuristicReport(input);
}

const WORDS_PER_SECOND = 2.2;
const DEFAULT_EXPECTED_WORDS = 40;

export function answerCoverage(wordCount: number, step: Step): number {
  const minSec = step.criteria?.minSec;
  const expected = minSec ? minSec * WORDS_PER_SECOND : DEFAULT_EXPECTED_WORDS;
  return Math.min(1, wordCount / expected);
}

export function scaleScores(scores: Omit<Scores, "overall">, coverage: number): Omit<Scores, "overall"> {
  const scale = (n: number) => Math.round(n * coverage);
  return {
    structure: scale(scores.structure),
    clarity: scale(scores.clarity),
    pace: scale(scores.pace),
    filler: scale(scores.filler),
    confidence: scale(scores.confidence),
  };
}

export function overallScore(scores: Omit<Scores, "overall">): number {
  return Math.round(0.35 * scores.structure + 0.2 * scores.clarity + 0.15 * scores.pace + 0.15 * scores.filler + 0.15 * scores.confidence);
}
