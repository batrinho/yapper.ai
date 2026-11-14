import type { Profile } from "./db/schema";

type Option = { value: string; label: string; about: string };
type Question = { id: keyof Profile; question: string; options: Option[] };

export const SURVEY: Question[] = [
  {
    id: "pronouns",
    question: "How should your coach refer to you?",
    options: [
      { value: "he", label: "He / him", about: "uses he/him" },
      { value: "she", label: "She / her", about: "uses she/her" },
      { value: "they", label: "They / them", about: "uses they/them" },
      { value: "skip", label: "Prefer not to say", about: "" },
    ],
  },
  {
    id: "goal",
    question: "What do you want to get better at?",
    options: [
      { value: "interviews", label: "Job interviews", about: "wants to do better in job interviews" },
      { value: "presenting", label: "Presenting at work", about: "wants to present better at work" },
      { value: "stories", label: "Telling stories", about: "wants to tell better stories" },
      { value: "confidence", label: "Everyday confidence", about: "wants to feel more confident speaking day to day" },
    ],
  },
  {
    id: "frequency",
    question: "How often do you speak in front of others?",
    options: [
      { value: "daily", label: "Every day", about: "speaks in front of others every day" },
      { value: "weekly", label: "A few times a week", about: "speaks in front of others a few times a week" },
      { value: "monthly", label: "A few times a month", about: "speaks in front of others a few times a month" },
      { value: "rarely", label: "Rarely", about: "rarely speaks in front of others" },
    ],
  },
  {
    id: "struggle",
    question: "What trips you up the most?",
    options: [
      { value: "fillers", label: "Filler words like “um”", about: "struggles most with filler words" },
      { value: "nerves", label: "Nerves", about: "struggles most with nerves" },
      { value: "rambling", label: "Rambling", about: "tends to ramble" },
      { value: "structure", label: "Organizing my thoughts", about: "struggles to organize their thoughts" },
    ],
  },
];

const STARTERS: Record<string, string[]> = {
  interviews: [
    "Tell me about yourself in under a minute.",
    "Tell me about a time you handled a tough deadline.",
    "What's a mistake you made at work, and what did you learn?",
  ],
  presenting: [
    "Pitch me an idea you care about in one minute.",
    "Explain what you do at work to someone outside your field.",
    "Tell me about the last presentation you gave. How did it go?",
  ],
  stories: [
    "Tell me about the best trip you've ever taken.",
    "What's a moment that changed how you see something?",
    "Tell me about something funny that happened to you recently.",
  ],
  confidence: [
    "Tell me about your week so far.",
    "What's something you could talk about for hours?",
    "Describe a goal you're working toward right now.",
  ],
};

export function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return SURVEY.every(({ id, options }) => options.some((option) => option.value === record[id]));
}

export function starterQuestions(profile: Profile | null): string[] {
  return STARTERS[profile?.goal ?? "confidence"] ?? STARTERS.confidence;
}

export function describeProfile(profile: Profile | null): string | null {
  if (!profile) return null;
  const parts = SURVEY.map(({ id, options }) => options.find((option) => option.value === profile[id])?.about).filter(Boolean);
  return parts.length ? `The user ${parts.join(", ")}.` : null;
}
