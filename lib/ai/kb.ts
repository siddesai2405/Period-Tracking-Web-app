// Lightweight offline knowledge base for the chatbot.
// Each entry: keywords + concise, medically-cautious answer.

export interface KBEntry {
  keywords: string[];
  answer: string;
}

export const KB: KBEntry[] = [
  {
    keywords: ["bloat", "bloating", "swollen", "puffy"],
    answer:
      "Bloating before your period is caused by progesterone slowing digestion and water retention. Try reducing salt, sipping peppermint or ginger tea, gentle walks, and magnesium-rich foods (spinach, almonds, dark chocolate). It usually settles in the first 1–2 days of your period.",
  },
  {
    keywords: ["cramp", "pain", "ache", "dysmenorrhea"],
    answer:
      "Cramps come from prostaglandins making the uterus contract. Heat packs, ibuprofen (if safe for you), light yoga, hydration and omega-3 foods help. If pain is severe, lasts >3 days, or stops you from daily life, please consult a doctor — it could indicate endometriosis or fibroids.",
  },
  {
    keywords: ["late", "missed", "delay", "skipped"],
    answer:
      "A period can be late due to stress, travel, illness, weight change, intense exercise, thyroid issues, PCOS, or pregnancy. If you’re sexually active and >7 days late, take a home pregnancy test. If periods are repeatedly irregular, see a gynaecologist.",
  },
  {
    keywords: ["pcos", "polycystic", "irregular"],
    answer:
      "PCOS is a hormonal condition with symptoms like irregular cycles, acne, excess hair growth and weight changes. Lifestyle support (balanced low-GI diet, strength training, sleep, stress care) plus a doctor-prescribed plan can manage it well. Diagnosis needs blood tests and an ultrasound.",
  },
  {
    keywords: ["ovulation", "fertile", "conceive", "pregnant"],
    answer:
      "Ovulation typically happens ~14 days before your next period. Your fertile window is roughly the 5 days before ovulation plus the day itself. Signs include clearer egg-white cervical mucus, a slight temperature rise, and mild one-sided pelvic twinge. Track 2–3 cycles for best accuracy.",
  },
  {
    keywords: ["pms", "premenstrual", "mood", "irritable"],
    answer:
      "PMS is the cluster of mood and physical symptoms in the 1–2 weeks before your period, driven by hormone shifts. Regular exercise, calcium + vitamin B6, steady sleep, and reducing caffeine/alcohol help most people. Severe mood symptoms (PMDD) deserve medical support.",
  },
  {
    keywords: ["heavy", "flow", "soak", "menorrhagia"],
    answer:
      "Heavy flow means soaking through a pad/tampon every hour for several hours, large clots, or periods >7 days. This deserves a doctor visit to check for fibroids, polyps, thyroid issues or anaemia. Iron-rich foods + a ferritin blood test are good first steps.",
  },
  {
    keywords: ["spotting", "between", "midcycle"],
    answer:
      "Light spotting between periods can be from ovulation, hormonal birth control, stress or implantation. Occasional spotting is usually harmless. Frequent or heavy mid-cycle bleeding should be checked by a clinician.",
  },
  {
    keywords: ["food", "eat", "diet", "nutrition"],
    answer:
      "Across the cycle aim for: leafy greens + iron + vitamin C during your period; complex carbs + protein in the follicular phase; light, anti-inflammatory meals around ovulation; and magnesium + B-vitamins (oats, nuts, seeds, dark chocolate) in the luteal phase to ease PMS.",
  },
  {
    keywords: ["exercise", "workout", "yoga"],
    answer:
      "Match movement to your phase: gentle yoga and walks during menstruation; strength and HIIT in follicular and ovulatory phases when energy peaks; pilates, mobility and longer walks in the luteal phase. Listen to your body — rest is productive too.",
  },
  {
    keywords: ["sleep", "insomnia", "tired"],
    answer:
      "Sleep can dip in the late luteal phase due to falling progesterone. A cool, dark room, no screens 30 min before bed, magnesium glycinate and a consistent wake time make a big difference. Persistent insomnia should be discussed with a doctor.",
  },
  {
    keywords: ["birth control", "pill", "contraception", "iud"],
    answer:
      "Different contraceptives suit different bodies — combined pill, mini-pill, hormonal IUD, copper IUD, implant, patch, ring. Each affects bleeding, mood and skin differently. A gynaecologist can help you choose based on your health, lifestyle and family plans.",
  },
  {
    keywords: ["pcod", "cyst", "polycystic", "androgens", "testosterone", "hirsutism"],
    answer:
      "PCOD (Polycystic Ovary Disorder) is milder than PCOS — multiple immature eggs form cysts but periods may still occur. Management focuses on lifestyle: low-GI diet, resistance training, 7–9h sleep, and stress reduction. A pelvic ultrasound and blood tests (androgens, LH/FSH, insulin) confirm it. Check the PCOS Check feature in Lotus Phase for a full symptom assessment and personalised lifestyle guide.",
  },
  {
    keywords: ["insulin", "resistance", "blood sugar", "glucose", "diabetes"],
    answer:
      "Insulin resistance is very common in PCOS — cells don't respond well to insulin, causing glucose and insulin to both stay high. This drives weight gain, fatigue, sugar cravings and excess androgens. Solutions: low-GI diet, protein at every meal, strength training 3×/week, magnesium, myo-inositol supplement, and 7–9h sleep. Fasting insulin and HbA1c blood tests assess it.",
  },
  {
    keywords: ["diet", "phase", "cycle", "eat", "nutrition", "menstrual", "follicular", "ovulatory", "luteal"],
    answer:
      "Your nutritional needs shift with your cycle phases: 🌹 **Menstrual**: iron (lentils, spinach), omega-3s (salmon), magnesium (dark chocolate) to replenish and reduce cramps. 🌱 **Follicular**: fresh foods, eggs, fermented foods, flaxseeds as estrogen builds. ✨ **Ovulatory**: antioxidants (berries, broccoli), zinc, cruciferous veg for estrogen clearance. 🌙 **Luteal**: magnesium, B6, complex carbs, tryptophan to stabilise blood sugar and mood. Visit the Diet Guide in Lotus Phase for full meal plans.",
  },
  {
    keywords: ["relax", "stress", "anxiety", "breathing", "meditation", "sleep", "calm"],
    answer:
      "Stress directly worsens hormonal imbalance — cortisol suppresses progesterone and worsens insulin resistance. For immediate relief: try **4-7-8 breathing** (inhale 4s, hold 7s, exhale 8s). For ongoing practice: 10 min daily mindfulness, consistent sleep times, gentle exercise, and limiting news before bed. Use the **Relax & Sleep** section in Lotus Phase for guided breathing exercises, ambient sounds, and a meditation timer.",
  },
  {
    keywords: ["supplement", "vitamin", "magnesium", "inositol", "omega", "b6", "zinc", "d3"],
    answer:
      "Top evidence-based supplements for cycle health: **Magnesium** (300–400mg/day) — reduces PMS, cramps, sleep issues, anxiety. **Vitamin B6** (50mg) — eases mood swings and breast tenderness. **Omega-3s** — anti-inflammatory, reduces cramps. **Vitamin D3** (2,000IU) — most women are deficient; affects mood and hormones. For PCOS: **Myo-inositol** (2g twice daily) improves insulin sensitivity and cycle regularity. Always discuss supplements with your doctor.",
  },
  {
    keywords: ["music", "sound", "ambient", "nature", "white noise", "binaural"],
    answer:
      "Ambient sound therapy can reduce anxiety, aid sleep and even ease period cramps by relaxing the nervous system. Try the **Relax & Sleep** section in Lotus Phase — it has rain, ocean, forest, white noise and 432Hz calming tones generated in your browser, plus a meditation timer and guided breathing exercises.",
  },
];

