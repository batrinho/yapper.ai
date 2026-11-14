import { neon } from "@neondatabase/serverless";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { loadLocalEnv } from "../load-env";
import { courses, steps, type Criteria, type Takeaway } from "./schema";

type VideoSeed = {
  kind: "video";
  id: string;
  title: string;
  durationMin: number;
  youtubeId: string;
  speakerName: string;
  speakerRole: string;
  takeaways: Takeaway[];
};

type PracticeSeed = {
  kind: "placement" | "practice" | "final";
  id: string;
  title: string;
  durationMin: number;
  required: boolean;
  practiceGoal: string;
  taskQuestion: string;
  minScore?: number;
  criteria: Criteria;
};

type CourseSeed = {
  id: string;
  title: string;
  description: string;
  structureLabels: string[];
  steps: (VideoSeed | PracticeSeed)[];
};

const storytelling: CourseSeed = {
  id: "storytelling",
  title: "Storytelling",
  description:
    "Tell stories people remember. Learn the hook, the stakes, the turn and the landing, then tell one out loud to your coach.",
  structureLabels: ["Hook", "Stakes", "Turn", "Landing"],
  steps: [
    {
      kind: "placement",
      id: "st-level-check",
      title: "Level check",
      durationMin: 3,
      required: false,
      practiceGoal: "show your coach how you tell a story today",
      taskQuestion: "Tell me about a moment that surprised you recently.",
      minScore: 0,
      criteria: { requireStructure: false },
    },
    {
      kind: "video",
      id: "st-stories-beat-data",
      title: "Why stories beat data",
      durationMin: 14,
      youtubeId: "Ez5yS4Q5ASA",
      speakerName: "TEDx Talks",
      speakerRole: "Karen Eber, TEDxPurdueU",
      takeaways: [
        { title: "Data informs, stories persuade", body: "Numbers alone rarely change minds. Wrap the key number inside a moment people can picture." },
        { title: "Stories build trust", body: "A specific experience feels more honest than a slide full of averages." },
        { title: "Pair the two", body: "Lead with the story, then let one number prove it." },
      ],
    },
    {
      kind: "practice",
      id: "st-origin-story",
      title: "Your 30-second origin story",
      durationMin: 4,
      required: false,
      practiceGoal: "a 30-second origin story",
      taskQuestion: "How did you end up doing what you do?",
      criteria: { requireStructure: false, minSec: 20, maxSec: 60 },
    },
    {
      kind: "video",
      id: "st-what-is-a-story",
      title: "What makes something a story",
      durationMin: 18,
      youtubeId: "enzuCJNA3Qg",
      speakerName: "TEDx Talks",
      speakerRole: "Matthew Dicks, Moth StorySLAM champion",
      takeaways: [
        { title: "A story is about change", body: "If nobody changes from start to end, it's an anecdote, not a story." },
        { title: "Find the five-second moment", body: "Every good story hangs on one instant where something shifts." },
        { title: "Start close to the end", body: "Open as near to the change as you can and skip the backstory." },
      ],
    },
    {
      kind: "practice",
      id: "st-changed-your-mind",
      title: "The moment you changed your mind",
      durationMin: 5,
      required: true,
      practiceGoal: "one clear turning point",
      taskQuestion: "Tell me about a moment you changed your mind about something.",
      criteria: { requireStructure: true, minSec: 45, maxSec: 120 },
    },
    {
      kind: "video",
      id: "st-clues-to-a-great-story",
      title: "The clues to a great story",
      durationMin: 19,
      youtubeId: "KxDwieKpawg",
      speakerName: "TED",
      speakerRole: "Andrew Stanton, Pixar filmmaker",
      takeaways: [
        { title: "Make a promise early", body: "Your first line should promise that the story is worth the listener's time." },
        { title: "Give clues, not answers", body: "Audiences love to work out what's happening. Don't explain everything." },
        { title: "Know your ending", body: "Every detail should point toward the punchline you already have in mind." },
      ],
    },
    {
      kind: "video",
      id: "st-science-of-storytelling",
      title: "The science of the turn",
      durationMin: 16,
      youtubeId: "Nj-hdQMa3uA",
      speakerName: "TEDx Talks",
      speakerRole: "David JP Phillips, communication coach",
      takeaways: [
        { title: "Suspense holds attention", body: "Build tension before the turn so the listener needs to know what happens." },
        { title: "Make us care about someone", body: "An empathetic character makes the turn land emotionally." },
        { title: "Humor relaxes the room", body: "A light moment before the turn makes people more open to it." },
      ],
    },
    {
      kind: "practice",
      id: "st-turning-point",
      title: "Tell a turning point",
      durationMin: 6,
      required: true,
      practiceGoal: "a turn that lands",
      taskQuestion: "Tell me about a day that didn't go the way you expected.",
      criteria: { requireStructure: true, minSec: 60, maxSec: 150, maxFillers: 4 },
    },
    {
      kind: "video",
      id: "st-seven-keys",
      title: "Seven keys to good storytelling",
      durationMin: 9,
      youtubeId: "iV0M5l5KhnE",
      speakerName: "TEDx Talks",
      speakerRole: "Josh Campbell, TEDxMemphis",
      takeaways: [
        { title: "Know who you're telling it to", body: "Pick the details that matter to this audience and drop the rest." },
        { title: "Show a struggle", body: "A story needs something in the way. Name the obstacle clearly." },
        { title: "Land with meaning", body: "Finish on what changed and why it matters, then stop talking." },
      ],
    },
    {
      kind: "practice",
      id: "st-three-lengths",
      title: "One story, under a minute",
      durationMin: 5,
      required: false,
      practiceGoal: "the same story, shorter",
      taskQuestion: "Tell me your favorite story in under a minute.",
      criteria: { requireStructure: true, minSec: 30, maxSec: 60 },
    },
    {
      kind: "video",
      id: "st-business-storytelling",
      title: "Business storytelling made easy",
      durationMin: 13,
      youtubeId: "WKIZ0bicfFw",
      speakerName: "TEDx Talks",
      speakerRole: "Kelly Parker, TEDxBalchStreet",
      takeaways: [
        { title: "Stories belong at work", body: "Updates, pitches and one-on-ones all land better with a short story." },
        { title: "Make the customer the hero", body: "Tell it from the point of view of the person you helped, not your team." },
        { title: "Tie it to the ask", body: "Every work story should point to a decision or next step." },
      ],
    },
    {
      kind: "final",
      id: "st-signature-story",
      title: "Your signature story",
      durationMin: 10,
      required: true,
      practiceGoal: "your signature story",
      taskQuestion: "Tell me the story that best explains who you are.",
      minScore: 75,
      criteria: { requireStructure: true, maxFillers: 4 },
    },
  ],
};

