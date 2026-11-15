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
  /** Shown instead of the summed video length; see the README for why. */
  durationLabel: string;
  steps: (VideoSeed | PracticeSeed)[];
};

type Pair = [title: string, body: string];

function video(id: string, title: string, durationMin: number, youtubeId: string, speakerName: string, speakerRole: string, takeaways: Pair[]): VideoSeed {
  return { kind: "video", id, title, durationMin, youtubeId, speakerName, speakerRole, takeaways: takeaways.map(([t, body]) => ({ title: t, body })) };
}

function levelCheck(id: string, practiceGoal: string, taskQuestion: string): PracticeSeed {
  return { kind: "placement", id, title: "Level check", durationMin: 3, required: false, practiceGoal, taskQuestion, minScore: 0, criteria: { requireStructure: false } };
}

type PracticeOptions = { required?: boolean; final?: boolean; minScore?: number; durationMin?: number };

function practice(id: string, title: string, practiceGoal: string, taskQuestion: string, criteria: Criteria, options: PracticeOptions = {}): PracticeSeed {
  return {
    kind: options.final ? "final" : "practice",
    id,
    title,
    durationMin: options.durationMin ?? (options.final ? 10 : 5),
    required: options.required ?? options.final ?? false,
    practiceGoal,
    taskQuestion,
    minScore: options.minScore ?? (options.final ? 75 : undefined),
    criteria,
  };
}

