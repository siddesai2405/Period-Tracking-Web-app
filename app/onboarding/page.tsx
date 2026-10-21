"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useUserData } from "@/lib/hooks/useUserData";
import type { ActivityLevel } from "@/lib/store";
import { useToast } from "@/components/ui/toaster";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { BloomLogo } from "@/components/bloom-logo";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 6;

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; emoji: string; desc: string }[] = [
  { value: "sedentary", label: "Sedentary", emoji: "🪑", desc: "Mostly sitting, little exercise" },
  { value: "light", label: "Light", emoji: "🚶", desc: "Light walks, 1-2x/week exercise" },
  { value: "moderate", label: "Moderate", emoji: "🏃", desc: "3-4x/week moderate exercise" },
  { value: "active", label: "Active", emoji: "💪", desc: "Daily exercise, physically demanding job" },
  { value: "veryActive", label: "Very Active", emoji: "🏋️", desc: "Athlete-level training, 2x/day workouts" },
];

const MEDICAL_CONDITIONS = [
  { id: "pcos", label: "PCOS", emoji: "🔬" },
  { id: "endometriosis", label: "Endometriosis", emoji: "🌸" },
  { id: "thyroid", label: "Thyroid disorder", emoji: "🦋" },
  { id: "anemia", label: "Anemia / Iron deficiency", emoji: "🩸" },
  { id: "ibs", label: "IBS / Digestive issues", emoji: "🫧" },
  { id: "diabetes", label: "Diabetes / Insulin resistance", emoji: "📊" },
  { id: "anxiety", label: "Anxiety / Depression", emoji: "🧠" },
  { id: "migraine", label: "Migraines", emoji: "⚡" },
];

const FOOD_ALLERGIES = [
  { id: "gluten", label: "Gluten", emoji: "🌾" },
  { id: "dairy", label: "Dairy", emoji: "🥛" },
  { id: "nuts", label: "Tree nuts / Peanuts", emoji: "🥜" },
  { id: "soy", label: "Soy", emoji: "🫘" },
  { id: "eggs", label: "Eggs", emoji: "🥚" },
  { id: "seafood", label: "Seafood", emoji: "🦐" },
];