const publicSpeaking: CourseSeed = {
  id: "public-speaking",
  title: "Public speaking",
  description: "Own the room from the first line. Practice openings, clear points and strong closes out loud.",
  structureLabels: ["Open", "Point", "Proof", "Close"],
  steps: [
    {
      kind: "placement",
      id: "ps-level-check",
      title: "Level check",
      durationMin: 3,
      required: false,
      practiceGoal: "show your coach how you speak to a room today",
      taskQuestion: "Imagine you're opening a talk to a room of strangers. Introduce yourself and one idea you care about.",
      minScore: 0,
      criteria: { requireStructure: false },
    },
    {
      kind: "video",
      id: "ps-stress-your-friend",
      title: "Make stress your friend",
      durationMin: 14,
      youtubeId: "RcGyVTAoXEU",
      speakerName: "TED",
      speakerRole: "Kelly McGonigal, health psychologist",
      takeaways: [
        { title: "Nerves are energy", body: "A racing heart is your body getting ready to perform, not a sign you'll fail." },
        { title: "Your view of stress matters", body: "Seeing stress as helpful changes how your body responds to it." },
        { title: "Reach out", body: "Talking to a friendly face before you speak calms the stress response." },
      ],
    },
    {
      kind: "practice",
      id: "ps-introduce-yourself",
      title: "Introduce yourself to a room",
      durationMin: 4,
      required: true,
      practiceGoal: "a confident 30-second intro",
      taskQuestion: "Introduce yourself to a room of strangers.",
      criteria: { requireStructure: false, minSec: 20, maxSec: 60 },
    },
    {
      kind: "video",
      id: "ps-start-a-speech",
      title: "How to start a speech",
      durationMin: 6,
      youtubeId: "9HJ0AHfx7BE",
      speakerName: "Philipp Humm",
      speakerRole: "Public speaking coach",
      takeaways: [
        { title: "Skip the warm-up", body: "Don't open with thank-yous. Start with a question, a surprise or a story." },
        { title: "Make a big promise", body: "Tell people what they'll get from the next few minutes." },
        { title: "Earn the next minute", body: "Your opening is a promise. Make one worth keeping." },
      ],
    },
    {
      kind: "video",
      id: "ps-structure-of-great-talks",
      title: "The structure of great talks",
      durationMin: 18,
      youtubeId: "1nYFpuc2Umk",
      speakerName: "TEDx Talks",
      speakerRole: "Nancy Duarte, TEDxEast",
      takeaways: [
        { title: "Contrast what is with what could be", body: "Great talks move back and forth between today and a better future." },
        { title: "One big idea", body: "Everything in the talk should serve the single idea you want remembered." },
        { title: "End on the new bliss", body: "Close by painting the future your audience gets if they act." },
      ],
    },
    {
      kind: "practice",
      id: "ps-one-minute-pitch",
      title: "The one-minute pitch",
      durationMin: 5,
      required: false,
      practiceGoal: "one idea in one minute",
      taskQuestion: "Pitch me an idea you care about in one minute.",
      criteria: { requireStructure: true, minSec: 40, maxSec: 75 },
    },
    {
      kind: "video",
      id: "ps-speak-so-people-listen",
      title: "Speak so people want to listen",
      durationMin: 10,
      youtubeId: "eIho2S0ZahI",
      speakerName: "TED",
      speakerRole: "Julian Treasure, sound and communication expert",
      takeaways: [
        { title: "Vary your pace", body: "Slow down for key points and speed up for stories to keep attention." },
        { title: "Use silence", body: "A pause is more powerful than an “um.” Let important lines breathe." },
        { title: "Speak from honesty", body: "Integrity and authenticity make people trust what you say." },
      ],
    },
    {
      kind: "video",
      id: "ps-you-are-contagious",
      title: "Body language that connects",
      durationMin: 18,
      youtubeId: "cef35Fk7YD8",
      speakerName: "TEDx Talks",
      speakerRole: "Vanessa Van Edwards, behavioral researcher",
      takeaways: [
        { title: "First impressions are fast", body: "People decide about you in seconds, mostly from your body language." },
        { title: "Show your hands", body: "Visible, open hands signal trust. Keep them out of your pockets." },
        { title: "Emotions are contagious", body: "The energy you bring is the energy the room gives back." },
      ],
    },
    {
      kind: "video",
      id: "ps-handling-qa-video",
      title: "Handling Q&A sessions",
      durationMin: 13,
      youtubeId: "jHIfj011QRY",
      speakerName: "Think Fast Talk Smart",
      speakerRole: "Stanford GSB communication podcast",
      takeaways: [
        { title: "Listen to the whole question", body: "Resist answering before the person finishes. It shows respect and buys time." },
        { title: "Answer, then bridge", body: "Give a short direct answer, then connect it back to your main point." },
        { title: "Own what you don't know", body: "Say you'll find out, and then follow up." },
      ],
    },
    {
      kind: "practice",
      id: "ps-handling-qa",
      title: "Handling tough Q&A",
      durationMin: 6,
      required: true,
      practiceGoal: "a calm, clear answer",
      taskQuestion: "Your project is over budget. Why should we keep funding it?",
      criteria: { requireStructure: true, maxFillers: 3 },
    },
    {
      kind: "video",
      id: "ps-end-a-speech",
      title: "How to end a speech with impact",
      durationMin: 5,
      youtubeId: "4LZu4KQ4vZU",
      speakerName: "Alexander Lyon Communication Coach",
      speakerRole: "Communication coach",
      takeaways: [
        { title: "Signal the end", body: "A clear transition tells the audience to lean in for the final point." },
        { title: "Make one ask", body: "Tell people exactly what to do next." },
        { title: "Finish strong, then stop", body: "End on your best line. Don't trail off with “so, yeah.”" },
      ],
    },
    {
      kind: "final",
      id: "ps-five-minute-talk",
      title: "Your five-minute talk",
      durationMin: 12,
      required: true,
      practiceGoal: "a full talk, start to finish",
      taskQuestion: "Give a short talk on something you know well.",
      minScore: 75,
      criteria: { requireStructure: true, maxFillers: 5 },
    },
  ],
};

