# yapper.ai

An AI speaking coach for storytelling, public speaking and behavioral interviews. Watch a short lesson, practice out loud with a voice coach, and get a scored report with real filler-word counts.

Next.js (App Router) · TypeScript · Tailwind CSS · Neon Postgres + Drizzle · Deepgram Voice Agent · OpenAI (optional).

## Repository layout

One npm-workspaces repo with two packages:

| Folder | What's in it |
| --- | --- |
| `frontend/` | The Next.js app: pages, components, API routes (`frontend/app/api`), login proxy, styles. This is what gets deployed. |
| `backend/` | Server logic the frontend imports as `backend/...`: database schema and client (`src/db`), seed data with all course content, Drizzle config, queries, scoring (Deepgram transcription + OpenAI report), the coach prompt, session signing. |

Run every command below from the repo root.

## Run it locally

1. Install dependencies (installs both packages):

   ```bash
   npm install
   ```

2. Create `frontend/.env.local` (git-ignored) from `frontend/.env.example`:

   - `DATABASE_URL`: Neon pooled connection string.
   - `DEEPGRAM_API_KEY`: a Deepgram key with at least the **Member** role (needed to mint short-lived browser tokens).
   - `SESSION_SECRET`: any random 32-byte hex string, e.g. `openssl rand -hex 32`.
   - `OPENAI_API_KEY` (optional): OpenAI (`gpt-4.1-mini`) writes the practice report. Without it, a simpler built-in scorer is used.

   The server fails at startup with a clear message naming any missing required variable. Keys are only read on the server.

3. Create the tables and load the courses (only needed once per database; safe to re-run):

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the app and open http://localhost:3000:

   ```bash
   npm run dev
   ```

Checks: `npm run build`, `npm run lint`, `npm run typecheck`.

## Deploy on Vercel

1. Import the GitHub repo `yapper.ai` in Vercel.
2. **Root Directory:** `frontend`. Vercel detects Next.js and installs the whole workspace, so `backend/` is included automatically.
3. **Environment Variables** (Production and Preview): `DATABASE_URL`, `DEEPGRAM_API_KEY`, `SESSION_SECRET`, `OPENAI_API_KEY`. Copy the values from `frontend/.env.local`.
4. **Function region** (Settings → Functions): Washington, D.C. (`iad1`), the same region as the Neon database (us-east-1), so database queries take milliseconds.
5. Deploy. The database is already set up; run `npm run db:push` and `npm run db:seed` locally only if you point `DATABASE_URL` at a new database.

Practice recordings are compressed to 32 kbps, so even a 10-minute answer stays under Vercel's 4.5 MB request limit.

## How it works

- **Login:** name only. `POST /api/session` finds or creates the user (case-insensitive) and sets a signed, httpOnly cookie. `frontend/proxy.ts` sends visitors without a valid cookie to `/welcome`.
- **Content:** all courses and steps live in Neon (`courses`, `steps`) and are read on every request, so editing a row shows up on reload. Source of truth for a fresh database: `backend/src/db/seed.ts`.
- **Progress:** `step_progress` and `practice_sessions` per user. The current step is computed, never stored. A step is locked while an earlier required practice isn't passed; locked URLs redirect to the course.
- **Voice:** `GET /api/voice/token` mints a 60-second Deepgram token (30 practices per user per day). The browser opens the Deepgram Voice Agent (`nova-3` listen, `gpt-4o-mini` think, `aura-2-thalia-en` speak) and, on the same mic audio, a `nova-2` live transcription stream with filler words on, for live subtitles and filler counts. (`nova-2` is used wherever fillers matter: in testing, `nova-3` dropped most "um"/"uh" from real mic recordings.)
- **Coach prompt:** built per practice in `backend/src/coach-prompt.ts` from the course, lesson, goal, pass criteria, the user's name and past coach notes, then sent to Deepgram when the voice connection opens. Tune the prompt, greeting, LLM (`THINK_PROVIDER`) and voice (`SPEAK_MODEL`) there.
- **Scoring:** `POST /api/practice/score` sends the recording to Deepgram pre-recorded `nova-2` with `filler_words=true`, counts fillers from word timings ("like" only between commas or pauses of 300 ms or more), computes pace, and asks OpenAI (`backend/src/scoring.ts`) for structure, clarity, confidence, tips and an improved answer. Scores scale with how much was actually said, so non-answers score near zero. The audio is not stored.
- **Coach memory:** after each practice a short note (date, practice, strength, what to work on) is saved to `user_context`; the coach's next opening line refers to it.
- **UI preferences:** theme and sidebar state stay in the browser (`localStorage`). The browser also remembers microphone permission, so practices start without asking again.