function Chip({
  selected, onClick, emoji, label,
}: { selected: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all",
        selected
          ? "border-brand-400 bg-brand-400/10 text-brand-500 dark:text-brand-300"
          : "border-black/10 dark:border-white/10 bg-white/5 hover:border-black/20 dark:hover:border-white/20",
      )}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {selected && <Check size={13} className="ml-auto shrink-0 text-brand-400" />}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, setOnboarded, addCycle, profile } = useUserData();
  const push = useToast((s) => s.push);
  const [step, setStep] = useState(0);

  // Step 0-1: cycle data
  const [lastPeriod, setLastPeriod] = useState("");
  const [avg, setAvg] = useState(28);
  const [period, setPeriod] = useState(5);

  // Step 2: body measurements
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [birthYear, setBirthYear] = useState("");

  // Step 3: activity level
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

  // Step 4: medical conditions (multi-select)
  const [conditions, setConditions] = useState<string[]>([]);

  // Step 5: food allergies (multi-select)
  const [allergies, setAllergies] = useState<string[]>([]);

  const toggleCondition = (id: string) =>
    setConditions((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const toggleAllergy = (id: string) =>
    setAllergies((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  const finish = () => {
    setProfile({
      avgCycleLength: avg,
      avgPeriodLength: period,
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      birthYear: birthYear ? Number(birthYear) : undefined,
      activityLevel,
      medicalConditions: conditions,
      foodAllergies: allergies,
    });
    if (lastPeriod) addCycle({ startDate: lastPeriod });
    setOnboarded(true);
    push({ title: "All set!", description: "Your personalized dashboard is ready.", tone: "success" });
    router.push("/dashboard");
  };

  const canNext = () => {
    if (step === 0) return !!lastPeriod;
    return true;
  };

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-700/20" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-lavender-200/60 blur-3xl dark:bg-lavender-700/20" />

      <div className="glass rounded-[2rem] p-8 md:p-10 shadow-glass max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <BloomLogo size={48} rounded="14" />
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-8 bg-brand-gradient" : i < step ? "w-4 bg-brand-400/60" : "w-4 bg-brand-100 dark:bg-white/10",
                )}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Last period date */}
          {step === 0 && (
            <motion.div key="0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <h1 className="font-display text-3xl font-bold">Hi {profile.name} 👋</h1>
              <p className="mt-2 opacity-75">Let's personalise Lotus Phase. When did your last period start?</p>
              <div className="mt-6">
                <Label>Last period start date</Label>
                <Input type="date" value={lastPeriod} onChange={(e) => setLastPeriod(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
              </div>
            </motion.div>
          )}

          {/* Step 1: Cycle length */}
          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <h1 className="font-display text-3xl font-bold">Your cycle length</h1>
              <p className="mt-2 opacity-75">Average days from one period start to the next.</p>
              <div className="mt-6 text-center">
                <div className="font-display text-6xl font-bold shimmer-text">{avg}</div>
                <p className="text-sm opacity-60 mt-1">days</p>
                <input type="range" min={20} max={45} value={avg} onChange={(e) => setAvg(+e.target.value)} className="w-full mt-4 accent-brand-500" />
                <div className="flex justify-between text-xs opacity-60"><span>20</span><span>28 avg</span><span>45</span></div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Period length */}
          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <h1 className="font-display text-3xl font-bold">Period length</h1>
              <p className="mt-2 opacity-75">How many days does your bleeding usually last?</p>
              <div className="mt-6 text-center">
                <div className="font-display text-6xl font-bold shimmer-text">{period}</div>
                <p className="text-sm opacity-60 mt-1">days</p>
                <input type="range" min={2} max={10} value={period} onChange={(e) => setPeriod(+e.target.value)} className="w-full mt-4 accent-brand-500" />
                <div className="flex justify-between text-xs opacity-60"><span>2</span><span>5 avg</span><span>10</span></div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Body measurements */}
          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <h1 className="font-display text-3xl font-bold">Health profile</h1>
              <p className="mt-2 opacity-75">Helps Luna personalise meal plans and recommendations. All optional.</p>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Height (cm)</Label>
                    <Input type="number" placeholder="e.g. 162" value={height} onChange={(e) => setHeight(e.target.value)} min={100} max={220} />
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input type="number" placeholder="e.g. 58" value={weight} onChange={(e) => setWeight(e.target.value)} min={30} max={200} />
                  </div>
                </div>
                <div>
                  <Label>Birth year</Label>
                  <Input type="number" placeholder="e.g. 1997" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} min={1950} max={new Date().getFullYear() - 10} />
                </div>
                {height && weight && (
                  <div className="rounded-2xl bg-brand-500/10 border border-brand-500/20 px-4 py-3 text-sm">
                    <span className="font-semibold text-brand-400">BMI: </span>
                    {(Number(weight) / ((Number(height) / 100) ** 2)).toFixed(1)}
                    <span className="opacity-60 ml-2">— used to tailor your meal plan</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Activity level + medical conditions */}
          {step === 4 && (
            <motion.div key="4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <h1 className="font-display text-3xl font-bold">Activity & health</h1>
              <p className="mt-2 opacity-75">Helps personalise your fitness and wellness plans.</p>
              <div className="mt-5">
                <p className="text-sm font-semibold mb-3">Activity level</p>
                <div className="space-y-2">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActivityLevel(opt.value)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                        activityLevel === opt.value
                          ? "border-brand-400 bg-brand-400/10"
                          : "border-black/10 dark:border-white/10 bg-white/5 hover:border-black/20 dark:hover:border-white/20",
                      )}
                    >
                      <span className="text-xl shrink-0">{opt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs opacity-60">{opt.desc}</p>
                      </div>
                      {activityLevel === opt.value && <Check size={16} className="text-brand-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <p className="text-sm font-semibold mb-1">Health conditions</p>
                <p className="text-xs opacity-60 mb-3">Select any that apply (optional)</p>
                <div className="grid grid-cols-2 gap-2">
                  {MEDICAL_CONDITIONS.map((c) => (
                    <Chip key={c.id} selected={conditions.includes(c.id)} onClick={() => toggleCondition(c.id)} emoji={c.emoji} label={c.label} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Food allergies */}
          {step === 5 && (
            <motion.div key="5" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <h1 className="font-display text-3xl font-bold">Food allergies</h1>
              <p className="mt-2 opacity-75">Luna will always exclude these from your meal plans and recommendations.</p>
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-2">
                  {FOOD_ALLERGIES.map((a) => (
                    <Chip key={a.id} selected={allergies.includes(a.id)} onClick={() => toggleAllergy(a.id)} emoji={a.emoji} label={a.label} />
                  ))}
                </div>
                {allergies.length === 0 && (
                  <p className="mt-4 text-xs opacity-60 text-center">No allergies? Just tap Finish — Luna has you covered.</p>
                )}
              </div>
              <div className="mt-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs">
                <span className="font-semibold text-emerald-400">Almost done! </span>
                Your personalized AI guide, meal plans, and wellness routines are ready to generate.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ArrowLeft size={16} /> Back
          </Button>
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={finish}>
              Finish <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