const behavioral: CourseSeed = {
  id: "behavioral-interview",
  title: "Behavioral interview prep",
  description:
    "Turn real experience into crisp, memorable answers. Watch a short lecture, then say it out loud to a coach that grades structure, pace and filler words.",
  structureLabels: ["Situation", "Task", "Action", "Result"],
  steps: [
    {
      kind: "placement",
      id: "bi-level-check",
      title: "Level check",
      durationMin: 3,
      required: false,
      practiceGoal: "show your coach how you answer interview questions today",
      taskQuestion: "Tell me about a time you solved a hard problem at work or school.",
      minScore: 0,
      criteria: { requireStructure: false },
    },
    {
      kind: "video",
      id: "bi-answer-behavioral-questions",
      title: "How to answer behavioral questions",
      durationMin: 10,
      youtubeId: "TT-n6Xo5XX4",
      speakerName: "Cass Thompson Career Advice",
      speakerRole: "Career coach",
      takeaways: [
        { title: "They grade evidence", body: "“I'm a team player” scores nothing. A specific moment that shows it scores everything." },
        { title: "Past predicts future", body: "Interviewers ask about what you did because it hints at what you'll do." },
        { title: "Prepare a few stories", body: "Five strong stories can cover most behavioral questions." },
      ],
    },
    {
      kind: "practice",
      id: "bi-tell-me-about-yourself",
      title: "Tell me about yourself",
      durationMin: 5,
      required: true,
      practiceGoal: "a 60-second intro",
      taskQuestion: "Tell me about yourself.",
      criteria: { requireStructure: false, minSec: 45, maxSec: 90 },
    },
    {
      kind: "video",
      id: "bi-star-technique",
      title: "The STAR technique, decoded",
      durationMin: 11,
      youtubeId: "uQEuo7woEEk",
      speakerName: "CareerVidz",
      speakerRole: "Interview coach",
      takeaways: [
        { title: "Keep the setup short", body: "Situation and Task together should take one or two sentences." },
        { title: "Action is the main event", body: "Spend most of your answer on what you did and why." },
        { title: "Always land the Result", body: "End with a positive, concrete outcome." },
      ],
    },
    {
      kind: "practice",
      id: "bi-rapid-fire-star",
      title: "Rapid-fire STAR drills",
      durationMin: 4,
      required: false,
      practiceGoal: "four parts in 60 seconds",
      taskQuestion: "Tell me about a time you fixed a mistake.",
      minScore: 65,
      criteria: { requireStructure: true, minSec: 30, maxSec: 90 },
    },
    {
      kind: "video",
      id: "bi-sample-answers",
      title: "Behavioral answers that stick",
      durationMin: 8,
      youtubeId: "IV30jAw7dxA",
      speakerName: "Self Made Millennial",
      speakerRole: "Career coach",
      takeaways: [
        { title: "Lead with stakes, not setup", body: "One or two sentences of context. Interviewers want to know why it mattered." },
        { title: "Make “I” the hero of the Action", body: "Say what you did, not what the team did. Specific verbs beat vague ones." },
        { title: "Land a measurable Result", body: "End on a number or a clear outcome, then one line on what you learned." },
      ],
    },
    {
      kind: "practice",
      id: "bi-disagreeing-with-a-teammate",
      title: "Disagreeing with a teammate",
      durationMin: 6,
      required: true,
      practiceGoal: "one crisp STAR answer",
      taskQuestion: "Tell me about a time you disagreed with a teammate.",
      criteria: { requireStructure: true, minSec: 60, maxSec: 120, maxFillers: 3 },
    },
    {
      kind: "video",
      id: "bi-unprepared-questions",
      title: "Handling questions you didn't prepare for",
      durationMin: 7,
      youtubeId: "ZqNorUIgIe8",
      speakerName: "Jeff Su",
      speakerRole: "Career and productivity coach",
      takeaways: [
        { title: "Pause before you answer", body: "A one-beat pause reads as thoughtful, not stuck." },
        { title: "Buy time honestly", body: "Repeat or clarify the question while you pick a story." },
        { title: "Reuse your best stories", body: "Most follow-ups can be answered by a story you already prepared." },
      ],
    },
    {
      kind: "practice",
      id: "bi-follow-up-gauntlet",
      title: "The follow-up gauntlet",
      durationMin: 5,
      required: false,
      practiceGoal: "stay specific under pressure",
      taskQuestion: "Tell me about a project that didn't go to plan.",
      criteria: { requireStructure: true },
    },
    {
      kind: "video",
      id: "bi-biggest-weakness",
      title: "Weakness and failure questions",
      durationMin: 13,
      youtubeId: "UX_dxcjp5Gw",
      speakerName: "CareerVidz",
      speakerRole: "Interview coach",
      takeaways: [
        { title: "Pick a real weakness", body: "Fake ones like “I work too hard” cost you trust instantly." },
        { title: "Show the repair", body: "Spend most of your answer on what you changed and how you know it worked." },
        { title: "Keep it relevant but safe", body: "Choose a weakness that won't sink you for this specific role." },
      ],
    },
    {
      kind: "final",
      id: "bi-mock-interview",
      title: "15-minute mock interview",
      durationMin: 15,
      required: true,
      practiceGoal: "a full mock interview",
      taskQuestion: "Tell me about a time you led without authority.",
      minScore: 75,
      criteria: { requireStructure: true, maxFillers: 5 },
    },
  ],
};

