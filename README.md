# 🌸 Lotus Phase — AI Period & Wellness Companion

> Final-Year Project · A beautiful, AI-powered menstrual health & wellness app built with **Next.js 14 + TypeScript + Tailwind**.

![Status](https://img.shields.io/badge/status-demo--ready-ff5e93) ![Stack](https://img.shields.io/badge/Next.js-14-black) ![AI](https://img.shields.io/badge/AI-cycle%20prediction%20%2B%20chatbot-a386ff)

---

## ✨ What it does

- 🩸 **Smart cycle prediction** — period, ovulation & fertile-window forecasting with a confidence score (statistical model + Bayesian smoothing).
- 📊 **Beautiful dashboard** — countdown ring, mood/sleep/water charts, cycle history.
- 🗓 **Interactive calendar** with predicted period, fertile window & ovulation overlays.
- 📝 **One-tap daily log** — flow, mood, symptoms, sleep, water, notes.
- 💜 **AI insights** — phase-aware tips and pattern detection across your logs.
- 🤖 **Luna AI chatbot** — answers period/health questions (offline KB by default; plug in OpenAI / Gemini for cloud LLM).
- 🩺 **Doctor & community** section — supportive feed + verified gynaecologists.
- 🌙 **Dark mode** with glassmorphism.
- 📱 **Fully responsive** with a mobile bottom-nav.
- 🔐 **Privacy first** — all data stays in `localStorage` for the demo.

---

## 🚀 Run it

```bash
# 1. Install deps
npm install

# 2. Start dev server
npm run dev

# Open http://localhost:3000
```

> Optional: copy `.env.example` to `.env.local` and add an `OPENAI_API_KEY` or `GEMINI_API_KEY` to upgrade the chatbot. Without keys, the offline knowledge-base provider is used and works perfectly for demos.

---

## 🎬 Demo script (for the client)

1. Land on **/** — scroll through the hero, features, testimonials.
2. Click **Get started** → fill name/email/password.
3. Onboarding asks for last-period date + cycle/period length.
4. Land on **Dashboard** — see the countdown ring + AI insights for today.
5. Open **Log** → record today's flow, mood, 2 symptoms, sleep, water → Save.
6. Open **Calendar** — predicted period, fertile window & ovulation are highlighted.
7. Open **Insights** — AI cards explain your phase, patterns and trends.
8. Open **Luna AI** — ask *"why do I feel bloated before my period?"*
9. Toggle **dark mode** from the topbar — glassmorphism activates.
10. Open **Profile** → tweak reminders, change theme.

---

## 🧠 AI / ML approach

| Component | Technique |
|---|---|
| Cycle prediction | Recency-weighted (α=0.7) mean & σ of past cycle gaps + Bayesian shrinkage with population prior (μ=28, σ=4). Confidence = `1 − σ̂/10`. |
| Phase detection | Day-of-cycle classifier → menstrual / follicular / ovulatory / luteal. |
| Insights engine | Rule-based generator combining current phase, log frequency, hydration & sleep averages. |
| Chatbot | Provider abstraction. Default `LocalKBProvider` does keyword-weighted matching against a curated medical KB. Drop-in OpenAI / Gemini provider when an API key is present. |

All AI runs **client-side** — no GPU, no server. Demo works fully offline.

---

## 🏗 Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with custom rose/lavender design tokens + glassmorphism
- **Framer Motion** for animations
- **Recharts** for charts
- **Zustand** (persisted) for state
- **Lucide** for icons

---

## 📂 Project structure

```
app/
├─ (app)/              # Authenticated app shell with sidebar + mobile-nav
│  ├─ dashboard/
│  ├─ calendar/
│  ├─ log/
│  ├─ insights/
│  ├─ chat/
│  ├─ community/
│  └─ profile/
├─ (auth)/login + signup
├─ onboarding/
├─ layout.tsx          # Fonts, theme provider, toaster
└─ page.tsx            # Marketing landing
components/             # Sidebar, topbar, mobile-nav, theme provider, ui kit
lib/
├─ ai/
│  ├─ prediction.ts    # Statistical cycle predictor
│  ├─ insights.ts      # Insight generator
│  ├─ chat.ts          # Provider abstraction
│  └─ kb.ts            # Offline knowledge base
├─ store.ts            # Zustand store (persisted)
└─ utils.ts
WORKFLOW.md            # Full architecture & workflow
```

---

## 🌱 Roadmap (future scope you can mention to the client)

- Real backend with **Prisma + Postgres/Supabase** + NextAuth (Google login)
- LSTM-based cycle predictor trained on Kaggle datasets
- Real push notifications via PWA + service worker
- React Native (Expo) wrapper for iOS/Android
- Wearable integration (Google Fit / Apple Health)
- Multi-language (Hindi, Spanish first)
- Real telemedicine via Twilio Video

---

Made with care 🌷 for every cycle.
