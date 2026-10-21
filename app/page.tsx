"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays, Sparkles, MessageCircleHeart, ShieldCheck,
  HeartPulse, Users, ArrowRight, Check, Star,
  Zap, Brain, Moon, Leaf, ChevronRight, Stethoscope,
} from "lucide-react";
import { BloomLogo } from "@/components/bloom-logo";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CalendarDays,
    title: "Smart Cycle Prediction",
    desc: "AI forecasts your next period, ovulation and fertile window with a confidence score that improves as you log.",
    color: "from-rose-500 to-pink-600",
    glow: "rgba(244,63,94,0.25)",
  },
  {
    icon: Sparkles,
    title: "Personalised Insights",
    desc: "Phase-aware tips on food, movement, sleep and mood - written like a friend, grounded in science.",
    color: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.25)",
  },
  {
    icon: MessageCircleHeart,
    title: "Luna AI Chat",
    desc: "Ask anything about cramps, PMS, PCOS or fertility. Private, judgment-free, available 24/7.",
    color: "from-fuchsia-500 to-pink-500",
    glow: "rgba(217,70,239,0.25)",
  },
  {
    icon: HeartPulse,
    title: "Symptom Tracking",
    desc: "Log flow, symptoms, mood, sleep and water with one tap. See patterns you didn't know existed.",
    color: "from-red-500 to-rose-500",
    glow: "rgba(239,68,68,0.25)",
  },
  {
    icon: Stethoscope,
    title: "Talk to a Doctor",
    desc: "Book instant video consultations with verified OB/GYN specialists and nutritionists through Apollo 247.",
    color: "from-sky-500 to-blue-600",
    glow: "rgba(14,165,233,0.25)",
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    desc: "Your data stays on your device by default. End-to-end encryption when you sync.",
    color: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.25)",
  },
];

const testimonials = [
  {
    name: "Aarya M.",
    age: 24,
    avatar: "AM",
    color: "from-rose-400 to-pink-500",
    text: "I finally understand my body. The phase tips changed how I plan my entire week - I'm more productive and less surprised by my moods.",
    stars: 5,
  },
  {
    name: "Sana K.",
    age: 29,
    avatar: "SK",
    color: "from-violet-400 to-purple-500",
    text: "Predicted my period to the exact day after just two cycles. The Luna chatbot is incredibly kind and actually helpful.",
    stars: 5,
  },
  {
    name: "Maya R.",
    age: 31,
    avatar: "MR",
    color: "from-fuchsia-400 to-pink-500",
    text: "The dashboard is gorgeous and the insights actually feel personal. Switched from three other apps and never looking back.",
    stars: 5,
  },
];

const stats = [
  { value: "12k+", label: "Active users" },
  { value: "4.9/5", label: "Average rating" },
  { value: "98%", label: "Prediction accuracy" },
  { value: "100%", label: "Private & secure" },
];

