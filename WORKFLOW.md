# 🌸 Lotus Phase — Period-Tracking AI

Final-Year Project · Deep-Analysis Workflow & Architecture

---

## 1. Vision

**Lotus Phase** is an AI-powered menstrual & reproductive-health companion that:

1. Predicts the next period, ovulation day and fertile window from past cycles.
2. Logs symptoms / moods / flow / sleep and surfaces personalised insights.
3. Answers health questions through an AI chatbot.
4. Connects users to verified doctors and a supportive community.
5. Sends gentle reminders and adapts to the user over time.

Tone: warm, calming, medically credible, never alarming.

---

## 2. Tech Stack (final, justified)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | SSR + API routes in one repo, great DX, excellent for demo & deploy |
| Styling | **Tailwind CSS** + custom design tokens | Rapid, consistent, perfect for the soft rose-lavender theme |
| UI primitives | shadcn-style components (Radix + Tailwind, inlined) | Accessible, themeable, no heavy dep |
| Animations | **Framer Motion** | Smooth, premium feel |
| Icons | **lucide-react** | Clean, modern |
| State | **Zustand** with `persist` middleware | Zero-boilerplate, demo works offline |
| Charts | **Recharts** | Beautiful, responsive, easy |
| Auth | **NextAuth (Auth.js v5)** — credentials + Google | Industry standard |
| DB (later) | **Prisma + SQLite → Postgres/Supabase** | One-line switch for production |
| AI prediction | TS statistical engine (mean + std-dev + Bayesian smoothing) | Runs client-side, instant, no GPU |
| AI chatbot | Provider abstraction → offline KB or **OpenAI / Gemini** via API key | Works in demo without internet |
| Notifications | Browser Notification API + service worker (PWA) | No backend push infra needed |
| Deployment | **Vercel** (1-click) | Free, fast, custom domain |

---

## 3. AI / ML Approach

### 3.1 Cycle Prediction (`lib/ai/prediction.ts`)
Inputs: array of past period start dates.

Algorithm:
1. Compute cycle lengths `L₁ … Lₙ`.
2. **Weighted mean** giving recent cycles higher weight (exponential decay, α=0.7).
3. Standard deviation σ → confidence band.
4. **Bayesian smoothing** with population prior (μ=28, σ=4) when n < 3.
5. Predict next period start = lastStart + round(μ̂).
6. Ovulation = nextPeriod − 14, fertile window = ovulation ± 2 days.
7. Confidence score = `1 − min(σ̂/10, 0.9)`.

### 3.2 Symptom Insights (`lib/ai/insights.ts`)
- Phase classifier (menstrual / follicular / ovulatory / luteal) from current day-of-cycle.
- Pattern detector: groups symptoms by cycle phase across past N cycles → "You usually feel low energy on luteal day 3".
- Anomaly flag: cycle length deviates >2σ → suggest seeing a doctor.

### 3.3 Chatbot (`lib/ai/chat.ts`)
- Provider interface: `ChatProvider { reply(messages): Promise<string> }`.
- Default: `LocalKBProvider` — keyword + embedding-lite search over a curated JSON of period/health Q&A.
- If `OPENAI_API_KEY` or `GEMINI_API_KEY` is set in `.env.local`, switch to that provider.
- System prompt enforces medical-safety disclaimers.

---

## 4. Information Architecture

```
/                       → Landing (hero, features, testimonials, CTA)
/login  /signup         → Auth
/dashboard              → Today card + next-period countdown + charts
/calendar               → Month grid with period / fertile / ovulation overlay + log entry
/log                    → Quick log: flow, symptoms, mood, sleep, water
/insights               → AI-generated cards + trend charts
/chat                   → AI health assistant
/community              → Posts feed + ask-a-doctor cards
/profile                → User profile, cycle settings, reminders, theme
```

---

## 5. Data Model

```ts
User       { id, name, email, avatar, dob, avgCycle, avgPeriod }
Cycle      { id, userId, startDate, endDate? }
LogEntry   { id, userId, date, flow, symptoms[], mood, sleepHrs, waterCups, notes }
ChatMsg    { id, userId, role, content, ts }
Reminder   { id, userId, type, time, enabled }
Post       { id, userId, title, body, tags[], createdAt }
```

---

## 6. Build Order (what we are doing right now)

1. ✅ Workflow doc (this file)
2. Project scaffold + Tailwind theme (rose / lavender / cream + dark glass)
3. Reusable UI kit (Button, Card, Input, Badge, Dialog, Tabs, Avatar)
4. Layout shell with animated sidebar + topbar + theme toggle
5. Landing page — premium hero with gradient blob, feature grid, testimonials
6. Auth pages with illustration
7. Dashboard — today summary, countdown ring, recent logs, mini charts
8. Calendar with prediction overlay
9. Log entry page
10. Insights with AI cards
11. Chatbot UI streaming bubbles
12. Community feed
13. Profile + settings + reminders
14. README with run/demo guide

---

## 7. Demo Script (for the client)

1. Open landing → scroll through features.
2. Sign up (any email/password — demo mode stores locally).
3. Onboarding: enter last period date + average cycle.
4. Dashboard shows countdown + phase.
5. Log today's flow + 2 symptoms + mood.
6. Open Calendar → show predicted period + fertile window highlighted.
7. Open Insights → AI explains "you're in luteal phase, expect …".
8. Ask the chatbot: *"why do I feel bloated before my period?"* → typed answer.
9. Toggle dark mode → glassmorphism kicks in.
10. Open profile → enable "Period reminder 2 days before".

---

## 8. Future Roadmap

- React Native / Expo wrapper for mobile.
- Real LSTM cycle model trained on Kaggle Fertility/Period dataset.
- Doctor video-consult (Twilio).
- Wearable sync (Google Fit / Apple Health).
- Multi-language (i18n) — Hindi, Spanish first.
