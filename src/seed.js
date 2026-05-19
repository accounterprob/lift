import { getAll, putMany } from './db.js';
import { uuid } from './utils.js';

export const CATEGORIES = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Legs', 'Glutes', 'Calves', 'Core', 'Cardio', 'Full Body', 'Other',
];

export const EQUIPMENT = [
  'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight',
  'Kettlebell', 'Bands', 'Other',
];

const SEEDS = [
  // Chest
  ['Bench Press (Barbell)', 'Chest', 'Barbell'],
  ['Bench Press (Dumbbell)', 'Chest', 'Dumbbell'],
  ['Incline Bench Press (Barbell)', 'Chest', 'Barbell'],
  ['Incline Bench Press (Dumbbell)', 'Chest', 'Dumbbell'],
  ['Decline Bench Press (Barbell)', 'Chest', 'Barbell'],
  ['Chest Fly (Dumbbell)', 'Chest', 'Dumbbell'],
  ['Chest Fly (Machine)', 'Chest', 'Machine'],
  ['Cable Crossover', 'Chest', 'Cable'],
  ['Push-Up', 'Chest', 'Bodyweight'],
  ['Dip (Chest)', 'Chest', 'Bodyweight'],

  // Back
  ['Deadlift (Conventional)', 'Back', 'Barbell'],
  ['Deadlift (Sumo)', 'Back', 'Barbell'],
  ['Romanian Deadlift', 'Back', 'Barbell'],
  ['Bent-Over Row (Barbell)', 'Back', 'Barbell'],
  ['Pendlay Row', 'Back', 'Barbell'],
  ['Row (Dumbbell)', 'Back', 'Dumbbell'],
  ['T-Bar Row', 'Back', 'Barbell'],
  ['Seated Cable Row', 'Back', 'Cable'],
  ['Lat Pulldown', 'Back', 'Cable'],
  ['Pull-Up', 'Back', 'Bodyweight'],
  ['Chin-Up', 'Back', 'Bodyweight'],
  ['Face Pull', 'Back', 'Cable'],
  ['Shrug (Barbell)', 'Back', 'Barbell'],
  ['Shrug (Dumbbell)', 'Back', 'Dumbbell'],

  // Shoulders
  ['Overhead Press (Barbell)', 'Shoulders', 'Barbell'],
  ['Overhead Press (Dumbbell)', 'Shoulders', 'Dumbbell'],
  ['Seated Shoulder Press (Machine)', 'Shoulders', 'Machine'],
  ['Arnold Press', 'Shoulders', 'Dumbbell'],
  ['Lateral Raise (Dumbbell)', 'Shoulders', 'Dumbbell'],
  ['Lateral Raise (Cable)', 'Shoulders', 'Cable'],
  ['Front Raise (Dumbbell)', 'Shoulders', 'Dumbbell'],
  ['Rear Delt Fly (Dumbbell)', 'Shoulders', 'Dumbbell'],
  ['Reverse Pec Deck', 'Shoulders', 'Machine'],
  ['Upright Row', 'Shoulders', 'Barbell'],

  // Biceps
  ['Barbell Curl', 'Biceps', 'Barbell'],
  ['Dumbbell Curl', 'Biceps', 'Dumbbell'],
  ['Hammer Curl', 'Biceps', 'Dumbbell'],
  ['Preacher Curl', 'Biceps', 'Barbell'],
  ['Incline Dumbbell Curl', 'Biceps', 'Dumbbell'],
  ['Cable Curl', 'Biceps', 'Cable'],
  ['Concentration Curl', 'Biceps', 'Dumbbell'],

  // Triceps
  ['Close-Grip Bench Press', 'Triceps', 'Barbell'],
  ['Tricep Pushdown (Cable)', 'Triceps', 'Cable'],
  ['Overhead Tricep Extension (Dumbbell)', 'Triceps', 'Dumbbell'],
  ['Overhead Tricep Extension (Cable)', 'Triceps', 'Cable'],
  ['Skull Crusher', 'Triceps', 'Barbell'],
  ['Dip (Tricep)', 'Triceps', 'Bodyweight'],
  ['Tricep Kickback', 'Triceps', 'Dumbbell'],

  // Legs / Glutes / Calves
  ['Back Squat', 'Legs', 'Barbell'],
  ['Front Squat', 'Legs', 'Barbell'],
  ['Goblet Squat', 'Legs', 'Dumbbell'],
  ['Bulgarian Split Squat', 'Legs', 'Dumbbell'],
  ['Lunge', 'Legs', 'Dumbbell'],
  ['Leg Press', 'Legs', 'Machine'],
  ['Leg Extension', 'Legs', 'Machine'],
  ['Leg Curl (Seated)', 'Legs', 'Machine'],
  ['Leg Curl (Lying)', 'Legs', 'Machine'],
  ['Hip Thrust (Barbell)', 'Glutes', 'Barbell'],
  ['Glute Bridge', 'Glutes', 'Bodyweight'],
  ['Cable Kickback', 'Glutes', 'Cable'],
  ['Hip Abduction (Machine)', 'Glutes', 'Machine'],
  ['Standing Calf Raise', 'Calves', 'Machine'],
  ['Seated Calf Raise', 'Calves', 'Machine'],

  // Core
  ['Plank', 'Core', 'Bodyweight'],
  ['Hanging Leg Raise', 'Core', 'Bodyweight'],
  ['Cable Crunch', 'Core', 'Cable'],
  ['Russian Twist', 'Core', 'Bodyweight'],
  ['Ab Wheel Rollout', 'Core', 'Other'],

  // Forearms
  ['Wrist Curl', 'Forearms', 'Dumbbell'],
  ['Reverse Wrist Curl', 'Forearms', 'Dumbbell'],
  ["Farmer's Carry", 'Forearms', 'Dumbbell'],
];

export async function seedIfNeeded() {
  const existing = await getAll('exercises');
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));
  const now = Date.now();

  const toInsert = SEEDS.filter(([name]) => !existingNames.has(name.toLowerCase()))
    .map(([name, category, equipment]) => ({
      id: uuid(),
      name,
      category,
      equipment,
      notes: '',
      isCustom: false,
      createdAt: now,
    }));

  if (toInsert.length > 0) {
    await putMany('exercises', toInsert);
  }
  return toInsert.length;
}