const introduceYourself: CourseSeed = {
  id: "introduce-yourself",
  title: "Introduce Yourself & Your Work",
  description:
    "Nail the first minute. Learn to say who you are, what you do and why it matters, in a way people remember, then practice it out loud with your coach.",
  structureLabels: ["Present", "Past", "Proof", "Future"],
  durationLabel: "10+ hours",
  steps: [
    levelCheck("iy-level-check", "show your coach how you introduce yourself today", "Introduce yourself as if we just met at a work event."),
    video("iy-introduce-and-get-hired", "How to introduce yourself and get hired", 9, "d1yfb93beSI", "TED", "Rebecca Okamoto, career coach", [
      ["Lead with what you love", "Open with the work that energizes you, not a list of job titles."],
      ["Connect it to them", "Tie your story to what the listener cares about or needs."],
      ["Keep it a conversation", "A good intro invites a question back instead of ending the chat."],
    ]),
    practice("iy-thirty-second-intro", "Your 30-second intro", "a clear 30-second introduction", "Introduce yourself to a new teammate in about 30 seconds.", {
      requireStructure: false,
      minSec: 20,
      maxSec: 60,
    }),
    video("iy-introduction-formula", "A formula for introducing yourself", 5, "5c5P8YQeymI", "Vanessa Van Edwards", "Behavioral researcher, Science of People", [
      ["Skip the boring script", "Name and job title alone are forgettable. Add one hook people can ask about."],
      ["Give a conversation spark", "Mention something you're working on or excited about right now."],
      ["Practice it ahead of time", "A rehearsed intro sounds natural because you're not searching for words."],
    ]),
    video("iy-so-what-do-you-do", "Answering “So what do you do?”", 12, "Ow9qahWkFeQ", "TEDx Talks", "TEDx speaker on self-introductions", [
      ["Say the problem you solve", "People remember the difference you make more than your title."],
      ["Make it easy to picture", "Use plain words someone outside your field would understand."],
      ["Leave room for curiosity", "A short, intriguing answer gets a follow-up question."],
    ]),
    practice("iy-what-do-you-do", "So, what do you do?", "a jargon-free answer about your work", "So, what do you do?", { requireStructure: true, minSec: 30, maxSec: 75 }, { required: true }),
    video("iy-tell-me-about-yourself", "Tell me about yourself", 7, "kayOhGRcNt4", "Linda Raynier", "Career strategist", [
      ["Present, past, future", "Start with what you do now, add how you got here, end with where you're going."],
      ["Tailor it to the room", "Pick the parts of your story that matter for this role or audience."],
      ["Keep it short", "Aim for one to two minutes. Leave details for follow-up questions."],
    ]),
    video("iy-structure-a-strong-answer", "Structure a strong answer about yourself", 9, "es7XtrloDIQ", "Jeff Su", "Career and productivity coach", [
      ["Have a clear structure", "A simple order keeps you from rambling through your whole résumé."],
      ["Pick two or three highlights", "Choose the wins that best prove you can do the job."],
      ["End on why you're here", "Close by linking your story to this opportunity."],
    ]),
    practice("iy-tell-me-about-yourself-practice", "Tell me about yourself", "a 60-second intro with present, past, proof and future", "Tell me about yourself.", {
      requireStructure: true,
      minSec: 45,
      maxSec: 90,
    }),
    video("iy-elevator-pitch", "The perfect elevator pitch", 8, "r-iETptU7JY", "Patrick Dang", "Sales and communication coach", [
      ["Who you help", "Start with the people you serve, not with yourself."],
      ["The result you bring", "Name the outcome they get from working with you."],
      ["Ask for the next step", "A pitch should end with a clear, easy next step."],
    ]),
    video("iy-personal-brand", "Building a personal brand you feel good about", 6, "ozMCb0wOnMU", "TED", "The Way We Work series", [
      ["Decide what you want to be known for", "Pick the few strengths you want people to link to your name."],
      ["Be consistent", "Your brand is what you repeatedly do and say, not a slogan."],
      ["Stay authentic", "A brand built on who you really are is easier to keep up."],
    ]),
    practice("iy-elevator-pitch-practice", "Your elevator pitch", "a 45-second pitch with a clear ask", "You're in an elevator with a senior leader you admire. Pitch yourself before the doors open.", {
      requireStructure: true,
      minSec: 30,
      maxSec: 60,
      maxFillers: 3,
    }, { required: true }),
    video("iy-star-technique", "Talk about your work with STAR", 11, "uQEuo7woEEk", "CareerVidz", "Interview coach", [
      ["Keep the setup short", "Situation and task together should take one or two sentences."],
      ["Action is the main event", "Spend most of your answer on what you did and why."],
      ["Always land the result", "End with a positive, concrete outcome."],
    ]),
    video("iy-first-impression", "How to make a good first impression", 9, "iq2iGMtpF58", "TEDx Talks", "Laura Huang, Harvard Business School", [
      ["Impressions form fast", "People judge in seconds, so your first lines carry extra weight."],
      ["Find your edge", "Turn what makes you different into a strength people remember."],
      ["Guide the impression", "Shape how others see you instead of leaving it to chance."],
    ]),
    practice("iy-proudest-work", "Your proudest piece of work", "one specific win, told with numbers", "Tell me about the piece of work you're proudest of.", {
      requireStructure: true,
      minSec: 45,
      maxSec: 120,
    }),
    video("iy-small-talk", "Small talk, big connections", 6, "hs-61K-bJds", "TEDx Talks", "Sam Bradford, TEDxASUWest", [
      ["Small talk opens doors", "Light conversation is how trust and real connection begin."],
      ["Be curious first", "Ask about the other person before talking about yourself."],
      ["Follow the thread", "Build on what they say instead of jumping to your next line."],
    ]),
    practice("iy-networking-intro", "Introduce yourself at a networking event", "a natural intro that invites a question back", "We just met at a networking event. Introduce yourself and what you're working on.", {
      requireStructure: true,
      maxFillers: 4,
    }, { final: true }),
  ],
};