## Course content

| Course | Step | Video | Channel | Link |
| --- | --- | --- | --- | --- |
| Storytelling | Why stories beat data | Why storytelling is more trustworthy than presenting data / Karen Eber / TEDxPurdueU | TEDx Talks | [watch](https://www.youtube.com/watch?v=Ez5yS4Q5ASA) |
| Storytelling | What makes something a story | What is a Story? / Matthew Dicks / TEDxBerkshires | TEDx Talks | [watch](https://www.youtube.com/watch?v=enzuCJNA3Qg) |
| Storytelling | The clues to a great story | The clues to a great story / Andrew Stanton / TED | TED | [watch](https://www.youtube.com/watch?v=KxDwieKpawg) |
| Storytelling | The science of the turn | The magical science of storytelling / David JP Phillips / TEDxStockholm | TEDx Talks | [watch](https://www.youtube.com/watch?v=Nj-hdQMa3uA) |
| Storytelling | Seven keys to good storytelling | Seven Keys to Good Storytelling / Josh Campbell / TEDxMemphis | TEDx Talks | [watch](https://www.youtube.com/watch?v=iV0M5l5KhnE) |
| Storytelling | Business storytelling made easy | Business Storytelling Made Easy / Kelly Parker / TEDxBalchStreet | TEDx Talks | [watch](https://www.youtube.com/watch?v=WKIZ0bicfFw) |
| Public speaking | Make stress your friend | How to Make Stress Your Friend / Kelly McGonigal / TED | TED | [watch](https://www.youtube.com/watch?v=RcGyVTAoXEU) |
| Public speaking | How to start a speech | How to Start a Speech That Makes People Whisper ‘Damn, that’s good.’ | Philipp Humm | [watch](https://www.youtube.com/watch?v=9HJ0AHfx7BE) |
| Public speaking | The structure of great talks | TEDxEast - Nancy Duarte uncovers common structure of greatest communicators 11/11/2010 | TEDx Talks | [watch](https://www.youtube.com/watch?v=1nYFpuc2Umk) |
| Public speaking | Speak so people want to listen | How to Speak So That People Want to Listen / Julian Treasure / TED | TED | [watch](https://www.youtube.com/watch?v=eIho2S0ZahI) |
| Public speaking | Body language that connects | You are contagious / Vanessa Van Edwards / TEDxLondon | TEDx Talks | [watch](https://www.youtube.com/watch?v=cef35Fk7YD8) |
| Public speaking | Handling Q&A sessions | Handling Q&A Sessions During a Presentation: How to Answer Questions Effectively | Think Fast Talk Smart | [watch](https://www.youtube.com/watch?v=jHIfj011QRY) |
| Public speaking | How to end a speech with impact | How to End a Speech with Impact | Alexander Lyon Communication Coach | [watch](https://www.youtube.com/watch?v=4LZu4KQ4vZU) |
| Behavioral interview prep | How to answer behavioral questions | THIS is How You Answer Behavioral Interview Questions / Job Interview Tips | Cass Thompson Career Advice | [watch](https://www.youtube.com/watch?v=TT-n6Xo5XX4) |
| Behavioral interview prep | The STAR technique, decoded | STAR INTERVIEW QUESTIONS & ANSWERS! (The STAR TECHNIQUE for Behavioural Interview Questions!) | CareerVidz | [watch](https://www.youtube.com/watch?v=uQEuo7woEEk) |
| Behavioral interview prep | Behavioral answers that stick | How to Answer Behavioral Interview Questions Sample Answers | Self Made Millennial | [watch](https://www.youtube.com/watch?v=IV30jAw7dxA) |
| Behavioral interview prep | Handling questions you didn't prepare for | How to Answer an Interview Question you DIDN'T Prepare For | Jeff Su | [watch](https://www.youtube.com/watch?v=ZqNorUIgIe8) |
| Behavioral interview prep | Weakness and failure questions | WHAT’S YOUR BIGGEST WEAKNESS? (11 GOOD WEAKNESSES To Use In A JOB INTERVIEW!) | CareerVidz | [watch](https://www.youtube.com/watch?v=UX_dxcjp5Gw) |