const SEED: CourseSeed[] = [storytelling, publicSpeaking, behavioral];

const OVERLINES = { placement: "Level check · Start here", practice: "Practice", final: "Final practice" };

function stepRows(course: CourseSeed) {
  let lesson = 0;
  return course.steps.map((step, position) => {
    if (step.kind === "video") {
      lesson += 1;
      return { ...step, courseId: course.id, position, overline: `Lesson ${lesson} · Video`, required: false };
    }
    return {
      ...step,
      courseId: course.id,
      position,
      overline: OVERLINES[step.kind],
      minScore: step.minScore ?? 70,
    };
  });
}

async function seed() {
  loadLocalEnv();
  if (!process.env.DATABASE_URL) throw new Error("Missing environment variable: DATABASE_URL. Add it to frontend/.env.local.");
  const db = drizzle(neon(process.env.DATABASE_URL));

  for (const [sortOrder, course] of SEED.entries()) {
    const courseRow = { id: course.id, title: course.title, description: course.description, structureLabels: course.structureLabels };
    await db
      .insert(courses)
      .values({ ...courseRow, sortOrder })
      .onConflictDoUpdate({ target: courses.id, set: { ...courseRow, sortOrder } });

    const rows = stepRows(course);
    for (const row of rows) {
      await db.insert(steps).values(row).onConflictDoUpdate({ target: steps.id, set: row });
    }
    await db.delete(steps).where(and(eq(steps.courseId, course.id), notInArray(steps.id, rows.map((r) => r.id))));
  }

  await db.delete(courses).where(notInArray(courses.id, SEED.map((c) => c.id)));
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(steps);
  console.log(`Seeded ${SEED.length} courses and ${count} steps.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
