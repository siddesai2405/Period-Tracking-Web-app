// PCOS/PCOD risk assessment — questionnaire + scoring + lifestyle guide.
// NOT a medical diagnosis. Intended for educational awareness only.

export interface PCOSQuestion {
  id: string;
  question: string;
  options: { label: string; score: number }[];
}

export const pcosQuestions: PCOSQuestion[] = [
  {
    id: "cycle_regularity",
    question: "How regular are your menstrual cycles?",
    options: [
      { label: "Regular (every 26–35 days)", score: 0 },
      { label: "Slightly irregular (±7 days occasionally)", score: 1 },
      { label: "Very irregular or unpredictable", score: 2 },
      { label: "Absent for 3+ months (not pregnant)", score: 3 },
    ],
  },
  {
    id: "acne",
    question: "Do you experience acne or persistently oily skin?",
    options: [
      { label: "Rarely or never", score: 0 },
      { label: "Occasionally", score: 1 },
      { label: "Frequently, especially on jaw/chin/back", score: 2 },
    ],
  },
  {
    id: "hair_growth",
    question: "Do you notice excess or dark hair growth (face, chest, abdomen, inner thighs)?",
    options: [
      { label: "No", score: 0 },
      { label: "Slight, manageable", score: 1 },
      { label: "Noticeable — affects confidence", score: 2 },
      { label: "Significant — affects daily life", score: 3 },
    ],
  },
  {
    id: "hair_loss",
    question: "Do you experience hair thinning or hair loss on the scalp?",
    options: [
      { label: "No", score: 0 },
      { label: "Mild thinning", score: 1 },
      { label: "Noticeable hair loss", score: 2 },
    ],
  },
  {
    id: "weight",
    question: "Have you had unexplained weight gain, especially around the abdomen?",
    options: [
      { label: "No", score: 0 },
      { label: "Some weight gain", score: 1 },
      { label: "Significant abdominal gain despite diet & exercise", score: 2 },
    ],
  },
  {
    id: "fatigue",
    question: "How often do you feel fatigued or have energy crashes (especially after meals)?",
    options: [
      { label: "Rarely", score: 0 },
      { label: "Sometimes", score: 1 },
      { label: "Frequently — affects daily life", score: 2 },
    ],
  },
  {
    id: "mood",
    question: "Do you experience anxiety, low mood, or significant mood swings?",
    options: [
      { label: "Rarely", score: 0 },
      { label: "Sometimes, especially around my period", score: 1 },
      { label: "Frequently or severely", score: 2 },
    ],
  },
  {
    id: "family_history",
    question: "Does anyone in your immediate family have PCOS, type 2 diabetes, or insulin resistance?",
    options: [
      { label: "No / Not aware", score: 0 },
      { label: "One relative", score: 1 },
      { label: "Multiple relatives", score: 2 },
    ],
  },
  {
    id: "skin_darkening",
    question: "Do you notice darkened skin patches (neck, armpits, under breasts)?",
    options: [
      { label: "No", score: 0 },
      { label: "Slight darkening", score: 1 },
      { label: "Noticeable dark patches", score: 2 },
    ],
  },
  {
    id: "cravings",
    question: "Do you experience intense sugar or carb cravings?",
    options: [
      { label: "Rarely", score: 0 },
      { label: "Sometimes", score: 1 },
      { label: "Frequently or very intense", score: 2 },
    ],
  },
  {
    id: "fertility",
    question: "Have you had difficulty conceiving (if you have tried)?",
    options: [
      { label: "Not tried / Not applicable", score: 0 },
      { label: "Trying without success for 6–12 months", score: 2 },
      { label: "Diagnosed fertility issues", score: 3 },
    ],
  },
  {
    id: "pelvic_pain",
    question: "Do you experience pelvic pain or discomfort outside of your period?",
    options: [
      { label: "No", score: 0 },
      { label: "Occasionally mild", score: 1 },
      { label: "Regularly or severe", score: 2 },
    ],
  },
];

export interface LifestyleSection {
  title: string;
  emoji: string;
  tips: string[];
}

