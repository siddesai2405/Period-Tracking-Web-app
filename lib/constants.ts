export const SYMPTOMS = [
  "Cramps",
  "Headache",
  "Bloating",
  "Backache",
  "Fatigue",
  "Acne",
  "Breast tenderness",
  "Cravings",
  "Nausea",
  "Insomnia",
  "Dizziness",
  "Mood swings",
] as const;

export const MOODS = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "calm", label: "Calm", emoji: "😌" },
  { id: "energetic", label: "Energetic", emoji: "⚡" },
  { id: "sad", label: "Sad", emoji: "😔" },
  { id: "anxious", label: "Anxious", emoji: "😰" },
  { id: "irritable", label: "Irritable", emoji: "😤" },
] as const;

export const FLOWS = [
  { id: "spotting", label: "Spotting", color: "bg-rose-200" },
  { id: "light", label: "Light", color: "bg-rose-300" },
  { id: "medium", label: "Medium", color: "bg-rose-500" },
  { id: "heavy", label: "Heavy", color: "bg-rose-700" },
] as const;