const speakUp: CourseSeed = {
  id: "speak-up",
  title: "Speak Up: Status Updates & Public Speaking",
  description:
    "Be clear in every meeting. Give status updates that lead with the headline, speak up without freezing and present to a room with confidence.",
  structureLabels: ["Headline", "Progress", "Blockers", "Next steps"],
  durationLabel: "12+ hours",
  steps: [
    levelCheck("su-level-check", "show your coach how you give an update today", "Give me a quick update on something you're working on this week."),
    video("su-speaking-up", "Speaking up without freaking out", 14, "XIXvKKEQQJo", "TEDx Talks", "Matt Abrahams, Stanford GSB lecturer", [
      ["Anxiety is normal", "Nearly everyone feels nervous. Notice it, name it and keep going."],
      ["Make it a conversation", "Treat a talk like a chat with the audience, not a performance."],
      ["Use a simple structure", "What, so what, now what keeps you clear even when nervous."],
    ]),
    practice("su-weekly-update", "Your weekly update", "a 45-second update that leads with the headline", "Give me your status update for this week.", {
      requireStructure: true,
      minSec: 30,
      maxSec: 75,
    }),
    video("su-speak-up-anyway", "How to speak up, even when you don't want to", 12, "fkOMupkw5D8", "TED", "Sarah Crawford-Bohl, TED", [
      ["Your view is useful", "Staying quiet keeps useful ideas out of the room."],
      ["Start small", "Ask a question or build on someone's point to get your voice in early."],
      ["Prepare one point", "Walk in with one thing you want to say and look for the moment."],
    ]),
    video("su-bottom-line-up-front", "Lead with the bottom line", 7, "8bZGi3yz4qg", "Jeff Su", "Career and productivity coach", [
      ["Bottom line up front", "Start with the conclusion or the ask, then give the details."],
      ["Respect people's time", "Busy listeners decide in the first sentence whether to pay attention."],
      ["Details on demand", "Offer more context only if they need it."],
    ]),
    practice("su-bad-news-update", "Deliver a delay", "a calm update that names the blocker and the plan", "Your project will miss its deadline by a week. Tell your manager.", {
      requireStructure: true,
      minSec: 30,
      maxSec: 90,
      maxFillers: 4,
    }, { required: true }),
    video("su-stop-rambling", "Stop rambling", 5, "5m-C5mwpmxU", "Vinh Giang", "Communication coach", [
      ["Pick your structure first", "Decide your points before you start talking."],
      ["Keep it tight", "Fewer, sharper points beat a long list."],
      ["Land it and stop", "Finish your last point, then stop talking."],
    ]),
    video("su-ted-secret", "The secret to great public speaking", 8, "-FOCpMAww28", "TED", "Chris Anderson, head of TED", [
      ["One idea", "Pick one idea and make everything in the talk serve it."],
      ["Give a reason to care", "Spark curiosity before you explain anything."],
      ["Build from what they know", "Use familiar concepts and examples to explain the new idea."],
    ]),
    practice("su-meeting-point", "Make your point in a meeting", "one clear point in under a minute", "The team is debating which feature to build next. Make your case.", {
      requireStructure: true,
      minSec: 30,
      maxSec: 60,
    }),
    video("su-stress-your-friend", "Make stress your friend", 14, "RcGyVTAoXEU", "TED", "Kelly McGonigal, health psychologist", [
      ["Nerves are energy", "A racing heart is your body getting ready to perform, not a sign you'll fail."],
      ["Your view of stress matters", "Seeing stress as helpful changes how your body responds to it."],
      ["Reach out", "Talking to a friendly face before you speak calms the stress response."],
    ]),
    video("su-start-a-speech", "How to start a speech", 6, "9HJ0AHfx7BE", "Philipp Humm", "Public speaking coach", [
      ["Skip the warm-up", "Don't open with thank-yous. Start with a question, a surprise or a story."],
      ["Make a big promise", "Tell people what they'll get from the next few minutes."],
      ["Earn the next minute", "Your opening is a promise. Make one worth keeping."],
    ]),
    practice("su-open-a-talk", "Open a talk", "an opening line that grabs the room", "You're presenting your team's results to the whole company. Give your opening.", {
      requireStructure: false,
      minSec: 20,
      maxSec: 60,
      maxFillers: 3,
    }, { required: true }),
    video("su-speak-so-people-listen", "Speak so people want to listen", 10, "eIho2S0ZahI", "TED", "Julian Treasure, sound and communication expert", [
      ["Vary your pace", "Slow down for key points and speed up for stories to keep attention."],
      ["Use silence", "A pause is more powerful than an “um.” Let important lines breathe."],
      ["Speak from honesty", "Integrity and authenticity make people trust what you say."],
    ]),
    video("su-structure-of-great-talks", "The structure of great talks", 18, "1nYFpuc2Umk", "TEDx Talks", "Nancy Duarte, TEDxEast", [
      ["Contrast what is with what could be", "Great talks move back and forth between today and a better future."],
      ["One big idea", "Everything in the talk should serve the single idea you want remembered."],
      ["End on the new bliss", "Close by painting the future your audience gets if they act."],
    ]),
    practice("su-project-presentation", "Present your project", "a short presentation with a clear structure", "Present the project you're working on to leadership in two minutes.", {
      requireStructure: true,
      minSec: 60,
      maxSec: 150,
    }),
    video("su-end-a-speech", "How to end a speech with impact", 5, "4LZu4KQ4vZU", "Alexander Lyon Communication Coach", "Communication coach", [
      ["Signal the end", "A clear transition tells the audience to lean in for the final point."],
      ["Make one ask", "Tell people exactly what to do next."],
      ["Finish strong, then stop", "End on your best line. Don't trail off with “so, yeah.”"],
    ]),
    practice("su-all-hands-update", "All-hands update", "a full update to a big room, start to finish", "Give the quarterly update for your team at the company all-hands.", {
      requireStructure: true,
      maxFillers: 5,
    }, { final: true, durationMin: 12 }),
  ],
};

