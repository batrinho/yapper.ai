import { SKILL_KEYS, type SkillKey, type SkillProfile, type Skills } from "./db/schema";

export type SkillInfo = { key: SkillKey; label: string; short: string; description: string };

export const SKILLS: SkillInfo[] = [
  { key: "fluency", label: "Fluency", short: "fluency", description: "Smooth flow, steady pace, few fillers and stalls" },
  {
    key: "pronunciation",
    label: "Pronunciation & Articulation",
    short: "pronunciation",
    description: "How clearly each word comes through",
  },
  { key: "grammar", label: "Grammar & Syntax", short: "grammar", description: "Correct, varied sentences" },
  { key: "vocabulary", label: "Vocabulary", short: "vocabulary", description: "Range and precision of word choice" },
  { key: "cohesion", label: "Cohesion", short: "cohesion", description: "Ideas linked into one clear line" },
];

/** How far one full-length practice moves the running profile toward its scores. */
const PROFILE_WEIGHT = 0.35;
const LOW_CONFIDENCE = 0.6;
const LONG_PAUSE_SEC = 1.5;

type TimedWord = { word: string; start: number; end: number; confidence?: number };

/** Delivery signals the transcript text alone can't show, measured from Deepgram word timings and confidence. */
export type SpeechSignals = { meanConfidence: number | null; unclearWords: string[]; longPauses: number };

export function speechSignals(words: TimedWord[]): SpeechSignals {
  const confidences = words.map((w) => w.confidence).filter((c): c is number => typeof c === "number");
  const meanConfidence = confidences.length ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length : null;
  const unclearWords = words.filter((w) => (w.confidence ?? 1) < LOW_CONFIDENCE).map((w) => w.word);
  let longPauses = 0;
  for (let i = 1; i < words.length; i++) if (words[i].start - words[i - 1].end >= LONG_PAUSE_SEC) longPauses += 1;
  return { meanConfidence, unclearWords, longPauses };
}

export function describeSignals(signals: SpeechSignals, wpm: number, fillersPerMinute: number): string {
  const confidence = signals.meanConfidence === null ? "unknown" : signals.meanConfidence.toFixed(2);
  const unclear = signals.unclearWords.length ? signals.unclearWords.slice(0, 12).join(", ") : "none";
  return [
    `Pace: ${wpm} words per minute (120 to 160 is ideal).`,
    `Filler words: ${fillersPerMinute.toFixed(1)} per minute.`,
    `Pauses of ${LONG_PAUSE_SEC}s or longer: ${signals.longPauses}.`,
    `Speech recognizer mean word confidence: ${confidence} (0 to 1; above 0.9 means very clear articulation).`,
    `Words the recognizer was unsure of: ${unclear}.`,
  ].join("\n");
}

const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)));

export function clampSkills(skills: Skills): Skills {
  return mapSkills((key) => clamp(skills[key]));
}

export function mapSkills(fn: (key: SkillKey) => number): Skills {
  return Object.fromEntries(SKILL_KEYS.map((key) => [key, fn(key)])) as Skills;
}

const CONNECTIVES =
  /\b(because|so|then|but|however|after|before|first|second|finally|also|although|instead|which|while|as a result|that's why|in the end|for example|for instance)\b/g;

/** Fallback skill scores when no LLM is available. */
export function heuristicSkills(transcript: string, signals: SpeechSignals, pace: number, filler: number): Skills {
  const words = transcript.toLowerCase().match(/[a-z']+/g) ?? [];
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const lengthPenalty = words.length < 30 ? 30 : words.length < 80 ? 10 : 0;
  const sample = words.slice(0, 120);
  const typeTokenRatio = sample.length ? new Set(sample).size / sample.length : 0;
  const avgSentence = sentences.length ? words.length / sentences.length : words.length;
  const connectivesPer100 = words.length ? ((transcript.toLowerCase().match(CONNECTIVES)?.length ?? 0) / words.length) * 100 : 0;
  const confidence = signals.meanConfidence ?? 0.85;

  return clampSkills({
    fluency: 0.5 * pace + 0.5 * filler - signals.longPauses * 4 - lengthPenalty / 2,
    pronunciation: 40 + (confidence - 0.75) * 240 - signals.unclearWords.length * 2,
    grammar: 82 - (avgSentence > 30 ? 15 : 0) - lengthPenalty,
    vocabulary: 50 + (typeTokenRatio - 0.4) * 150 - lengthPenalty,
    cohesion: 45 + connectivesPer100 * 6 - lengthPenalty,
  });
}

/** Scales a practice's skill scores by how much of a full answer was given, like the other report scores. */
export function scaleSkills(skills: Skills, coverage: number): Skills {
  return mapSkills((key) => Math.round(skills[key] * coverage));
}

/**
 * The first practice sets the baseline. After that the profile moves toward each practice's scores,
 * further for full answers and barely at all for a few words, so one bad try can't wipe out progress.
 */
export function nextSkillProfile(profile: SkillProfile | null, skills: Skills, coverage: number, now = new Date()): SkillProfile {
  if (!profile) return { current: skills, previous: null, practices: 1, updatedAt: now.toISOString() };
  const weight = PROFILE_WEIGHT * coverage;
  const current = mapSkills((key) => clamp(profile.current[key] + (skills[key] - profile.current[key]) * weight));
  return { current, previous: profile.current, practices: profile.practices + 1, updatedAt: now.toISOString() };
}

export function averageSkill(skills: Skills): number {
  return Math.round(SKILL_KEYS.reduce((sum, key) => sum + skills[key], 0) / SKILL_KEYS.length);
}

export function rankedSkills(skills: Skills): SkillInfo[] {
  return [...SKILLS].sort((a, b) => skills[b.key] - skills[a.key]);
}

/** One line for the coach prompt. */
export function describeSkillProfile(profile: SkillProfile | null): string | null {
  if (!profile) return null;
  const ranked = rankedSkills(profile.current);
  const scores = SKILLS.map((s) => `${s.short} ${profile.current[s.key]}`).join(", ");
  return `Speaking skills out of 100: ${scores}. Strongest: ${ranked[0].short}. Needs most work: ${ranked[ranked.length - 1].short}.`;
}
