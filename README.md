# yapper.ai

An AI speaking coach for the moments that matter at work: introducing yourself, giving updates, defending your work, telling stories and negotiating. You watch a short lesson, practice out loud with a voice coach, and get a scored report. After every practice, your skill profile updates across five areas: Fluency, Pronunciation & Articulation, Grammar & Syntax, Vocabulary and Cohesion.

Live demo: [yapper-ai-lilac.vercel.app](https://yapper-ai-lilac.vercel.app)

**At a glance:** 5 courses · AI voice coach · 5-skill progress tracking · [LTV/CAC of 3.8x in the base case, 1.7x in the worst case](#unit-economics)

## Courses

The learning path has five courses. Each one starts with a level check, then 10 video lessons with voice practices between them, and ends with a final practice.

| # | Course | What you practice |
| --- | --- | --- |
| 1 | Introduce Yourself & Your Work | 30-second intro, "So what do you do?", tell me about yourself, elevator pitch |
| 2 | Speak Up: Status Updates & Public Speaking | Headline-first updates, delivering a delay, opening and presenting a talk |
| 3 | Hold Your Ground: Defend Your Work Under Pushback | Answering challenges, hostile questions, defending a budget, unfair feedback |
| 4 | Make It Stick: Storytelling with Impact | Origin story, turning points, customer stories, pitching with a story |
| 5 | Ask for What You're Worth: Negotiation | Stating your value, asking for a raise, handling a no, countering an offer |

**Free vs. Pro.**
- Without a plan, lesson 1 of every course and every level check are free.
- Practices are free only in course 1, for 3 attempts in all.
- Every other lesson and practice needs a Monthly or Annual plan.

**About the course lengths.** The lessons are public YouTube videos, each under 20 minutes, that we picked for this Business Cup demo because we don't have our own course material yet. The "10+ hours" to "20+ hours" lengths shown on each course are deliberate placeholders, not the sum of these videos. They reflect what we're aiming for: a production version would replace the YouTube lessons with 10+ hours of original material per course.

## Unit economics

> **LTV stays above CAC even in the worst case.** Base case **3.8x LTV/CAC**, worst case **1.7x**, best case **6.2x**, at a **≈84% gross margin**.

<table>
  <tr>
    <th></th>
    <th align="center">Worst</th>
    <th align="center">Base</th>
    <th align="center">Best</th>
  </tr>
  <tr>
    <td><b>Net LTV</b></td>
    <td align="center">$124</td>
    <td align="center">$141.5</td>
    <td align="center">$164</td>
  </tr>
  <tr>
    <td><b>CAC</b></td>
    <td align="center">$74</td>
    <td align="center">$37.5</td>
    <td align="center">$26.5</td>
  </tr>
  <tr>
    <td><b>LTV / CAC</b></td>
    <td align="center"><b>1.7x</b></td>
    <td align="center"><b>3.8x</b></td>
    <td align="center"><b>6.2x</b></td>
  </tr>
  <tr>
    <td><b>ROMI</b></td>
    <td align="center">67%</td>
    <td align="center">277%</td>
    <td align="center">520%</td>
  </tr>
  <tr>
    <td><b>Marketing budget for $100M ARR</b></td>
    <td align="center">~$50M / yr</td>
    <td align="center">~$22M / yr</td>
    <td align="center">~$14M / yr</td>
  </tr>
</table>

```mermaid
xychart-beta
    title "Net LTV vs CAC per customer (USD)"
    x-axis ["Worst", "Base", "Best"]
    y-axis "USD" 0 --> 180
    bar [124, 141.5, 164]
    bar [74, 37.5, 26.5]
```

<sub>Taller bars are net LTV, shorter bars are CAC. The gap between them is the profit from each new customer.</sub>

All inputs come from public benchmarks (RevenueCat, Adapty) unless marked **(assumption)**. The model follows a cohort of 100 new payers and all their payments over 36 months, after costs.

### Costs per payment

| | Monthly ($29.99) | Annual ($149.99) |
|---|---|---|
| Stripe (2.9% + $0.30 + 0.7% Billing) | 4.6% | 3.8% |
| LLM and voice **(assumption)** | ~12% | ~12% |
| **Net share we keep** | **83.4%** | **84.2%** |

We sell on the web, so there's no App Store fee. Gross margin is about **84%**.

### The three scenarios

| | Worst | Base | Best |
|---|---|---|---|
| Monthly first renewal | 42% (lowest category) | 56% (Education) | 67% (Education, earlier data) |
| Monthly, still paying at 12 months | 6.1% (AI apps) | 8% | 10% |
| Monthly churn after month 2 | 16% / mo | 16% / mo | 16% / mo |
| Payments per monthly customer | 3.6 | 4.45 | 5.2 |
| Annual first renewal | 16.5% (24% adjusted for AI apps) | 24% (Education) | 31% |
| Payments per annual customer | 1.25 | 1.36 | 1.47 |
| New payers, monthly / annual | 50 / 50 | 50 / 50 | 38 / 62 |
| Traffic, paid / organic | 100% / 0% | 50% / 50% | 30% / 70% |
| **Net LTV** | **$124** | **$141.5** | **$164** |
| **CAC** | **$74** | **$37.5** | **$26.5** |
| **LTV / CAC** | **1.7x** | **3.8x** | **6.2x** |
| LTV / CAC, first 12 months only | 1.4x | 3.0x | 4.6x |
| ROMI | 67% | 277% | 520% |
| Average net first payment ÷ CAC | 1.02x | 2.0x | 3.3x |
| Payback, monthly-only customers | month 9 | month 2 | month 2 |
| New payers a year for $100M ARR | ~677K | ~593K | ~511K |
| Marketing budget a year | ~$50M | ~$22M | ~$14M |

<details>
<summary><b>How the formulas work</b></summary>

<br>

- **Payments per monthly customer:** 100 pay in month 1, the *first renewal %* pay in month 2, then the same share leaves every month until the *12-month retention %* remain at month 13. Total payments over 36 months ÷ 100.
- **Payments per annual customer:** 100, then the *first renewal %*, then half of those renew again (year-2 renewals are 44–64%, per RevenueCat).
- **Gross LTV** = payments × price. **Net LTV** = gross LTV × net share. **Blended** = weighted by the monthly/annual mix of new payers.
- **CAC** = paid share × $65 (Adapty: global Meta median cost per paying user, Q3 2026) + organic share × ~$10 **(assumption: ~$3M/yr content team ÷ ~297K organic payers)**.
- **LTV / CAC** = net LTV ÷ CAC. **ROMI** = (net LTV − CAC) ÷ CAC.
- **New payers for $100M ARR** = $100M ÷ gross LTV. **Marketing budget** = new payers × CAC.

</details>

<details>
<summary><b>The worst case, step by step</b></summary>

<br>

Everything goes wrong at once: the lowest renewal rates, AI-app churn, no organic traffic at all, and CAC above the Meta median.

1. **Monthly customer:** 100 pay, 42 pay again in month 2, then ~16% leave each month, leaving 6 at month 13. That's **3.6 payments** × $29.99 = $108 gross, or **$90 net**.
2. **Annual customer:** 100 pay, 16.5 renew, ~8 renew again. That's **1.25 payments** × $149.99 = $187 gross, or **$157.5 net**.
3. **Blended (50/50):** (90 + 157.5) ÷ 2 = **$124 net LTV**.
4. **CAC:** 100% paid traffic at **$74**, between the Meta median ($64.93) and the highest benchmark cost ($82.23).
5. **LTV / CAC** = 124 ÷ 74 = **1.7x**. Even at the highest benchmark CAC of $82.23 it's still **1.5x**. It only falls to 1.0x at a CAC of **$124**, nearly twice the Meta median.
6. **The first payment covers acquisition:** the average net first payment is $75.7 (half pay $25 monthly, half pay $126 annual), above the $74 CAC. Across a cohort, acquisition pays for itself even if nobody renews.
7. **At $100M ARR:** ~677K new payers a year × $74 ≈ **$50M** of marketing against ~**$84M** of gross profit. **The business still makes money.**

</details>

### Better marketing lifts every scenario

CAC depends on the paid/organic mix: **CAC = $65 × paid share + $10 × organic share**.

| Organic share | CAC | LTV / CAC (base retention) | LTV / CAC (worst retention) |
|---|---|---|---|
| 0% | $65 | 2.2x | 1.9x |
| 30% | $48.5 | 2.9x | 2.6x |
| 50% | $37.5 | 3.8x | **3.3x** |
| 60% | $32 | 4.4x | 3.9x |
| 70% | $26.5 | 5.3x | 4.7x |

**Bottom line:**
- LTV beats CAC even in the worst case.
- At 50% organic traffic, worst-case retention still gives **3.3x**, close to the base case.
- More organic reach, cheaper paid acquisition and more annual subscribers all push LTV/CAC higher, so we track organic share from day one.

## Tech stack

| Layer | What we use | Why |
| --- | --- | --- |
| Web app | **Next.js 16** (App Router, React 19 Server Components), **TypeScript** | Pages render on the server next to the database, so screens arrive with data already in them and almost no client JavaScript |
| Styling | **Tailwind CSS 4**, CSS design tokens, Lucide icons | One token set gives light and dark themes and consistent spacing |
| API | Next.js Route Handlers (`frontend/app/api`) | One codebase and one deploy; every route runs as its own serverless function |
| Database | **Neon** serverless Postgres + **Drizzle ORM** | Typed schema and queries, autoscaling compute, pooled connections |
| Live voice | **Deepgram Voice Agent** (`nova-3` listen, `gpt-4o-mini` think, Aura-2 voices) + `nova-2` live captions | Low-latency, two-way voice conversation in the browser |
| Scoring | Deepgram pre-recorded `nova-2` (keeps filler words) + **OpenAI `gpt-4.1-mini`** structured output (Zod schema) | Real filler counts, pace and recognizer confidence, plus a report the code can check |
| Hosting | **Vercel** (functions in `iad1`, the same region as the database) | Global CDN for static assets; functions scale out automatically |

## Backend design

### Overview

```mermaid
flowchart LR
  B[Browser] -- pages and API --> V[Vercel edge and CDN]
  V --> P[proxy.ts: signed-cookie check]
  P --> RSC[Server Components]
  P --> API[Route Handlers]
  RSC --> DB[(Neon Postgres)]
  API --> DB
  API -- 60s token --> DG[Deepgram]
  B <-- live voice and captions --> DG
  API -- recording --> DGP[Deepgram transcription]
  API -- transcript and signals --> OAI[OpenAI gpt-4.1-mini]
```

The repo is one npm-workspaces monorepo with two packages:

- **`frontend/`** has the Next.js app: pages, UI components, API routes and the auth proxy.
- **`backend/`** has framework-free domain logic that the app imports as `backend/...`: the database schema and queries, scoring, the skill profile, coach prompts, course state, plans and onboarding. It has no Next.js dependency, so it can move into its own service later without a rewrite.

### Practice pipeline

1. **Start.** `GET /api/voice/token` checks the daily quota (30 practices a day) and the plan, then mints a 60-second Deepgram token. API keys never reach the browser.
2. **Talk.** The browser opens the Voice Agent with a coach prompt built per practice from the lesson, goal, pass criteria and what the coach remembers about the user. On the same mic stream it runs `nova-2` live transcription for captions and live filler counts.
3. **Score.** `POST /api/practice/score` receives a 32 kbps recording, then:
   - transcribes it with filler words kept, and measures pace, long pauses and per-word recognizer confidence;
   - asks `gpt-4.1-mini` for one structured report: answer-structure parts, 3 delivery scores, **5 skill scores**, 3 tips, an improved answer and a coach line. The model gets the measured delivery numbers, so it scores fluency and articulation from evidence rather than guessing from text;
   - scales scores by how much of a full answer was given, so a two-word answer can't score well;
   - falls back to a built-in heuristic scorer if the LLM is unavailable.
4. **Remember.** In the same request, the practice result, step progress, streak, a short coach note and the updated **skill profile** are written to Postgres. The recording itself is never stored.

### Skill profile

The profile is stored in `user_context.skills` and covers Fluency, Pronunciation & Articulation, Grammar & Syntax, Vocabulary and Cohesion.

- Your first practice sets the baseline.
- After that, each practice moves the profile toward its scores, weighted by how complete the answer was: a full answer moves it up to 35%, and a few words barely move it. One bad try can't erase weeks of progress, and steady practice shows up quickly.
- The previous values are kept, so the Progress tab can show what changed.
- The coach prompt includes the profile, so the voice coach knows your strongest and weakest skill.

### Data model

| Table | Holds |
| --- | --- |
| `users` | Name, streaks, plan, onboarding state |
| `user_context` | Onboarding answers, coach notes, skill profile: the coach's memory of you |
| `courses`, `steps` | All course content (lessons, level checks, practices, pass criteria), editable live in the database |
| `step_progress` | Per-user step status and best score; the current step is computed, never stored |
| `practice_sessions` | Every scored practice: scores, skills, transcript, tips, improved answer |
| `voice_attempts` | Started practices, for daily quotas and the free-plan limit |

### Security

- Name-only demo login. Sessions are HMAC-signed, httpOnly cookies, checked on every request by `proxy.ts`.
- Every query is scoped to the signed-in user's id.
- Inputs are validated with Zod, and uploads are size- and duration-capped.
- Secrets are read only on the server, and the browser only ever gets short-lived Deepgram tokens.

## UX and UI

- **Quick start.** Log in with just your name, answer a 4-question survey, pick a coach (Yap or Jensen, each with its own voice), and you're talking in your first free chat within a minute.
- **Feels like a real conversation.** A low-latency voice coach, an animated avatar that listens, talks and celebrates, live captions with filler words highlighted, and a live checklist of the pass criteria.
- **Feedback you can act on.** Every report has an overall score, per-dimension bars, 3 specific tips and a stronger version of your own answer that the coach can read aloud.
- **Progress you can see.** Animated skill bars count up after each practice, with arrows for what moved since last time, plus a streak, weekly minutes and a filler-rate trend.
- **Guided path.** A level check opens each course, lessons unlock in order, and locked steps explain exactly what's left to pass.
- **Polish.** Light and dark themes, skeleton loading screens on every page, responsive layouts from phone to desktop, and remembered microphone permission.
- **Accessible.** Semantic landmarks, ARIA labels on charts and progress bars, visible keyboard focus, and full support for `prefers-reduced-motion`.

## Scaling plan

### Today

The app is already built to scale horizontally:

- **Stateless servers.** Sessions live in signed cookies and all state lives in Postgres, so any function instance can serve any request.
- **Automatic scale-out.** Vercel runs each route as a serverless function and adds instances as traffic grows. Static assets come from the CDN.
- **Elastic database.** Neon autoscales compute (scaling up on its own) and pools connections, so a burst of function instances doesn't exhaust Postgres.
- **The heaviest work is outsourced.** Speech recognition, speech synthesis and LLM calls run on Deepgram and OpenAI, which scale on their side.

### Vertical vs horizontal scaling

| | Vertical (bigger machines) | Horizontal (more machines) |
| --- | --- | --- |
| Web and API | Not needed: functions are small and short-lived | Default: more function or container instances behind a load balancer |
| Postgres | First lever: raise Neon's compute ceiling | Read replicas for read-heavy pages (Progress, Courses); later, shard by `user_id` |
| Scoring workers | More CPU/RAM per worker for audio processing | A worker pool that scales with queue depth |

We scale **horizontally by default** because it has no ceiling and survives single-node failures. We use **vertical scaling only for the database**, where it is the cheapest first step.

### Roadmap as traffic grows

**Stage 1: up to ~10k monthly active users.** The current architecture.
- Add **Redis** (Upstash or ElastiCache) for:
  - rate limits and daily practice quotas (atomic counters instead of `COUNT(*)` queries);
  - caching course content, which every page reads and which rarely changes;
  - caching session-to-user lookups.
- Add observability: structured logs, traces, and dashboards for p95 latency per route and LLM/ASR cost per practice.

**Stage 2: ~10k to 100k monthly active users.**
- **Make scoring asynchronous with Kafka.** Today the score request waits about 5 to 10 seconds for transcription and the LLM. Instead:
  1. The API puts the recording in object storage (S3 or R2) and publishes a `practice.completed` event.
  2. The user sees "scoring…" and the report appears when it's ready.
  3. A worker pool consumes the events and scores them.
  4. Separate consumers update the skill profile, streaks, analytics and notifications.
  - This keeps traffic spikes from timing out requests, lets each consumer scale and retry on its own, and gives us a replayable event log for re-scoring and analytics.
- **Put a load balancer in front of the API.** Vercel's edge network does this today. If the API moves to containers (ECS or Kubernetes), an AWS ALB or NGINX spreads traffic across instances, with health checks and zero-downtime deploys.
- **Postgres read replicas** for dashboards and progress pages, and a dedicated connection pooler (PgBouncer).
- **Provider resilience:** retries with backoff, circuit breakers, and a second LLM and ASR provider for failover. The heuristic scorer is already a built-in fallback.

**Stage 3: 100k+ monthly active users.**
- **Multi-region:** edge-cached pages, regional API and worker clusters close to Deepgram and OpenAI endpoints, and Postgres replicas per region.
- **Split services along the existing `backend/` boundaries:** content, practice and scoring, profile and progress, billing. Each gets its own scaling policy.
- **Cost controls at scale:** cache LLM results for repeated prompts, batch non-urgent analytics, and route simple scoring to smaller models.
- **Analytics warehouse** (ClickHouse or BigQuery) fed from Kafka, so product analytics never load the main database.
