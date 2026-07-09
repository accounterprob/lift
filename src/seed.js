import { getAll, putMany } from './db.js';
import { uuid, esc } from './utils.js';

/**
 * Stable color palette per muscle group. Chosen so that any single workout's
 * 4-5 muscle groups land on maximally distinct HUES (not just shades), which
 * matters for colorblind viewing. Muscles trained on the same day get
 * different hues; muscles on different days can repeat colors.
 *
 * Palette: Blue / Orange / Purple / Yellow / Pink / Brown / Green / Cyan / Red / Gray
 */
const MUSCLE_COLORS = {
  // Leg Day: Quadriceps, Hamstrings, Glutes, Calves, Adductors, Abductors
  'Quadriceps':         '#3b82f6', // blue
  'Hamstrings':         '#f97316', // orange
  'Glutes':             '#a855f7', // purple
  'Calves':             '#eab308', // yellow
  'Adductors':          '#ec4899', // pink
  'Abductors':          '#06b6d4', // cyan

  // Chest Day: Pectorals, Triceps, Anterior Deltoid, Lateral Deltoid
  'Pectorals':          '#3b82f6', // blue
  'Triceps':            '#f97316', // orange
  'Anterior Deltoid':   '#a855f7', // purple
  'Lateral Deltoid':    '#eab308', // yellow

  // Back Day: Lats, Upper Back, Biceps, Posterior Deltoid, Traps
  'Lats':               '#3b82f6', // blue
  'Upper Back':         '#f97316', // orange
  'Biceps':             '#ec4899', // pink (keeps Back Day hues distinct)
  'Posterior Deltoid':  '#a855f7', // purple
  'Traps':              '#eab308', // yellow

  // Misc / cross-day
  'Lower Back':         '#92400e', // brown
  'Forearms':           '#22c55e', // green
  'Abs':                '#ef4444', // red
  'Obliques':           '#14b8a6', // teal
  'Other':              '#6b7280', // gray
};

export function colorForMuscle(muscle) {
  return MUSCLE_COLORS[muscle] ?? '#6b7280';
}

/**
 * Canonical display order for the specific muscle groups — push, pull, legs,
 * core. Used to order filter chips and the muscle dropdown uniformly app-wide.
 */
export const MUSCLES = [
  'Pectorals', 'Anterior Deltoid', 'Lateral Deltoid', 'Posterior Deltoid',
  'Triceps', 'Biceps', 'Forearms',
  'Lats', 'Upper Back', 'Lower Back', 'Traps',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Adductors', 'Abductors', 'Calves',
  'Abs', 'Obliques',
];

/** Sort muscle names by the canonical MUSCLES order; unknown names go last. */
export function sortMuscles(names) {
  const rank = new Map(MUSCLES.map((m, i) => [m, i]));
  return [...names].sort(
    (a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999) || a.localeCompare(b)
  );
}

export const EQUIPMENT = [
  'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Other',
];

/**
 * Exercise name with its equipment appended — "Preacher Curl (Barbell)" —
 * derived from the equipment field rather than duplicated in the name, so
 * editing the equipment updates it everywhere. Used wherever the name stands
 * alone (section headers, titles, toasts); list rows that already show the
 * equipment in a subtitle use the bare name.
 */
export function displayName(exercise) {
  const eq = exercise?.equipment;
  const name = exercise?.name ?? '';
  return eq && eq !== 'Other' ? `${name} (${eq})` : name;
}

/**
 * Canonical exercise row body used everywhere an exercise is listed — active
 * workout headers, the Add Exercises picker, the Exercises tab, Most-Trained:
 * name on top, "Equipment · Muscle" on one line below. Pair with
 * `setCountLabel(count)` in the row's trailing slot.
 */
export function exerciseRowMain(exercise) {
  const meta = exercise
    ? [exercise.equipment, primaryMuscleFor(exercise)].filter(Boolean).join(' · ')
    : '';
  return `
    <div class="row-main">
      <div class="row-title">${esc(exercise?.name ?? 'Unknown exercise')}</div>
      ${meta ? `<div class="row-subtitle">${esc(meta)}</div>` : ''}
    </div>
  `;
}

/** "12 sets" badge for the trailing slot of an exercise row; '' when zero. */
export function setCountLabel(count) {
  if (!count) return '';
  return `<div class="exercise-count">${count} ${count === 1 ? 'set' : 'sets'}</div>`;
}

/**
 * Muscle filter chip row ("All" + every muscle present in the library, in
 * canonical order) — shared by the Exercises tab and the Add Exercises picker.
 * Each chip carries data-cat; the caller wires the clicks.
 */
export function muscleChipsHtml(exercises, active) {
  const muscles = sortMuscles(new Set(exercises.map((e) => primaryMuscleFor(e))));
  return ['All', ...muscles]
    .map((c) => {
      const isActive = (c === 'All' && !active) || c === active;
      return `<button class="chip${isActive ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`;
    })
    .join('');
}

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
 * the broad category to formal-but-common muscle names. e.g. "Lateral Raise" →
 * "Lateral Deltoid", "Romanian Deadlift" → "Hamstrings", "Leg Extension" →
 * "Quadriceps", "Bench Press" → "Pectorals", rows → "Upper Back". Order of
 * checks matters: more specific patterns must come before generic ones (e.g.
 * "Romanian Deadlift" before generic "deadlift", "leg curl" before "curl",
 * "upright row" before generic "row").
 */