const phases = [
  { name: "Menstrual", days: "Days 1-5", icon: Moon, color: "from-rose-400 to-pink-500", tip: "Rest, iron-rich foods, gentle yoga" },
  { name: "Follicular", days: "Days 6-13", icon: Leaf, color: "from-emerald-300 to-teal-400", tip: "High energy, strength training, creativity peaks" },
  { name: "Ovulatory", days: "Days 14-16", icon: Zap, color: "from-amber-300 to-orange-400", tip: "Peak confidence, social energy, HIIT workouts" },
  { name: "Luteal", days: "Days 17-28", icon: Brain, color: "from-violet-400 to-fuchsia-400", tip: "Nesting, deep work, magnesium-rich foods" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

export default function LandingPage() {
  return (
    <div className="page-bg relative overflow-hidden text-[rgb(var(--fg))] selection:bg-pink-500/30">
      {/* Background mesh gradient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-60 -left-60 h-[700px] w-[700px] rounded-full bg-rose-600/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-600/8 blur-[80px]" />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="topbar-surface relative z-20 mx-3 mt-3 border-b-0 bg-[rgb(var(--card)/0.78)] backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <BloomLogo size={36} rounded="10" />
            <span className="font-display text-lg font-bold tracking-tight">Lotus Phase</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[rgb(var(--muted))]">
            <a href="#features" className="transition-colors hover:text-[rgb(var(--fg))]">Features</a>
            <a href="#phases" className="transition-colors hover:text-[rgb(var(--fg))]">How it works</a>
            <a href="#voices" className="transition-colors hover:text-[rgb(var(--fg))]">Reviews</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="border-0 text-white shadow-lg shadow-rose-500/25 hover:brightness-110">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 container pt-20 pb-28 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card)/0.72)] px-3.5 py-1.5 text-xs font-bold text-[rgb(var(--fg))] shadow-[0_12px_34px_-28px_rgba(91,52,88,0.48)] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI-powered - 100% private - Free forever
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="mt-6 font-display text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.04] tracking-tight">
            Understand your{" "}
            <span className="bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              cycle
            </span>
            ,<br />love your body.
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-5 max-w-lg text-base leading-7 text-[rgb(var(--muted))] md:text-lg">
            Lotus Phase predicts your period, decodes your symptoms and chats with you
            like a friend who happens to know medicine - beautifully, in your pocket.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="group border-0 px-7 text-white shadow-xl shadow-rose-500/30 hover:brightness-110">
                Start for free
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                View live demo
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold bg-gradient-to-r from-rose-400 to-violet-400 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-ink dark:text-white">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:block"
        >
          <HeroMockup />
        </motion.div>
      </section>

      {/* ── Cycle phases ────────────────────────────────────────────────── */}
      <section id="phases" className="relative z-10 container py-24">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-rose-400 uppercase">Your cycle, decoded</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-4xl md:text-5xl font-bold">
            Four phases, four you's
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-ink dark:text-white leading-relaxed">
            Every phase brings different energy, needs and strengths. Lotus Phase guides you through all of them.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {phases.map((ph) => (
            <motion.div
              key={ph.name}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/[0.08] bg-white/[0.03] p-6 hover:border-black/10 dark:border-white transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${ph.color} shadow-lg`}>
                <ph.icon size={20} className="text-ink dark:text-white" />
              </div>
              <p className="font-display font-bold text-base">{ph.name}</p>
              <p className="text-xs text-ink dark:text-white mb-3">{ph.days}</p>
              <p className="text-sm text-ink dark:text-white leading-relaxed">{ph.tip}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 container py-24">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-violet-400 uppercase">Features</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-4xl md:text-5xl font-bold">
            Everything you need,<br />nothing you don't
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-ink dark:text-white leading-relaxed">
            A calm, intelligent companion for every phase of your cycle.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/[0.08] bg-white/[0.02] p-6 hover:border-black/10 dark:border-white transition-all duration-300 cursor-default"
              style={{ boxShadow: `0 0 0 0 ${f.glow}` }}
              whileHover={{ boxShadow: `0 0 60px -20px ${f.glow}`, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.color} shadow-lg`}>
                <f.icon size={22} className="text-ink dark:text-white" />
              </div>
              <h3 className="font-display font-bold text-base mb-2">{f.title}</h3>
              <p className="text-sm text-ink dark:text-white leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="relative z-10 container py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-fuchsia-400 uppercase">How it works</motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 font-display text-4xl md:text-5xl font-bold">
              Three taps to clarity
            </motion.h2>
            <ol className="mt-10 space-y-6">
              {[
                { step: "01", title: "Tell us your last period", desc: "Just one date — that's enough to start predicting." },
                { step: "02", title: "Log how you feel each day", desc: "Flow, mood, sleep, symptoms — whatever feels right." },
                { step: "03", title: "Get AI-powered guidance", desc: "Predictions sharpen, insights deepen, Luna learns you." },
              ].map((s) => (
                <motion.li key={s.step} variants={fadeUp} className="flex gap-5">
                  <div className="shrink-0 font-display text-3xl font-bold bg-gradient-to-b from-white/20 to-white/5 bg-clip-text text-transparent leading-none pt-1">{s.step}</div>
                  <div>
                    <p className="font-display font-bold text-base">{s.title}</p>
                    <p className="mt-1 text-sm text-ink dark:text-white leading-relaxed">{s.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-black/5 dark:border-white/[0.08] bg-white/[0.03] p-8"
          >
            <p className="font-display font-bold text-lg mb-6">What you get</p>
            <ul className="space-y-4">
              {[
                "Period & ovulation prediction with confidence score",
                "Phase-aware nutrition, movement & sleep tips",
                "AI chatbot that remembers your history & phase",
                "PCOS risk assessment & lifestyle guide",
                "Ambient sounds, breathing & meditation timer",
                "Trends across cycles, never just one day",
                "Doctor & community support when you need more",
                "Beautiful dark mode and gentle reminders",
              ].map((x) => (
                <li key={x} className="flex items-start gap-3 text-sm text-ink dark:text-white">
                  <div className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center">
                    <Check size={11} className="text-ink dark:text-white" strokeWidth={3} />
                  </div>
                  {x}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section id="voices" className="relative z-10 container py-24">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-amber-400 uppercase">Loved by</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-4xl md:text-5xl font-bold">Words from our circle</motion.h2>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-4"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="rounded-2xl border border-black/5 dark:border-white/[0.08] bg-white/[0.03] p-6 flex flex-col gap-4"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-ink dark:text-white leading-relaxed flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-ink dark:text-white shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-ink dark:text-white">Age {t.age}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 container py-16 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center"
          style={{ background: "linear-gradient(135deg, #be185d 0%, #7c3aed 50%, #4f46e5 100%)" }}
        >
          {/* Decorative blobs inside CTA */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-4 right-8 h-32 w-32 opacity-10 rotate-12 pointer-events-none"><BloomLogo size={128} rounded="32" /></div>

          <div className="relative">
            <p className="text-xs font-semibold tracking-widest text-white/78 uppercase mb-4">Start your journey</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
              Ready to feel in tune?
            </h2>
            <p className="mt-4 max-w-md mx-auto text-white/82 leading-relaxed">
              Join Lotus Phase today - your gentle, intelligent cycle companion. Free forever, no credit card needed.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Create free account
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white/28 bg-white/10 px-8 text-white hover:bg-white/16 hover:text-white dark:border-white/14 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]">
                  Try the demo first
                  <ChevronRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-black/5 dark:border-white/[0.08] py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink dark:text-white">
          <div className="flex items-center gap-2.5">
            <BloomLogo size={28} rounded="8" />
            <span className="font-display font-semibold text-ink dark:text-white">Lotus Phase</span>
            <span>- Made with care for every cycle - (c) {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ink dark:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-ink dark:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-ink dark:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Hero Mockup ─────────────────────────────────────────────────────────── */
function HeroMockup() {
  return (
    <div className="relative select-none">
      {/* Glow behind card */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-500/20 to-violet-500/20 blur-3xl scale-110" />

      {/* Main card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 rounded-3xl border border-white/10 bg-[#18181b]/95 p-6 text-white shadow-2xl shadow-violet-950/30 backdrop-blur-xl"
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-medium text-white/60">Today · Day 18</p>
            <p className="font-display text-2xl font-bold mt-0.5 text-white">Luteal phase 🌙</p>
          </div>
          <div className="h-11 w-11 rounded-2xl overflow-hidden shadow-lg shadow-rose-500/30">
            <BloomLogo size={44} rounded="0" />
          </div>
        </div>

        {/* Ring */}
        <div className="relative h-44 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.055] to-white/[0.025] grid place-items-center overflow-hidden mb-5 shadow-none">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="72" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
            <circle
              cx="100" cy="100" r="72" fill="none"
              stroke="url(#heroGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${0.65 * 2 * Math.PI * 72} ${2 * Math.PI * 72}`}
              transform="rotate(-90 100 100)"
              style={{ filter: "drop-shadow(0 0 8px rgba(244,63,94,0.5))" }}
            />
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center relative z-10">
            <p className="font-display text-5xl font-bold text-white">10</p>
            <p className="text-xs font-medium text-white/60 mt-1">days to next period</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { l: "Mood", v: "Calm 😌" },
            { l: "Sleep", v: "7.5h" },
            { l: "Water", v: "6 cups" },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-center shadow-none">
              <p className="text-[10px] uppercase tracking-wider text-white/50">{x.l}</p>
              <p className="text-sm font-semibold mt-0.5 text-white/90">{x.v}</p>
            </div>
          ))}
        </div>

        {/* Suggestion chip */}
        <div className="rounded-xl border border-white/10 bg-white/[0.055] px-3.5 py-2.5 flex items-center gap-2">
          <Sparkles size={13} className="text-violet-400 shrink-0" />
          <p className="text-xs font-medium text-white/85 leading-snug">Magnesium-rich snacks may ease your cravings today 💜</p>
        </div>
      </motion.div>

      {/* Floating Luna chat bubble */}
      <motion.div
        initial={{ opacity: 0, x: 24, y: 16 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-5 -left-8 z-20 max-w-[200px] rounded-2xl border border-white/10 bg-[#1c1c1f]/95 p-3.5 text-white shadow-xl backdrop-blur"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center">
            <Sparkles size={10} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-white">Luna AI</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto" />
        </div>
        <p className="text-[11px] font-medium text-white/70 leading-snug">"You're in luteal phase — rest and magnesium today 💜"</p>
      </motion.div>

      {/* Phase badge */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: -16 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -top-5 -right-6 z-20 rounded-2xl border border-white/10 bg-[#1c1c1f]/95 px-3.5 py-2.5 text-white shadow-xl backdrop-blur"
      >
        <p className="text-[10px] text-white/60 uppercase tracking-wider">Confidence</p>
        <p className="font-display text-lg font-bold mt-0.5 bg-gradient-to-r from-rose-400 to-violet-400 bg-clip-text text-transparent">87%</p>
      </motion.div>
    </div>
  );
}