const holdYourGround: CourseSeed = {
  id: "hold-your-ground",
  title: "Hold Your Ground: Defend Your Work Under Pushback",
  description:
    "Stay calm when your work is challenged. Acknowledge the concern, restate your position, back it with evidence and move the conversation forward.",
  structureLabels: ["Acknowledge", "Position", "Evidence", "Next step"],
  durationLabel: "15+ hours",
  steps: [
    levelCheck("hg-level-check", "show your coach how you handle pushback today", "I don't think your proposal will work. Convince me."),
    video("hg-dare-to-disagree", "Dare to disagree", 13, "PY_kd46RfVE", "TED", "Margaret Heffernan, business leader and author", [
      ["Disagreement is thinking", "Good teams treat conflict as a way to find the best answer."],
      ["Seek out challengers", "The people who disagree with you help you see your blind spots."],
      ["Silence is costly", "Problems grow when people are afraid to speak up."],
    ]),
    practice("hg-why-this-approach", "Why did you do it this way?", "a calm explanation of one decision", "Why did you choose this approach instead of the obvious one?", {
      requireStructure: true,
      minSec: 30,
      maxSec: 90,
    }),
    video("hg-disagree-productively", "How to disagree productively", 15, "phgjouv0BUA", "TED", "Julia Dhar, world debating champion", [
      ["Start with common ground", "Name what you agree on before you get to the disagreement."],
      ["Separate ideas from identity", "Argue about the idea, never about the person."],
      ["Be open to changing your mind", "Willingness to update makes the other side more open too."],
    ]),
    video("hg-dont-take-it-personally", "How not to take things personally", 18, "LnJwH_PZXnM", "TEDx Talks", "Frederik Imbo, TEDxMechelen", [
      ["Criticism isn't an attack", "Feedback on your work says something about the other person's needs, too."],
      ["Get curious, not defensive", "Ask what they need before you defend yourself."],
      ["Pause before you react", "A beat of space keeps you from saying something you regret."],
    ]),
    practice("hg-design-pushback", "Your design gets challenged", "acknowledge, restate, prove and propose", "Your manager says your design is too complicated for users. Respond.", {
      requireStructure: true,
      minSec: 45,
      maxSec: 120,
      maxFillers: 4,
    }, { required: true }),
    video("hg-answering-tough-questions", "Answering tough questions", 11, "hSeAGSPDG4w", "Stanford Graduate School of Business", "Stanford GSB lecture", [
      ["Listen to the real question", "Find the concern behind the words before you answer."],
      ["Answer directly first", "Give a short, clear answer, then add detail."],
      ["Stay composed", "Your calm matters as much as your content."],
    ]),
    video("hg-handling-qa", "Handling Q&A sessions", 13, "jHIfj011QRY", "Think Fast Talk Smart", "Stanford GSB communication podcast", [
      ["Listen to the whole question", "Resist answering before the person finishes. It shows respect and buys time."],
      ["Answer, then bridge", "Give a short direct answer, then connect it back to your main point."],
      ["Own what you don't know", "Say you'll find out, and then follow up."],
    ]),
    practice("hg-hostile-question", "The hostile question", "a composed answer to a loaded question", "Isn't this project just a waste of the team's time?", {
      requireStructure: true,
      minSec: 30,
      maxSec: 90,
      maxFillers: 3,
    }),
    video("hg-assertive-not-rude", "Be assertive without being rude", 15, "3wPn1ttyVyQ", "TEDx Talks", "Abby Hamilton, TEDxWestshoreWomen", [
      ["Assertive isn't aggressive", "You can be clear and firm while staying respectful."],
      ["Say what you need", "State your view directly instead of hinting or apologizing."],
      ["Hold the line kindly", "Repeat your position calmly when pushed."],
    ]),
    video("hg-answer-any-question", "How to answer any question", 8, "Bhn71mwOjsA", "Vinh Giang", "Communication coach", [
      ["Pause first", "A short pause gives you time to think and looks confident."],
      ["Use a structure", "A simple frame keeps your answer focused under pressure."],
      ["It's fine not to know", "Say what you do know and how you'll find the rest."],
    ]),
    practice("hg-budget-defense", "Defend your budget", "a firm, evidence-backed case", "Finance wants to cut your project's budget by half. Make the case to keep it.", {
      requireStructure: true,
      minSec: 60,
      maxSec: 150,
      maxFillers: 4,
    }, { required: true }),
    video("hg-stay-calm", "How to stay calm under stress", 12, "8jPQjjsBbIc", "TED", "Daniel Levitin, neuroscientist", [
      ["Stress clouds thinking", "Under pressure, clear thinking gets harder, so prepare when you're calm."],
      ["Run a pre-mortem", "Imagine what could go wrong and plan your response ahead of time."],
      ["Build calm habits", "Systems you set up in advance protect you when stakes are high."],
    ]),
    video("hg-better-conversations", "The science of better conversations", 12, "K_RSZC0s8a4", "TED", "Charles Duhigg, author of Supercommunicators", [
      ["Match the conversation", "Notice if it's practical, emotional or social and respond in kind."],
      ["Ask deeper questions", "Questions about values and feelings build real understanding."],
      ["Prove you're listening", "Repeat back what you heard before you make your point."],
    ]),
    practice("hg-unfair-feedback", "Respond to unfair feedback", "stay calm and correct the record", "In a review, a colleague says you missed the deadline because you were disorganized. You weren't. Respond.", {
      requireStructure: true,
      minSec: 45,
      maxSec: 120,
    }),
    video("hg-unprepared-questions", "Handling questions you didn't prepare for", 7, "ZqNorUIgIe8", "Jeff Su", "Career and productivity coach", [
      ["Pause before you answer", "A one-beat pause reads as thoughtful, not stuck."],
      ["Buy time honestly", "Repeat or clarify the question while you organize your thoughts."],
      ["Reuse what you know", "Most surprise questions can be answered with points you already prepared."],
    ]),
    practice("hg-executive-review", "The executive review", "defend your work through tough follow-ups", "I've read your proposal and I'm not convinced. Walk me through why we should do this.", {
      requireStructure: true,
      maxFillers: 5,
    }, { final: true, durationMin: 12 }),
  ],
};