/**
 * Rotterdam 2003 Phenotype Classification
 *
 * Requires 2 of 3 criteria:
 *   A = Oligo/anovulation  (cycle irregularity)
 *   B = Clinical/biochemical hyperandrogenism  (acne + hirsutism + hair-loss)
 *   C = Polycystic ovarian morphology (questionnaire proxy only — ultrasound needed)
 *
 * Phenotypes:
 *   Classic A  (A+B+C)  — most severe, highest metabolic risk
 *   Classic B  (A+B)    — severe, high androgen + irregular
 *   Ovulatory  (B+C)    — hyperandrogenism with regular cycles
 *   Mild       (A+C)    — irregular cycles, no overt hyperandrogenism
 *   Insufficient        — < 2 criteria met (questionnaire cannot confirm PCOS)
 */
export type RotterdamPhenotype = "Classic_A" | "Classic_B" | "Ovulatory_C" | "Mild_D" | "Insufficient";

export interface RotterdamClassification {
  phenotype: RotterdamPhenotype;
  label: string;
  criteriaA: boolean;  // Oligo/anovulation
  criteriaB: boolean;  // Hyperandrogenism
  criteriaC: boolean;  // Polycystic morphology proxy
  metabolicRisk: "high" | "moderate" | "low";
  note: string;
}

export interface PCOSResult {
  score: number;
  maxScore: number;
  pct: number;
  risk: "low" | "moderate" | "high";
  riskLabel: string;
  summary: string;
  topSymptoms: string[];
  recommendations: string[];
  lifestyleGuide: LifestyleSection[];
  whenToSeeDoctor: string[];
  rotterdam: RotterdamClassification;
}

