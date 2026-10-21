// Phase-based wellness companion content. Pure data — easy to extend.
import type { CyclePhase } from "./prediction";

export interface WellnessPlan {
  phase: CyclePhase;
  title: string;
  emoji: string;
  hero: string;
  energy: number; // 0..100
  focus: number; // 0..100
  social: number; // 0..100
  affirmation: string;
  yoga: { name: string; duration: string; benefit: string }[];
  nutrition: { food: string; why: string; emoji: string }[];
  movement: string;
  rest: string;
  selfcare: string[];
  avoid: string[];
}

export const WELLNESS: Record<CyclePhase, WellnessPlan> = {
  menstrual: {
    phase: "menstrual",
    title: "Restore",
    emoji: "🌹",
    hero: "Your body is doing sacred work. Permission to slow down — fully granted.",
    energy: 25,
    focus: 30,
    social: 20,
    affirmation: "I honour my body's wisdom. Rest is productive.",
    yoga: [
      { name: "Child's pose", duration: "5 min", benefit: "Releases lower-back tension" },
      { name: "Reclined butterfly", duration: "8 min", benefit: "Soothes cramps and pelvic floor" },
      { name: "Legs up the wall", duration: "10 min", benefit: "Calms nervous system, reduces bloating" },
    ],
    nutrition: [
      { food: "Iron-rich greens", why: "Replenish what menstruation depletes", emoji: "🥬" },
      { food: "Dark chocolate (70%+)", why: "Magnesium eases cramps & cravings", emoji: "🍫" },
      { food: "Warm ginger tea", why: "Anti-inflammatory, soothes the gut", emoji: "🫖" },
      { food: "Salmon or lentils", why: "Omega-3 + protein to rebuild", emoji: "🐟" },
    ],
    movement: "Gentle walks (15–20 min), restorative yoga, light stretching. Skip HIIT today.",
    rest: "Aim for 8–9 hours. A warm bath 90 min before bed helps a lot.",
    selfcare: [
      "Heating pad on lower abdomen",
      "Journal three things you're letting go of",
      "Cancel a non-essential plan without guilt",
    ],
    avoid: ["High-intensity workouts", "Caffeine after 2pm", "Salt-heavy meals (worsens bloating)"],
  },
  follicular: {
    phase: "follicular",
    title: "Rise",
    emoji: "🌱",
    hero: "Estrogen is climbing — your brain is hungry for new ideas. Plant something today.",
    energy: 70,
    focus: 85,
    social: 70,
    affirmation: "I am growing. I welcome new beginnings with open arms.",
    yoga: [
      { name: "Sun salutations (3 rounds)", duration: "10 min", benefit: "Builds heat & momentum" },
      { name: "Warrior II flow", duration: "8 min", benefit: "Channels rising energy" },
      { name: "Crow pose practice", duration: "5 min", benefit: "Try something new while bold" },
    ],
    nutrition: [
      { food: "Fermented foods (kimchi, kefir)", why: "Supports estrogen metabolism", emoji: "🥗" },
      { food: "Sprouted seeds & flax", why: "Phytoestrogens for hormonal balance", emoji: "🌾" },
      { food: "Citrus & berries", why: "Vitamin C boosts iron absorption", emoji: "🍓" },
      { food: "Lean chicken or tofu", why: "Protein fuels follicle growth", emoji: "🍗" },
    ],
    movement: "Strength training, dance, cardio, or a new class. You can handle progressive overload.",
    rest: "7–8 hours. You may need slightly less sleep — listen to your body.",
    selfcare: [
      "Start that project you've been postponing",
      "Schedule the meeting you've been avoiding",
      "Try a recipe outside your comfort zone",
    ],
    avoid: ["Over-committing — your yes-energy is high right now"],
  },
  ovulatory: {
    phase: "ovulatory",
    title: "Radiate",
    emoji: "✨",
    hero: "Peak estrogen + testosterone. You are magnetic, articulate, and unstoppable today.",
    energy: 95,
    focus: 90,
    social: 95,
    affirmation: "I am confident, expressive, and deeply alive.",
    yoga: [
      { name: "Vinyasa flow", duration: "20 min", benefit: "Match the body's natural fire" },
      { name: "Heart openers (camel, wheel)", duration: "8 min", benefit: "Channels open, expressive energy" },
      { name: "Dancer's pose", duration: "5 min", benefit: "Strength, balance, grace" },
    ],
    nutrition: [
      { food: "Anti-oxidant rainbow salad", why: "Protect the egg with phytonutrients", emoji: "🥗" },
      { food: "Brazil nuts (1–2)", why: "Selenium for egg quality", emoji: "🌰" },
      { food: "Cruciferous veggies", why: "Help liver clear excess estrogen", emoji: "🥦" },
      { food: "Plenty of water", why: "Cervical mucus loves hydration", emoji: "💧" },
    ],
    movement: "HIIT, heavy lifting, sprints, group classes. Your VO₂ max peaks here.",
    rest: "7–8 hours. Avoid blue light after 10pm — sleep onset can be tricky now.",
    selfcare: [
      "Have the brave conversation today",
      "Record a voice note — your articulation is sharpest now",
      "Take the photo, post the thing",
    ],
    avoid: ["Overheating in saunas if trying to conceive — keep core temp moderate"],
  },
  luteal: {
    phase: "luteal",
    title: "Reflect",
    emoji: "🌙",
    hero: "Progesterone rises — slow down, look inward, finish what you started.",
    energy: 55,
    focus: 65,
    social: 45,
    affirmation: "I trust my inner voice. Slowing down is wisdom, not weakness.",
    yoga: [
      { name: "Slow yin sequence", duration: "15 min", benefit: "Drops cortisol, soothes PMS" },
      { name: "Supported bridge", duration: "5 min", benefit: "Relieves lower-back ache" },
      { name: "Pigeon pose (each side)", duration: "6 min", benefit: "Releases stored hip tension" },
    ],
    nutrition: [
      { food: "Sweet potato & squash", why: "Complex carbs steady progesterone-driven cravings", emoji: "🍠" },
      { food: "Pumpkin & sunflower seeds", why: "Magnesium + B6 ease PMS mood swings", emoji: "🎃" },
      { food: "Bananas & oats", why: "Tryptophan + B6 → calm, better sleep", emoji: "🍌" },
      { food: "Chamomile or peppermint tea", why: "Soothes bloating and anxiety", emoji: "🌿" },
    ],
    movement: "Pilates, walking, moderate weights, swimming. Reduce intensity in the second half.",
    rest: "8–9 hours. Cool, dark room — body temp is naturally higher now.",
    selfcare: [
      "Batch-prep meals so future-you doesn't have to decide",
      "Two screen-free hours before bed",
      "Schedule one cancellation buffer day this week",
    ],
    avoid: ["Hard caffeine", "Skipping meals (blood sugar dips amplify PMS)", "Doom-scrolling at night"],
  },
};