const makeItStick: CourseSeed = {
  id: "make-it-stick",
  title: "Make It Stick: Storytelling with Impact",
  description:
    "Tell stories people remember. Learn the hook, the stakes, the turn and the landing, then use them in pitches, updates and interviews.",
  structureLabels: ["Hook", "Stakes", "Turn", "Landing"],
  durationLabel: "12+ hours",
  steps: [
    levelCheck("ms-level-check", "show your coach how you tell a story today", "Tell me about a moment that surprised you recently."),
    video("ms-stories-beat-data", "Why stories beat data", 14, "Ez5yS4Q5ASA", "TEDx Talks", "Karen Eber, TEDxPurdueU", [
      ["Data informs, stories persuade", "Numbers alone rarely change minds. Wrap the key number inside a moment people can picture."],
      ["Stories build trust", "A specific experience feels more honest than a slide full of averages."],
      ["Pair the two", "Lead with the story, then let one number prove it."],
    ]),
    practice("ms-origin-story", "Your 30-second origin story", "a 30-second origin story", "How did you end up doing what you do?", { requireStructure: false, minSec: 20, maxSec: 60 }),
    video("ms-what-is-a-story", "What makes something a story", 18, "enzuCJNA3Qg", "TEDx Talks", "Matthew Dicks, Moth StorySLAM champion", [
      ["A story is about change", "If nobody changes from start to end, it's an anecdote, not a story."],
      ["Find the five-second moment", "Every good story hangs on one instant where something shifts."],
      ["Start close to the end", "Open as near to the change as you can and skip the backstory."],
    ]),
    video("ms-story-in-60-seconds", "A great story in under 60 seconds", 4, "ZmNpeXTj2c4", "TED", "Jenny Hoyos, short-form creator", [
      ["Hook immediately", "The first seconds decide whether anyone stays."],
      ["Cut everything extra", "Every line should move the story forward."],
      ["Pay off the hook", "End by delivering on the promise you made at the start."],
    ]),
    practice("ms-changed-your-mind", "The moment you changed your mind", "one clear turning point", "Tell me about a moment you changed your mind about something.", {
      requireStructure: true,
      minSec: 45,
      maxSec: 120,
    }, { required: true }),
    video("ms-clues-to-a-great-story", "The clues to a great story", 19, "KxDwieKpawg", "TED", "Andrew Stanton, Pixar filmmaker", [
      ["Make a promise early", "Your first line should promise that the story is worth the listener's time."],
      ["Give clues, not answers", "Audiences love to work out what's happening. Don't explain everything."],
      ["Know your ending", "Every detail should point toward the punchline you already have in mind."],
    ]),
    video("ms-five-lines", "Five lines to tell any story", 10, "NeTJRCycYXQ", "Tim Runia", "Storytelling coach", [
      ["Use a story spine", "Once upon a time, every day, until one day, because of that, until finally."],
      ["Build cause and effect", "Each beat should happen because of the one before it."],
      ["Simple beats fancy", "A clear skeleton makes any story easy to follow."],
    ]),
    practice("ms-customer-story", "Tell a customer story", "a story with the customer as the hero", "Tell me about a time you helped a customer or colleague with a real problem.", {
      requireStructure: true,
      minSec: 45,
      maxSec: 120,
    }),
    video("ms-science-of-storytelling", "The science of the turn", 17, "Nj-hdQMa3uA", "TEDx Talks", "David JP Phillips, communication coach", [
      ["Suspense holds attention", "Build tension before the turn so the listener needs to know what happens."],
      ["Make us care about someone", "An empathetic character makes the turn land emotionally."],
      ["Humor relaxes the room", "A light moment before the turn makes people more open to it."],
    ]),
    video("ms-improve-storytelling", "Improve your storytelling fast", 9, "hNuAv-42jzY", "Philipp Humm", "Public speaking coach", [
      ["Drop people into the scene", "Start in the middle of the action, not with background."],
      ["Show, don't summarize", "Details and dialogue make a moment feel real."],
      ["Know your point", "Decide what the story should make people feel or do."],
    ]),
    practice("ms-turning-point", "Tell a turning point", "a turn that lands", "Tell me about a day that didn't go the way you expected.", {
      requireStructure: true,
      minSec: 60,
      maxSec: 150,
      maxFillers: 4,
    }, { required: true }),
    video("ms-seven-keys", "Seven keys to good storytelling", 9, "iV0M5l5KhnE", "TEDx Talks", "Josh Campbell, TEDxMemphis", [
      ["Know who you're telling it to", "Pick the details that matter to this audience and drop the rest."],
      ["Show a struggle", "A story needs something in the way. Name the obstacle clearly."],
      ["Land with meaning", "Finish on what changed and why it matters, then stop talking."],
    ]),
    video("ms-stories-without-boring", "Tell stories without boring people", 11, "xJBLuSHpPL0", "Vinh Giang", "Communication coach", [
      ["Cut the setup", "Most stories start too early. Begin closer to the interesting part."],
      ["Vary your delivery", "Changes in pace and volume keep people with you."],
      ["Make it about them", "Connect the story to something your listener cares about."],
    ]),
    practice("ms-pitch-with-a-story", "Pitch with a story", "a pitch that opens with a story", "Pitch an idea to your team, starting with a short story.", {
      requireStructure: true,
      minSec: 45,
      maxSec: 120,
    }),
    video("ms-business-storytelling", "Business storytelling made easy", 13, "WKIZ0bicfFw", "TEDx Talks", "Kelly Parker, TEDxBalchStreet", [
      ["Stories belong at work", "Updates, pitches and one-on-ones all land better with a short story."],
      ["Make the customer the hero", "Tell it from the point of view of the person you helped, not your team."],
      ["Tie it to the ask", "Every work story should point to a decision or next step."],
    ]),
    practice("ms-signature-story", "Your signature story", "your signature story", "Tell me the story that best explains who you are.", {
      requireStructure: true,
      maxFillers: 4,
    }, { final: true }),
  ],
};