export function calculatePCOSRisk(answers: Record<string, number>): PCOSResult {
  const score = Object.values(answers).reduce((sum, v) => sum + v, 0);
  const maxScore = pcosQuestions.reduce(
    (sum, q) => sum + Math.max(...q.options.map((o) => o.score)),
    0,
  );
  const pct = score / maxScore;

  let risk: "low" | "moderate" | "high";
  let riskLabel: string;
  let summary: string;

  if (pct < 0.28) {
    risk = "low";
    riskLabel = "Low likelihood";
    summary =
      "Your responses suggest your cycle and hormone-related symptoms are within typical ranges. Keep logging your cycle regularly and maintaining healthy habits. If anything changes, reassess.";
  } else if (pct < 0.56) {
    risk = "moderate";
    riskLabel = "Some indicators present";
    summary =
      "Your responses show several symptoms that can be associated with hormonal imbalance or early PCOS. This is not a diagnosis — discuss your symptoms with a gynaecologist, especially if cycles are irregular.";
  } else {
    risk = "high";
    riskLabel = "Multiple PCOS indicators";
    summary =
      "Your responses suggest multiple symptoms commonly associated with PCOS or PCOD. Please consult a gynaecologist promptly for blood tests (androgens, insulin, LH/FSH) and a pelvic ultrasound. Early intervention makes a significant difference.";
  }

  const topSymptoms: string[] = [];
  if ((answers["cycle_regularity"] ?? 0) >= 2) topSymptoms.push("Irregular cycles");
  if ((answers["acne"] ?? 0) >= 1) topSymptoms.push("Acne / oily skin");
  if ((answers["hair_growth"] ?? 0) >= 1) topSymptoms.push("Excess hair growth (hirsutism)");
  if ((answers["hair_loss"] ?? 0) >= 1) topSymptoms.push("Scalp hair thinning");
  if ((answers["weight"] ?? 0) >= 1) topSymptoms.push("Abdominal weight changes");
  if ((answers["skin_darkening"] ?? 0) >= 1) topSymptoms.push("Skin darkening (acanthosis nigricans)");
  if ((answers["fatigue"] ?? 0) >= 1) topSymptoms.push("Fatigue / energy crashes");
  if ((answers["cravings"] ?? 0) >= 1) topSymptoms.push("Intense carb/sugar cravings");

  const recommendations = [
    "Book a consultation with a gynaecologist or endocrinologist",
    "Request blood tests: free testosterone, DHEA-S, LH, FSH, fasting insulin, HbA1c, thyroid panel",
    "Ask for a pelvic ultrasound to check for polycystic ovaries",
    "Start a low-GI diet — reducing insulin resistance is the cornerstone of PCOS management",
    "Aim for 150 min/week of moderate exercise (walking, yoga, resistance training)",
    "Prioritise 7–9 hours of sleep — poor sleep worsens insulin resistance significantly",
    "Track your cycle in this app — patterns over 3+ months are valuable for your doctor",
    "Reduce ultra-processed foods, added sugars and refined carbohydrates immediately",
  ];

  const lifestyleGuide: LifestyleSection[] = [
    {
      title: "Diet for PCOS",
      emoji: "🥗",
      tips: [
        "Choose low-GI carbs: oats, quinoa, sweet potato, lentils, legumes over white rice/bread",
        "Prioritise protein at every meal to slow glucose absorption and stabilise blood sugar",
        "Include anti-inflammatory foods: berries, turmeric, ginger, leafy greens, fatty fish",
        "Eat healthy fats: avocado, olive oil, nuts, seeds — they support hormone production",
        "Consider reducing dairy if acne or bloating worsens with it",
        "Myo-inositol (from supplement or wholegrains) improves insulin sensitivity in PCOS",
        "Eat regularly — skip no meals, keep blood sugar steady throughout the day",
      ],
    },
    {
      title: "Exercise",
      emoji: "🏃‍♀️",
      tips: [
        "Resistance training 2–3×/week builds muscle, which directly improves insulin sensitivity",
        "Daily walking (8,000+ steps) is highly effective and low-stress for PCOS",
        "Low-intensity cardio (cycling, swimming) reduces cortisol without spiking it",
        "Avoid excessive intense HIIT during high-stress periods — it can worsen cortisol",
        "Yoga reduces androgen levels and stress — shown in multiple PCOS studies",
      ],
    },
    {
      title: "Stress Management",
      emoji: "🧘‍♀️",
      tips: [
        "Chronic cortisol worsens insulin resistance and raises androgen levels directly",
        "Practice 10 min of mindfulness or breathing exercises daily",
        "Journal to track mood, stress triggers and symptom patterns",
        "Set screen/news boundaries — information overload spikes cortisol",
        "Social support is protective — connect with others with PCOS for shared strategies",
      ],
    },
    {
      title: "Sleep",
      emoji: "🌙",
      tips: [
        "Aim for 7–9 hours consistently — one night of poor sleep raises insulin resistance by 25%",
        "Keep a fixed wake and sleep time to regulate your hormonal circadian rhythm",
        "Cool, dark room and no screens 60 min before bed improve sleep quality",
        "Magnesium glycinate (300mg) before bed improves both sleep and insulin sensitivity",
        "Sleep apnoea is more common with PCOS — mention loud snoring to your doctor",
      ],
    },
    {
      title: "Supplements (discuss with doctor first)",
      emoji: "💊",
      tips: [
        "Myo-inositol + D-chiro-inositol (40:1 ratio): improves insulin sensitivity and cycle regularity",
        "Magnesium: supports insulin, sleep, PMS mood and anxiety",
        "Vitamin D3: most women with PCOS are deficient; 2,000–4,000 IU/day often recommended",
        "Omega-3 fatty acids: reduces inflammation and androgen levels",
        "N-acetyl cysteine (NAC): antioxidant shown to support fertility and insulin in PCOS",
        "Zinc: supports skin, hair and immune function in PCOS",
      ],
    },
  ];

  const whenToSeeDoctor = [
    "Your periods are more than 35 days apart or you skip 3+ cycles in a row",
    "You have significant new facial or body hair growth",
    "You're trying to conceive and haven't succeeded after 6–12 months",
    "Your acne is severe and doesn't respond to standard skincare",
    "You experience noticeable scalp hair loss",
    "You notice dark skin patches (neck, armpits) — a sign of insulin resistance",
    "You have symptoms of sleep apnoea: snoring, waking gasping, daytime fatigue",
    "You experience pelvic pain that's unexplained or worsening",
  ];

  // ── Rotterdam 2003 phenotype classification ─────────────────────────────────
  // Criterion A: Oligo/anovulation (cycle irregularity)
  const criteriaA = (answers["cycle_regularity"] ?? 0) >= 2;

  // Criterion B: Hyperandrogenism proxy (acne + hirsutism + androgenic hair loss)
  //   Scoring: any 2 of the 3 androgen-related items present at moderate severity
  const androgenItems = [
    (answers["acne"] ?? 0) >= 2,           // frequent acne on jaw/chin/back
    (answers["hair_growth"] ?? 0) >= 2,    // noticeable hirsutism
    (answers["hair_loss"] ?? 0) >= 1,      // any scalp thinning
  ];
  const criteriaB = androgenItems.filter(Boolean).length >= 2;

  // Criterion C: PCO morphology proxy (insulin resistance + cravings + skin darkening)
  //   These are indirect metabolic markers; ultrasound is definitive
  const insulinItems = [
    (answers["skin_darkening"] ?? 0) >= 1,
    (answers["cravings"] ?? 0) >= 1,
    (answers["weight"] ?? 0) >= 1,
    (answers["fatigue"] ?? 0) >= 1,
  ];
  const criteriaC = insulinItems.filter(Boolean).length >= 2;

  const metCount = [criteriaA, criteriaB, criteriaC].filter(Boolean).length;

  let phenotype: RotterdamPhenotype;
  let phenotypeLabel: string;
  let metabolicRisk: "high" | "moderate" | "low";
  let phenotypeNote: string;

  if (criteriaA && criteriaB && criteriaC) {
    phenotype = "Classic_A";
    phenotypeLabel = "Classic PCOS (Phenotype A — all 3 criteria)";
    metabolicRisk = "high";
    phenotypeNote = "Most metabolically severe phenotype. Highest risk for insulin resistance and cardiovascular factors. Early clinical evaluation is strongly recommended.";
  } else if (criteriaA && criteriaB) {
    phenotype = "Classic_B";
    phenotypeLabel = "Classic PCOS (Phenotype B — irregular + hyperandrogenism)";
    metabolicRisk = "high";
    phenotypeNote = "High androgen + irregular cycles without confirmed metabolic markers. Blood tests (androgens, insulin) and ultrasound are the next step.";
  } else if (criteriaB && criteriaC) {
    phenotype = "Ovulatory_C";
    phenotypeLabel = "Ovulatory PCOS (Phenotype C — hyperandrogenism + metabolic markers)";
    metabolicRisk = "moderate";
    phenotypeNote = "Cycles may be regular but hyperandrogenism and metabolic signs are present. Sometimes called 'non-classic PCOS'. Lifestyle intervention is highly effective.";
  } else if (criteriaA && criteriaC) {
    phenotype = "Mild_D";
    phenotypeLabel = "Non-androgenic PCOS (Phenotype D — irregular + metabolic)";
    metabolicRisk = "moderate";
    phenotypeNote = "Irregular cycles with metabolic features but no obvious hyperandrogenism. Insulin resistance is the likely driver. Low-GI diet and exercise are first-line.";
  } else {
    phenotype = "Insufficient";
    phenotypeLabel = metCount === 1 ? "Single Rotterdam criterion — monitoring advised" : "No PCOS criteria met by questionnaire";
    metabolicRisk = "low";
    phenotypeNote = "The questionnaire did not identify ≥2 Rotterdam criteria. PCOS cannot be confirmed or ruled out without blood tests and ultrasound.";
  }

  const rotterdam: RotterdamClassification = {
    phenotype,
    label: phenotypeLabel,
    criteriaA,
    criteriaB,
    criteriaC,
    metabolicRisk,
    note: phenotypeNote,
  };

  return { score, maxScore, pct, risk, riskLabel, summary, topSymptoms, recommendations, lifestyleGuide, whenToSeeDoctor, rotterdam };
}