export function primaryMuscleFor(exercise) {
  // An explicitly chosen muscle (set when creating/editing an exercise) always
  // wins over name-pattern classification, so user corrections stick app-wide.
  if (exercise?.muscle) return exercise.muscle;
  const name = (exercise?.name || '').toLowerCase();
  if (!name) return exercise?.category || 'Other';

  // Hamstring-specific (must precede generic "deadlift" and "curl")
  if (/romanian deadlift|\brdl\b|stiff.?leg|good morning|nordic|hamstring/.test(name)) return 'Hamstrings';
  if (/leg curl/.test(name)) return 'Hamstrings';

  // Quadriceps isolation
  if (/leg extension|sissy squat/.test(name)) return 'Quadriceps';

  // Calves
  if (/calf|tib raise|tibialis/.test(name)) return 'Calves';

  // Hip-focused (abduction before adduction-adjacent glute work)
  if (/hip adduction|adductor|inner thigh|copenhagen/.test(name)) return 'Adductors';
  if (/hip abduction|abductor|outer thigh|clamshell/.test(name)) return 'Abductors';
  if (/hip thrust|glute|cable kickback|donkey kick|rear kick|frog pump/.test(name)) return 'Glutes';

  // Compound leg → quadriceps primary
  if (/squat|leg press|lunge|step.?up/.test(name)) return 'Quadriceps';

  // Lower back / posterior chain
  if (/back extension|hyperextension|superman/.test(name)) return 'Lower Back';
  if (/deadlift|rack pull/.test(name)) return 'Lower Back';

  // Deltoid subdivisions (before generic "press", "raise", "fly", and "row")
  if (/lateral raise|side raise|side delt|\blat raise\b|upright row/.test(name)) return 'Lateral Deltoid';
  if (/rear delt|reverse fly|reverse flye|face pull|reverse pec deck/.test(name)) return 'Posterior Deltoid';
  if (/front raise|shoulder press|overhead press|arnold|military press|landmine press|push press|viking press/.test(name)) return 'Anterior Deltoid';

  // Back details
  if (/pulldown|pull.?down|pull.?up|chin.?up|pullover|straight.?arm/.test(name)) return 'Lats';
  if (/shrug/.test(name)) return 'Traps';

  // Triceps (must precede chest "press"/"bench" and biceps "curl")
  if (/tricep|pushdown|skull ?crusher|close.?grip bench|jm press|french press|bench dip/.test(name)) return 'Triceps';

  // Forearms (before the generic "curl" → biceps catch-all)
  if (/wrist curl|reverse curl|forearm|farmer|gripper|dead hang/.test(name)) return 'Forearms';

  // Biceps — any curl still unmatched (leg/nordic/wrist/reverse handled above)
  if (/bicep|\bcurl\b/.test(name)) return 'Biceps';

  // Rows and other horizontal pulls → upper back (rhomboids / mid-traps)
  if (/\brow\b|rear pull|high pull/.test(name)) return 'Upper Back';

  // Pectorals ("reverse fly" and "bench dip" already routed above)
  if (/bench|chest|\bpec\b|pec deck|crossover|butterfly|push.?up|floor press|squeeze press|\bfly\b|\bflye\b/.test(name)) return 'Pectorals';

  // Obliques before generic core so "side plank" / twists land here
  if (/russian twist|woodchop|wood chop|side plank|side bend|oblique|pallof|rotation/.test(name)) return 'Obliques';

  // Abs
  if (/crunch|sit.?up|plank|leg raise|knee raise|ab wheel|ab roll|hanging|toes.?to.?bar|v.?up|dead bug|mountain climber/.test(name)) return 'Abs';

  // Generic "dip" → triceps (chest-dip variants matched in pectorals regex)
  if (/\bdip\b/.test(name)) return 'Triceps';

  // Fallback to broad category
  return exercise.category || 'Other';
}

// Clear-cut cardio movements that may have been filed under the retired
// "Other" or "Cardio" categories. Matched against an exercise name to flag it
// for removal. Deliberately conservative — borderline conditioning work (sled,
// battle ropes, kettlebell swings, etc.) is kept and re-homed, not deleted, and
// "walk" is excluded so it can't catch "Walking Lunge" / "Farmer's Walk".
const CARDIO_RE = /\b(bike|biking|treadmill|run|running|cardio|step.?mill|elliptical|stair.?master|stair.?climber|jog|jogging|cycling|spinning|spin class|rowing machine|row machine|\berg\b|sprints?|jump.?rope|skipping rope|swim|swimming|hike|hiking)\b/;

// Maps the fine-grained muscle from `primaryMuscleFor` up to a broad category.
const MUSCLE_TO_CATEGORY = {
  Quadriceps: 'Legs', Hamstrings: 'Legs', Adductors: 'Legs', Abductors: 'Legs',
  Glutes: 'Glutes', Calves: 'Calves',
  Pectorals: 'Chest',
  'Anterior Deltoid': 'Shoulders', 'Lateral Deltoid': 'Shoulders', 'Posterior Deltoid': 'Shoulders',
  Lats: 'Back', 'Upper Back': 'Back', Traps: 'Back', 'Lower Back': 'Back',
  Biceps: 'Biceps', Triceps: 'Triceps', Forearms: 'Forearms',
  Abs: 'Core', Obliques: 'Core',
};

/**
 * Best-fit category for an exercise name, used to re-home movements out of the
 * retired "Other" category. Returns 'Cardio' to signal the movement is cardio
 * and should be removed; otherwise a broad category, falling back
 * to 'Full Body' when the name matches no known pattern.
 */
export function categoryFor(name) {
  const n = (name || '').toLowerCase().trim();
  if (!n) return 'Full Body';
  if (CARDIO_RE.test(n)) return 'Cardio';
  // Pass a blank category so the muscle lookup can't echo back "Other".
  const muscle = primaryMuscleFor({ name: n, category: '' });
  return MUSCLE_TO_CATEGORY[muscle] || 'Full Body';
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