const negotiation: CourseSeed = {
  id: "negotiation",
  title: "Ask for What You’re Worth: Negotiation",
  description:
    "Ask with confidence. Know your value, anchor with data, make a clear ask and handle the counter, for raises, offers and everyday deals.",
  structureLabels: ["Value", "Market", "Ask", "Close"],
  durationLabel: "20+ hours",
  steps: [
    levelCheck("ng-level-check", "show your coach how you ask for something today", "You want a bigger budget for your team next quarter. Ask me for it."),
    video("ng-ask-for-more", "How to ask for more and get it", 15, "-3w5Iw6fYZY", "TEDx Talks", "Alex Carter, Columbia Law School", [
      ["Ask yourself first", "Get clear on what you want and why before the conversation."],
      ["Ask open questions", "Questions like “What does success look like for you?” uncover what the other side needs."],
      ["Listen more than you talk", "The answers to your questions show you where the deal is."],
    ]),
    practice("ng-know-your-value", "Say what you're worth", "a confident statement of your value", "In one minute, tell me why you're worth more than you're paid today.", {
      requireStructure: true,
      minSec: 30,
      maxSec: 75,
    }),
    video("ng-never-split-the-difference", "Never split the difference", 12, "MjhDkNmtjy0", "TEDx Talks", "Chris Voss, former FBI hostage negotiator", [
      ["Tactical empathy", "Show you understand how the other side feels before you push."],
      ["Label emotions", "Saying “It seems like…” calms tension and opens people up."],
      ["Aim for “that's right”", "When they say “that's right,” they feel heard and ready to move."],
    ]),
    video("ng-win-a-negotiation", "How to win a negotiation", 7, "tYv44wQYePg", "Big Think", "Chris Voss, former FBI hostage negotiator", [
      ["Ask calibrated questions", "“How” and “what” questions get the other side solving your problem."],
      ["Mirror their words", "Repeating their last few words keeps them talking and sharing."],
      ["Use a calm voice", "A slow, steady tone lowers tension."],
    ]),
    practice("ng-ask-for-a-raise", "Ask for a raise", "a clear raise request backed by results", "You're in a one-on-one with your manager. Ask for a raise.", {
      requireStructure: true,
      minSec: 45,
      maxSec: 120,
      maxFillers: 4,
    }, { required: true }),
    video("ng-three-steps", "Three steps to get what you want", 5, "Z3HJCQJ2Lmo", "TED", "The Way We Work series", [
      ["Prepare", "Know your goal, your limits and your alternatives before you start."],
      ["Understand them", "Learn what the other side really needs."],
      ["Find the trade", "Look for options that give both sides more of what they want."],
    ]),
    video("ng-speak-up-for-yourself", "How to speak up for yourself", 15, "MEDgtjpycYg", "TED", "Adam Galinsky, Columbia Business School", [
      ["Know your range", "Everyone has a range of acceptable behavior. Power and practice widen it."],
      ["Advocate like it's for someone else", "People ask more boldly for others. Use that energy for yourself."],
      ["Take their perspective", "Understanding what they need makes your ask easier to accept."],
    ]),
    practice("ng-handle-the-no", "Handle the first no", "stay calm and keep the door open", "Your manager says there's no budget for raises this year. Respond.", {
      requireStructure: true,
      minSec: 30,
      maxSec: 90,
    }),
    video("ng-getting-to-yes", "Getting to yes", 9, "EKHg9H0G6go", "Productivity Game", "Book summary of Getting to Yes by Fisher and Ury", [
      ["Separate people from the problem", "Be soft on the person and firm on the issue."],
      ["Focus on interests", "Ask why they want something, not only what they want."],
      ["Use fair standards", "Ground the deal in market data or objective criteria."],
    ]),
    video("ng-batna", "Know your BATNA", 6, "FSyABLfStXE", "Noam Ebner", "Negotiation professor", [
      ["Know your best alternative", "Your BATNA is what you'll do if there's no deal. It sets your walk-away point."],
      ["Improve it before you talk", "A stronger alternative gives you more confidence at the table."],
      ["Think about theirs", "Estimating their alternative shows how much room there is."],
    ]),
    practice("ng-counter-an-offer", "Counter a job offer", "a confident counter with a specific number", "We'd love to have you. The offer is $85,000. What do you think?", {
      requireStructure: true,
      minSec: 45,
      maxSec: 120,
      maxFillers: 3,
    }, { required: true }),
    video("ng-negotiate-salary", "How to negotiate salary after an offer", 8, "J30wmYgzVXM", "Jeff Su", "Career and productivity coach", [
      ["Always negotiate", "Most offers have room, and asking politely rarely costs you the job."],
      ["Use market data", "Back your number with research on what the role pays."],
      ["Stay enthusiastic", "Show you want the job while you ask for more."],
    ]),
    video("ng-ask-for-a-raise-corcoran", "How to ask for a raise", 4, "FWxoI0RrPvc", "Business Insider", "Barbara Corcoran, investor", [
      ["Bring your wins", "Walk in with a clear list of what you've delivered."],
      ["Pick your moment", "Ask when your results are fresh and your manager can act."],
      ["Make it easy to say yes", "Be specific about what you want and why."],
    ]),
    practice("ng-trade-off", "Trade, don't cave", "trade for something instead of giving in", "We can't move on salary. Is there anything else that would make this work for you?", {
      requireStructure: true,
      minSec: 30,
      maxSec: 90,
    }),
    video("ng-no-to-yes", "The walk from no to yes", 19, "Hc6yi_FtoNo", "TED", "William Ury, co-author of Getting to Yes", [
      ["Go to the balcony", "Step back mentally so you respond instead of react."],
      ["Look for the third side", "Shared interests and outside perspectives help both sides move."],
      ["Build a golden bridge", "Make it easy for the other side to say yes."],
    ]),
    practice("ng-full-negotiation", "The full negotiation", "negotiate a raise from ask to close", "You've been asked to take on a bigger role. Negotiate your new salary and title with me.", {
      requireStructure: true,
      maxFillers: 5,
    }, { final: true, durationMin: 12 }),
  ],
};

const SEED: CourseSeed[] = [introduceYourself, speakUp, holdYourGround, makeItStick, negotiation];

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
    const courseRow = {
      id: course.id,
      title: course.title,
      description: course.description,
      structureLabels: course.structureLabels,
      durationLabel: course.durationLabel,
    };
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
