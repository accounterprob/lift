import { getAll, putMany } from './db.js';
import { uuid } from './utils.js';

/**
 * Stable color palette per muscle group. Chosen so that any single workout's
 * 4-5 muscle groups land on maximally distinct HUES (not just shades), which
 * matters for colorblind viewing. Muscles trained on the same day get
 * different hues; muscles on different days can repeat colors.
 *
 * Palette: Blue / Orange / Purple / Yellow / Pink / Brown / Green / Cyan / Red / Gray
 */
const MUSCLE_COLORS = {
  // Leg Day: Quads, Hamstrings, Glutes, Calves, Adductors
  'Quads':       '#3b82f6', // blue
  'Hamstrings':  '#f97316', // orange
  'Glutes':      '#a855f7', // purple
  'Calves':      '#eab308', // yellow
  'Adductors':   '#ec4899', // pink

  // Chest Day: Chest, Triceps, Front Delts, Side Delts
  'Chest':       '#3b82f6', // blue
  'Triceps':     '#f97316', // orange
  'Front Delts': '#a855f7', // purple
  'Side Delts':  '#eab308', // yellow

  // Back Day: Lats, Mid Back, Biceps, Rear Delts, Traps
  'Lats':        '#3b82f6', // blue
  'Mid Back':    '#f97316', // orange
  'Biceps':      '#ec4899', // pink (so Back Day with Lats/MB/Biceps/RD/Traps stays distinct)
  'Rear Delts':  '#a855f7', // purple
  'Traps':       '#eab308', // yellow

  // Misc / cross-day
  'Lower Back':  '#92400e', // brown
  'Forearms':    '#22c55e', // green
  'Abs':         '#92400e', // brown
  'Cardio':      '#06b6d4', // cyan
  'Other':       '#6b7280', // gray
};

export function colorForMuscle(muscle) {
  return MUSCLE_COLORS[muscle] ?? '#6b7280';
}

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

/**
 * Returns the primary muscle group worked by an exercise, drilling down past
 * the broad category. e.g. "Lateral Raise" → "Side Delts", "Romanian Deadlift"
 * → "Hamstrings", "Leg Extension" → "Quads". Order of checks matters: more
 * specific patterns must come before generic ones (e.g. "Romanian Deadlift"
 * before generic "deadlift", "leg curl" before "curl").
 */
export function primaryMuscleFor(exercise) {
  const name = (exercise?.name || '').toLowerCase();
  if (!name) return exercise?.category || 'Other';

  // Hamstring-specific exercises (must precede generic "deadlift" and "curl")
  if (/romanian deadlift|stiff.?leg|good morning/.test(name)) return 'Hamstrings';
  if (/leg curl/.test(name)) return 'Hamstrings';

  // Quad-focused isolation
  if (/leg extension/.test(name)) return 'Quads';

  // Calves
  if (/calf/.test(name)) return 'Calves';

  // Hip-focused
  if (/hip adduction|adductor|inner thigh/.test(name)) return 'Adductors';
  if (/hip thrust|glute|hip abduction|cable kickback|donkey kick/.test(name)) return 'Glutes';

  // Compound leg → quads primary
  if (/squat|leg press|lunge|step.?up|split squat/.test(name)) return 'Quads';

  // Lower back / posterior chain
  if (/back extension|hyperextension/.test(name)) return 'Lower Back';
  if (/deadlift/.test(name)) return 'Lower Back';

  // Shoulder subdivisions (before generic "press" and "raise")
  if (/lateral raise|side delt/.test(name)) return 'Side Delts';
  if (/rear delt|reverse fly|face pull|reverse pec deck/.test(name)) return 'Rear Delts';
  if (/front raise|shoulder press|overhead press|arnold|military press/.test(name)) return 'Front Delts';

  // Back details
  if (/pulldown|pull.?up|chin.?up|pullover/.test(name)) return 'Lats';
  if (/shrug/.test(name)) return 'Traps';

  // Triceps (must precede chest "press" and biceps "curl")
  if (/tricep|pushdown|skull ?crusher|close.?grip bench/.test(name)) return 'Triceps';

  // Biceps
  if (/bicep|hammer|preacher|concentration curl|barbell curl|dumbbell curl|cable curl|incline (db|dumbbell) curl|single arm curl/.test(name)) return 'Biceps';
  // Generic "curl" if it didn't match anything else above (no leg/hamstring/wrist curls remain)
  if (/\bcurl\b/.test(name) && !/wrist curl/.test(name)) return 'Biceps';

  // Back rows
  if (/\brow\b/.test(name)) return 'Mid Back';

  // Chest
  if (/bench press|chest press|chest fly|cable crossover|crossover|pec deck|butterfly|push.?up|dip \(chest\)|incline (db|dumbbell|barbell) press|decline (db|dumbbell|barbell) press/.test(name)) return 'Chest';

  // Core / abs
  if (/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|russian twist|hanging|woodchop|rotation/.test(name)) return 'Abs';

  // Cardio (added: spin, cycling, rowing-machine, jog)
  if (/bike|treadmill|run|cardio|step.?mill|elliptical|stair|jog|cycling|spinning|spin|rowing machine|row machine/.test(name)) return 'Cardio';

  // Forearms
  if (/wrist curl|forearm|farmer/.test(name)) return 'Forearms';

  // Glute isolation that didn't match earlier (e.g. "Rear Kick")
  if (/rear kick/.test(name)) return 'Glutes';

  // Generic "dip" → triceps (chest-dip variant matched in chest regex above)
  if (/\bdip\b/.test(name)) return 'Triceps';

  // Fallback to broad category
  return exercise.category || 'Other';
}

/**
 * Only seeds the built-in exercise library on a TRULY EMPTY database
 * (e.g. a brand-new install with no restore yet). Once the user has
 * any exercises — imported, custom, or seeded earlier — we leave their
 * library alone so deletions stick.
 */
export async function seedIfNeeded() {
  const existing = await getAll('exercises');
  if (existing.length > 0) return 0;

  const now = Date.now();
  const toInsert = SEEDS.map(([name, category, equipment]) => ({
    id: uuid(),
    name,
    category,
    equipment,
    notes: '',
    isCustom: false,
    createdAt: now,
  }));

  await putMany('exercises', toInsert);
  return toInsert.length;
}