const STOP = new Set(["the", "a", "an", "is", "i", "my", "me", "you", "to", "of", "and", "or", "for", "do", "have", "has", "in", "on", "at", "with", "what", "why", "how", "should", "can", "be"]);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
}

export function bestAnswer(query: string): string {
  const trimmed = query.trim();
  if (/^\d+$/.test(trimmed)) {
    return [
      `I saw "${trimmed}", but I need a little more context before giving health guidance.`,
      "",
      "Try asking:",
      `- Is a ${trimmed}-day cycle normal?`,
      `- I am ${trimmed} days late, what should I do?`,
      "- Explain period tracking basics 101",
      "",
      "If you have severe pain, very heavy bleeding, fainting, or pregnancy concerns, please contact a clinician.",
    ].join("\n");
  }

  const tokens = tokenize(query);
  if (tokens.length === 0) return greeting();
  let best: { score: number; entry: KBEntry } | null = null;
  for (const entry of KB) {
    let score = 0;
    for (const k of entry.keywords) {
      for (const t of tokens) {
        if (t === k) score += 3;
        else if (t.includes(k) || k.includes(t)) score += 1.5;
      }
    }
    if (!best || score > best.score) best = { score, entry };
  }
  if (!best || best.score < 1.5) return fallback();
  return (
    best.entry.answer +
    "\n\n_Reminder: I’m an AI assistant — please see a qualified clinician for personal medical advice._"
  );
}

function greeting() {
  return "Hi! I’m Luna, your AI wellness companion. Ask me anything about periods, symptoms, fertility, mood, sleep or nutrition.";
}
function fallback() {
  return "I’m not fully sure about that one. Could you rephrase, or ask about cramps, PMS, ovulation, late periods, PCOS, nutrition or sleep? For anything urgent, please reach out to a doctor.";
}
