// Phase-based diet recommendations aligned with the menstrual cycle.

export type DietPhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface KeyNutrient {
  name: string;
  why: string;
  sources: string;
}

export interface Recipe {
  name: string;
  emoji: string;
  description: string;
  nutrients: string;
  time: string;
}

export interface DietPhaseData {
  phase: DietPhase;
  label: string;
  emoji: string;
  days: string;
  tagline: string;
  description: string;
  keyNutrients: KeyNutrient[];
  eat: string[];
  limit: string[];
  recipes: Recipe[];
  sampleMealPlan: { breakfast: string; lunch: string; dinner: string; snacks: string[] };
  hydration: string;
}

export const dietPhases: DietPhaseData[] = [
  {
    phase: "menstrual",
    label: "Menstrual",
    emoji: "🌹",
    days: "Days 1–5",
    tagline: "Replenish & Restore",
    description:
      "Your uterine lining is shedding. Focus on replenishing iron, reducing inflammation, and soothing cramps with warm, nourishing foods.",
    keyNutrients: [
      { name: "Iron", why: "Replenishes what's lost through bleeding", sources: "Lentils, spinach, red meat, tofu, pumpkin seeds" },
      { name: "Vitamin C", why: "Enhances iron absorption by up to 3×", sources: "Bell peppers, citrus, strawberries, kiwi" },
      { name: "Magnesium", why: "Reduces cramps, mood swings and headaches", sources: "Dark chocolate, almonds, avocado, black beans" },
      { name: "Omega-3", why: "Anti-inflammatory — eases prostaglandin-driven cramps", sources: "Salmon, sardines, walnuts, flaxseeds, chia" },
      { name: "Zinc", why: "Supports immune function and tissue repair", sources: "Pumpkin seeds, chickpeas, cashews, beef" },
    ],
    eat: [
      "Warm, cooked meals: soups, stews, congee, dal",
      "Iron-rich foods: lentils, spinach, dark leafy greens with vitamin C",
      "Fatty fish (salmon, sardines) for omega-3 anti-inflammatories",
      "Dark chocolate (70%+) for magnesium and mood support",
      "Beets and beet juice to support blood production",
      "Ginger and turmeric teas for cramp and inflammation relief",
      "Chamomile tea for relaxation and cramp soothing",
      "Slow-cooked legumes and grains for sustained energy",
    ],
    limit: [
      "Caffeine — can intensify cramps and heighten anxiety",
      "Alcohol — increases inflammation and disrupts restorative sleep",
      "Very salty processed foods — worsen bloating and water retention",
      "Ice cold foods and drinks — may intensify cramping (traditional medicine)",
      "High-sugar refined foods — cause energy crashes when you need stability",
    ],
    recipes: [
      { name: "Red Lentil & Spinach Soup", emoji: "🍲", description: "Red lentils, spinach, ginger, turmeric, coconut milk, lemon. Warming and iron-packed.", nutrients: "Iron, Magnesium, Vit C", time: "25 min" },
      { name: "Salmon & Avocado Rice Bowl", emoji: "🥗", description: "Baked salmon, avocado, brown rice, edamame, lemon-ginger dressing.", nutrients: "Omega-3, Zinc, Magnesium", time: "20 min" },
      { name: "Dark Chocolate Oat Porridge", emoji: "🍫", description: "Warm oats, dark chocolate chips, almonds, banana. Comforting and magnesium-rich.", nutrients: "Magnesium, Iron, Slow Carbs", time: "10 min" },
    ],
    sampleMealPlan: {
      breakfast: "Warm oatmeal with banana, dark chocolate chips, and almond butter",
      lunch: "Red lentil soup with crusty whole-grain bread + a glass of orange juice",
      dinner: "Baked salmon with roasted sweet potato and steamed spinach with lemon",
      snacks: ["Handful of pumpkin seeds", "Chamomile tea with honey", "2–3 squares dark chocolate"],
    },
    hydration:
      "Aim for 2–2.5L/day. Warm fluids are especially soothing — ginger tea helps with nausea and cramps, chamomile reduces anxiety, peppermint helps digestion.",
  },

  {
    phase: "follicular",
    label: "Follicular",
    emoji: "🌱",
    days: "Days 6–13",
    tagline: "Energise & Build",
    description:
      "Estrogen is rising and follicles develop. Your metabolism is more efficient and energy is increasing. Focus on fresh, light, protein-rich foods to fuel your upswing.",
    keyNutrients: [
      { name: "Protein", why: "Supports cell growth and muscle recovery as energy rises", sources: "Eggs, chicken, legumes, Greek yogurt, fish, tofu" },
      { name: "B Vitamins", why: "Drive energy metabolism and estrogen detoxification in the liver", sources: "Leafy greens, eggs, whole grains, nutritional yeast" },
      { name: "Probiotics", why: "Support gut health and proper estrogen metabolism", sources: "Greek yogurt, kefir, kimchi, sauerkraut, kombucha" },
      { name: "Phytoestrogens", why: "Gently support the estrogen-building phase", sources: "Flaxseeds, edamame, tofu, sesame seeds" },
      { name: "Complex Carbs", why: "Sustained energy for increasing activity level", sources: "Quinoa, oats, sweet potato, brown rice, barley" },
    ],
    eat: [
      "Fresh salads and raw vegetables — digestive capacity is strongest now",
      "Fermented foods: yogurt, kefir, kimchi, sauerkraut",
      "Eggs — excellent source of hormone-building protein and choline",
      "Sprouts and microgreens for enzymes and B vitamins",
      "Quinoa and ancient grains",
      "2 tbsp of ground flaxseeds daily (seed cycling — follicular phase)",
      "Green smoothies with spinach, banana, flaxseed",
      "Lemon water in the morning to support liver detox",
    ],
    limit: [
      "Heavy, fatty comfort foods that slow digestion and energy",
      "Excessive alcohol — impairs liver's estrogen processing",
      "Ultra-processed snacks",
    ],
    recipes: [
      { name: "Green Smoothie Bowl", emoji: "🥬", description: "Spinach, mango, banana, flaxseeds, topped with granola, kiwi and coconut flakes.", nutrients: "B Vitamins, Probiotics, Phytoestrogens", time: "5 min" },
      { name: "Quinoa Buddha Bowl", emoji: "🌿", description: "Quinoa, roasted veggies, chickpeas, tahini dressing, fresh sprouts.", nutrients: "Complex Carbs, Protein, B Vitamins", time: "30 min" },
      { name: "Egg & Avocado Sourdough", emoji: "🥚", description: "Sourdough toast, smashed avocado, poached egg, chili flakes, lemon.", nutrients: "Protein, Healthy Fats, B Vitamins", time: "10 min" },
    ],
    sampleMealPlan: {
      breakfast: "Green smoothie with spinach, mango, banana, ground flaxseeds and almond milk",
      lunch: "Quinoa Buddha bowl with roasted chickpeas, cucumber, tomato, lemon tahini",
      dinner: "Grilled chicken with steamed broccoli, sweet potato, and a fresh side salad",
      snacks: ["Greek yogurt with berries and granola", "Edamame with sea salt", "Trail mix with seeds and nuts"],
    },
    hydration:
      "2–2.5L/day. Green tea is excellent — antioxidants and gentle energy. Lemon water supports liver detox as estrogen rises.",
  },

  {
    phase: "ovulatory",
    label: "Ovulatory",
    emoji: "✨",
    days: "Days 14–17",
    tagline: "Shine & Protect",
    description:
      "Estrogen and LH peak. Your energy, confidence and social drive are at their highest. Support liver health for estrogen clearance and fuel your peak performance.",
    keyNutrients: [
      { name: "Antioxidants", why: "Protect egg quality during ovulation", sources: "Berries, colourful vegetables, green tea, pomegranate" },
      { name: "Fiber", why: "Helps liver clear excess estrogen to prevent dominance", sources: "Vegetables, fruit, legumes, flaxseeds, psyllium" },
      { name: "Zinc", why: "Supports the LH surge and ovulation itself", sources: "Pumpkin seeds, oysters, cashews, chickpeas" },
      { name: "Vitamin E", why: "Antioxidant support for egg quality", sources: "Almonds, sunflower seeds, olive oil, avocado" },
      { name: "Folate", why: "Cell division support during peak fertility window", sources: "Leafy greens, lentils, beans, asparagus" },
    ],
    eat: [
      "Light, fresh meals: raw salads, grilled fish, grain bowls",
      "Colourful vegetables: bell peppers, tomatoes, berries, purple cabbage",
      "Raw pumpkin and sunflower seeds (seed cycling — ovulatory phase)",
      "Cruciferous vegetables (broccoli, cauliflower, kale) for estrogen detox",
      "Berries and pomegranate for antioxidants and egg protection",
      "Light proteins: fish, eggs, tempeh, white beans",
      "Hydrating foods: cucumber, watermelon, coconut water",
    ],
    limit: [
      "Heavy, rich meals that burden digestion during peak activity",
      "Excessive alcohol — impairs estrogen clearance",
      "Too much processed soy if you have estrogen sensitivity",
    ],
    recipes: [
      { name: "Berry & Pomegranate Smoothie", emoji: "🫐", description: "Mixed berries, pomegranate seeds, spinach, coconut water, chia. Antioxidant powerhouse.", nutrients: "Antioxidants, Folate, Vitamin C", time: "5 min" },
      { name: "Grilled Salmon Salad", emoji: "🐟", description: "Grilled salmon, mixed greens, roasted peppers, pumpkin seeds, apple cider vinaigrette.", nutrients: "Omega-3, Zinc, Antioxidants", time: "20 min" },
      { name: "Broccoli & Tempeh Stir Fry", emoji: "🥦", description: "Tempeh, broccoli, ginger, garlic, tamari, sesame oil over brown rice.", nutrients: "Fiber, Zinc, Protein, Folate", time: "20 min" },
    ],
    sampleMealPlan: {
      breakfast: "Mixed berry smoothie with pomegranate, spinach, pumpkin seeds and coconut water",
      lunch: "Large colourful salad: romaine, tomatoes, bell peppers, cucumber, hard-boiled eggs, lemon dressing",
      dinner: "Grilled salmon, steamed broccoli and cauliflower, quinoa",
      snacks: ["Pumpkin and sunflower seed mix", "Sliced bell peppers with hummus", "Green tea"],
    },
    hydration:
      "2.5–3L/day. Body temperature rises slightly around ovulation — stay well hydrated. Coconut water is a great electrolyte source. Lots of water-rich fruits and veg.",
  },

  {
    phase: "luteal",
    label: "Luteal",
    emoji: "🌙",
    days: "Days 18–28",
    tagline: "Calm & Balance",
    description:
      "Progesterone rises then falls if no pregnancy occurs. PMS, cravings, mood changes and bloating are common. Stabilise blood sugar, support mood and reduce inflammation.",
    keyNutrients: [
      { name: "Magnesium", why: "Reduces PMS, cramps, bloating, anxiety and improves sleep", sources: "Dark chocolate, pumpkin seeds, spinach, almonds, avocado" },
      { name: "Vitamin B6", why: "Reduces mood swings, breast tenderness and PMS severity", sources: "Banana, chicken, potatoes with skin, sunflower seeds" },
      { name: "Calcium", why: "1,200mg/day reduces PMS symptoms significantly (clinical studies)", sources: "Dairy, fortified plant milks, sesame seeds, sardines, kale" },
      { name: "Complex Carbs", why: "Raise serotonin, reduce cravings and smooth out mood dips", sources: "Oats, sweet potato, brown rice, whole grain bread" },
      { name: "Tryptophan", why: "Precursor to serotonin — the calm, happy neurotransmitter", sources: "Turkey, pumpkin seeds, oats, eggs, cheese" },
    ],
    eat: [
      "Warm, grounding meals: soups, stews, roasted root vegetables",
      "Complex carbs: oats, sweet potato, brown rice to stabilise blood sugar",
      "Dark chocolate (70%+) — satisfies cravings and provides magnesium",
      "2 tbsp ground pumpkin and sesame seeds daily (seed cycling — luteal phase)",
      "Turkey and chicken for tryptophan and serotonin production",
      "Avocado for healthy fats and magnesium",
      "Fennel and peppermint tea for bloating relief",
      "Small, frequent meals to keep blood sugar steady",
    ],
    limit: [
      "Caffeine — worsens breast tenderness and anxiety notably in this phase",
      "Alcohol — severely disrupts progesterone and restorative sleep",
      "Very salty foods — worsen water retention and abdominal bloating",
      "Refined sugars and sweets — cause blood sugar spikes that crash mood",
      "Skipping meals — large glucose gaps trigger intense cravings",
    ],
    recipes: [
      { name: "Magnesium Dark Chocolate Oats", emoji: "🍫", description: "Warm oats, dark chocolate, banana, almond butter, pumpkin seeds. Satisfies PMS cravings cleanly.", nutrients: "Magnesium, Complex Carbs, Tryptophan", time: "10 min" },
      { name: "Sweet Potato & Lentil Curry", emoji: "🍛", description: "Sweet potato, red lentils, coconut milk, turmeric, garam masala. Blood-sugar balancing.", nutrients: "Complex Carbs, B Vitamins, Magnesium", time: "30 min" },
      { name: "Turkey & Avocado Wrap", emoji: "🌯", description: "Whole wheat wrap, roasted turkey, avocado, spinach, mustard. Serotonin-supportive lunch.", nutrients: "Tryptophan, B6, Healthy Fats", time: "10 min" },
    ],
    sampleMealPlan: {
      breakfast: "Warm oatmeal with banana, almond butter, cinnamon, and ground pumpkin seeds",
      lunch: "Sweet potato and red lentil soup with a whole-grain roll",
      dinner: "Roasted chicken thigh, roasted root vegetables, steamed kale with lemon",
      snacks: ["2–3 squares dark chocolate with almonds", "Banana with peanut butter", "Fennel or peppermint tea"],
    },
    hydration:
      "2–2.5L/day. Bloating is common — stay hydrated paradoxically; it helps kidneys flush excess fluid. Herbal teas (fennel, peppermint, chamomile) are ideal and caffeine-free.",
  },
];
