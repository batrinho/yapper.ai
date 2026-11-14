import type { Profile, SkillProfile, Step } from "./db/schema";
import type { CourseWithSteps } from "./course-state";
import { criteriaLabels } from "./criteria";
import { describeProfile } from "./onboarding";
import { describeSkillProfile } from "./skills";

export const THINK_PROVIDER = { type: "open_ai", model: "gpt-4o-mini" } as const;

export const COACHES = {
  yap: { name: "Yap", voice: "aura-2-thalia-en" },
  jensen: { name: "Jensen", voice: "aura-2-zeus-en" },
} as const;
export type CoachId = keyof typeof COACHES;

export function isCoachId(value: unknown): value is CoachId {
  return typeof value === "string" && value in COACHES;
}

type UserContext = { goal: string | null; role: string | null; notes: string[]; profile: Profile | null; skills?: SkillProfile | null };

const PROMPT = `# Role
You are {{coach_name}}, a friendly speaking coach inside the yapper.ai app, talking with the user over voice. Right now you are running one practice from a course. You play two parts: the interviewer or audience who asks the question, and the coach who gives quick feedback.

# This practice
- Course: {{course_title}}
- Lesson: {{lesson_title}}
- Goal: {{practice_goal}}
- Task question: {{task_question}}
- Pass criteria: {{pass_criteria}}
- User's name: {{user_name}}
- What you know about this user from past practices: {{user_context}}

# Objective
Help the user give one strong spoken answer to the task question. The app has already greeted the user, said the goal and asked the task question for you, so your first turn is a reply to their answer. Let the user answer fully. Then give one specific piece of feedback and ask one short follow-up question, the kind a real interviewer would ask. After two or three exchanges, or when the answer meets the goal, tell the user they can tap End to see their report. Never end the practice yourself; the user ends it.

# Guidelines
- This is a voice conversation. Keep every reply to one or two short sentences.
- Ask one question at a time.
- Never interrupt. If the user pauses mid-answer, wait or say a short prompt like "Go on."
- Feedback must be specific and kind: name one thing that worked and one thing to improve. For example: "Clear stakes. Now tell me what you did, not the team."
- {{structure_line}}
- Do not give scores or numbers. The report does the scoring.
- Do not comment on filler words during the answer. At most, mention them once in feedback if they really got in the way.
- If the user asks to try again, repeat the task question and let them start over.
- If the user goes off topic, gently bring them back to the task question.
- If you did not catch something, ask them to repeat it.
- Do not use the user's name again; the greeting already did.
- Use what you know about the user from past practices only when it fits what they just said in this answer. Never open by repeating old feedback, and don't bring up the same past note every time.
- Sound like an encouraging coach, not a cheerleader. No long praise.
- Do not use markdown formatting such as bold, italics, lists, links or code blocks. Say everything in plain spoken sentences.
- You are a cartoon coach character in the app, not a real person. If asked who you are, say you're the yapper.ai coach.

# Tools
- Use update_progress whenever you hear a new part in the user's answer. Pass which of the four parts you have heard so far: p1 = {{p1}}, p2 = {{p2}}, p3 = {{p3}}, p4 = {{p4}}.
- Use suggest_end once the answer meets the goal, right before you tell the user they can tap End.
- Never say a function name out loud, and never describe what you are tracking.`;

function structureLine(labels: string[]): string {
  const list = labels.join(", ");
  return `Guide the answer toward four parts: ${list}. If a part is missing, ask for it directly, like "What was the ${labels[3].toLowerCase()}?"`;
}

function contextSummary({ goal, role, notes, profile, skills }: UserContext): string {
  const parts = [
    describeProfile(profile),
    describeSkillProfile(skills ?? null),
    goal && `Goal: ${goal}.`,
    role && `Role: ${role}.`,
    notes.length > 0 && `Recent notes: ${notes.slice(0, 5).join(" | ")}`,
  ];
  return parts.filter(Boolean).join(" ") || "Nothing yet";
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
}

function greeting(userName: string, step: Step): string {
  return `Hi ${userName.split(" ")[0]}! Today's goal: ${step.practiceGoal}. ${step.taskQuestion}`;
}

export function coachSettings(course: CourseWithSteps, step: Step, lessonTitle: string, userName: string, context: UserContext) {
  const [p1, p2, p3, p4] = course.structureLabels;
  const prompt = fill(PROMPT, {
    course_title: course.title,
    lesson_title: lessonTitle,
    practice_goal: step.practiceGoal ?? "",
    task_question: step.taskQuestion ?? "",
    pass_criteria: step.kind === "placement" ? LEVEL_CHECK_CRITERIA : criteriaLabels(step, course.structureLabels).join("; "),
    user_name: userName,
    user_context: contextSummary(context),
    structure_line: structureLine(course.structureLabels),
    p1,
    p2,
    p3,
    p4,
  });
  return { prompt, greeting: greeting(userName, step) };
}

export type CoachSettings = ReturnType<typeof coachSettings>;

const LEVEL_CHECK_CRITERIA =
  "None. This is a level check to hear where the user is starting. Let them answer, give one light piece of feedback, ask at most one follow-up, then tell them they can tap End.";

export const TRIAL_LABELS = ["Opening", "Main point", "Example", "Wrap-up"];

/** Settings for the free first chat in onboarding, started from a question the user picked. */
export function trialSettings(userName: string, context: UserContext, question: string): CoachSettings {
  const [p1, p2, p3, p4] = TRIAL_LABELS;
  const prompt = fill(PROMPT, {
    course_title: "First chat",
    lesson_title: "Getting to know you",
    practice_goal: "a relaxed first conversation so you can hear how the user speaks",
    task_question: question,
    pass_criteria: "None. Keep it friendly and short: two or three exchanges, one encouraging tip, then tell them they can tap End.",
    user_name: userName,
    user_context: contextSummary(context),
    structure_line: structureLine(TRIAL_LABELS),
    p1,
    p2,
    p3,
    p4,
  });
  return { prompt, greeting: `Hi ${userName.split(" ")[0]}! Great to meet you. Let's start easy: ${question}` };
}

export function agentSettingsMessage(settings: CoachSettings, labels: string[], inputSampleRate: number, greeting: string | null, coach: CoachId) {
  const flags = Object.fromEntries(
    labels.map((label, i) => [`p${i + 1}`, { type: "boolean", description: `True once the user has covered the ${label}.` }]),
  );
  return {
    type: "Settings",
    audio: {
      input: { encoding: "linear16", sample_rate: inputSampleRate },
      output: { encoding: "linear16", sample_rate: 24000, container: "none" },
    },
    agent: {
      listen: { provider: { type: "deepgram", model: "nova-3", language: "en" } },
      think: {
        provider: THINK_PROVIDER,
        prompt: fill(settings.prompt, { coach_name: COACHES[coach].name }),
        functions: [
          {
            name: "update_progress",
            description: "Report which of the four answer parts the user has covered so far.",
            parameters: { type: "object", properties: flags, required: ["p1", "p2", "p3", "p4"] },
          },
          {
            name: "suggest_end",
            description: "Call once the answer meets the goal, right before telling the user they can tap End.",
            parameters: { type: "object", properties: {} },
          },
        ],
      },
      speak: { provider: { type: "deepgram", model: COACHES[coach].voice } },
      ...(greeting && { greeting }),
    },
  };
}
