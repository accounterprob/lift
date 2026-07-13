// The PPL day cycle and everything colored by it. Each rotation day owns a
// color family: the Progress volume chart draws one line per day, the whole
// app accent re-themes to whichever day is "today" (see refreshDayTheme), and
// every muscle group trained on a day wears a shade of that day's color in
// the active-workout volume bars.

import { getFinishedWorkouts, getActiveWorkout } from './db.js';
import { primaryMuscleFor } from './seed.js';

// PPL rotation: Chest → Legs → Back/Bi → Chest → ...
export const ROTATION = ['Chest Day', 'Leg Day', 'Back/Bi Day'];

/**
 * Per-day identity: `key` is stamped on <html data-day> and selects the
 * accent theme in styles.css; `short` labels the volume-chart legend;
 * `cssVar` is the day's line/legend color (light/dark values in styles.css).
 * Day hues — Chest pink, Legs gold, Back/Bi blue — were validated to stay
 * distinct under red-green colorblindness in both modes, and deliberately
 * avoid the app's reserved red (destructive) and orange (warmup).
 */
export const DAYS = {
  'Chest Day':   { key: 'chest', short: 'Chest',   cssVar: '--day-chest' },
  'Leg Day':     { key: 'leg',   short: 'Legs',    cssVar: '--day-leg' },
  'Back/Bi Day': { key: 'back',  short: 'Back/Bi', cssVar: '--day-back' },
};

/** CSS color for a rotation day (falls back to gray for non-rotation days). */
export function dayColor(dayName) {
  const meta = DAYS[dayName];
  return meta ? `var(${meta.cssVar})` : 'var(--text-tertiary)';
}

/**
 * Maps any workout name (current or historical) to its rotation slot, or
 * null if it doesn't fit the cycle (e.g. custom names).
 */
export function normalizeDayName(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (lower.includes('chest')) return 'Chest Day';
  if (lower.includes('leg') && !lower.includes('curl') && !lower.includes('extension')) return 'Leg Day';
  if (lower.includes('back')) return 'Back/Bi Day';  // matches "Back Day" + "Back/Bi Day"
  if (lower.includes('pull')) return 'Back/Bi Day';  // legacy "Pull Day"
  if (lower.includes('push')) return 'Chest Day';    // legacy "Push Day"
  return null;
}

export function lastRotationWorkout(finishedWorkouts) {
  for (const w of finishedWorkouts) {
    const norm = normalizeDayName(w.name);
    if (norm) return { name: w.name, normalized: norm, startedAt: w.startedAt };
  }
  return null;
}

export function nextInRotation(currentNormalized) {
  const idx = ROTATION.indexOf(currentNormalized);
  if (idx === -1) return ROTATION[0];
  return ROTATION[(idx + 1) % ROTATION.length];
}

/**
 * Muscle colors follow the day the muscle is trained on: every Chest Day
 * muscle is a pink, every Leg Day muscle a gold, every Back/Bi Day muscle a
 * blue — so the volume bars in an active workout read as one family per day.
 * Shades within a family are spread hard across lightness (pale → dark) so
 * side-by-side bars stay tellable-apart; the in-bar name labels carry the
 * rest. Core and forearms train on any day, so they sit outside the families.
 */
const MUSCLE_COLORS = {
  // Chest Day — pinks
  'Pectorals':          '#ec4899', // pink
  'Triceps':            '#be185d', // deep rose
  'Anterior Deltoid':   '#831843', // dark berry
  'Lateral Deltoid':    '#f9a8d4', // light pink

  // Leg Day — golds
  'Quadriceps':         '#facc15', // gold
  'Hamstrings':         '#b45309', // bronze
  'Glutes':             '#f59e0b', // amber
  'Calves':             '#fde68a', // pale butter
  'Adductors':          '#bdb76b', // khaki
  'Abductors':          '#78350f', // dark chocolate-gold

  // Back/Bi Day — blues
  'Lats':               '#2563eb', // royal blue
  'Upper Back':         '#38bdf8', // sky
  'Biceps':             '#1e40af', // deep indigo
  'Posterior Deltoid':  '#bfdbfe', // pale ice blue
  'Traps':              '#0891b2', // steel cyan
  'Lower Back':         '#475569', // slate

  // Cross-day / core — deliberately outside the three families
  'Forearms':           '#22c55e', // green
  'Abs':                '#ef4444', // red
  'Obliques':           '#14b8a6', // teal
  'Other':              '#6b7280', // gray
};

export function colorForMuscle(muscle) {
  return MUSCLE_COLORS[muscle] ?? '#6b7280';
}

/**
 * Which rotation day a muscle belongs to — mirrors the color families above.
 * Core is null: it trains on any day and shouldn't sway classification.
 */
const MUSCLE_DAY = {
  'Pectorals': 'Chest Day', 'Triceps': 'Chest Day',
  'Anterior Deltoid': 'Chest Day', 'Lateral Deltoid': 'Chest Day',

  'Quadriceps': 'Leg Day', 'Hamstrings': 'Leg Day', 'Glutes': 'Leg Day',
  'Calves': 'Leg Day', 'Adductors': 'Leg Day', 'Abductors': 'Leg Day',

  'Lats': 'Back/Bi Day', 'Upper Back': 'Back/Bi Day', 'Biceps': 'Back/Bi Day',
  'Posterior Deltoid': 'Back/Bi Day', 'Traps': 'Back/Bi Day',
  'Lower Back': 'Back/Bi Day', 'Forearms': 'Back/Bi Day',
};

export function dayForMuscle(muscle) {
  return MUSCLE_DAY[muscle] ?? null;
}

/**
 * Rotation day for one workout from its own data. A name that fits the
 * cycle always wins; otherwise the workout is classified by content — its
 * volume is summed per day family (via each exercise's muscle) and the day
 * with the most volume takes it. So an imported "Midday Workout" full of
 * squats lands on Legs. Returns null only when the sets train none of the
 * three families (e.g. a core-only session); classifyWorkoutDays turns even
 * that into a day from rotation context.
 */
function classifyWorkoutDay(name, sets, exMap) {
  const named = normalizeDayName(name);
  if (named) return named;
  const volByDay = new Map();
  for (const s of sets) {
    const ex = exMap.get(s.exerciseId);
    if (!ex) continue;
    const day = dayForMuscle(primaryMuscleFor(ex));
    if (!day) continue;
    const vol = (s.weight || 0) * (s.reps || 0);
    if (vol <= 0) continue;
    volByDay.set(day, (volByDay.get(day) ?? 0) + vol);
  }
  let best = null;
  let bestVol = 0;
  for (const [day, vol] of volByDay) {
    if (vol > bestVol) { best = day; bestVol = vol; }
  }
  return best;
}

/**
 * Assigns EVERY workout a rotation day — the training is a strict 3-day
 * cycle, so nothing is allowed to fall outside it. Name and content decide
 * first (classifyWorkoutDay); a workout with no signal of its own (e.g.
 * core-only) takes its day from rotation context: the previous workout's
 * day when logged on the same calendar day (it's part of that session),
 * otherwise the next day in the cycle after the previous workout, and the
 * first workout ever defaults to the start of the rotation. Used for the
 * Progress chart grouping; the live rotation/theme stays name-based.
 *
 * @param {Array} workouts  finished workouts, any order
 * @param {Map} setsByWorkout  workoutId → performed sets
 * @param {Map} exMap  exerciseId → exercise
 * @returns {Map} workoutId → rotation day name
 */
export function classifyWorkoutDays(workouts, setsByWorkout, exMap) {
  const chrono = [...workouts].sort((a, b) => a.startedAt - b.startedAt);
  const dayById = new Map();
  let prev = null;  // { day, startedAt } of the previous (older) workout
  for (const w of chrono) {
    let day = classifyWorkoutDay(w.name, setsByWorkout.get(w.id) ?? [], exMap);
    if (!day) {
      if (!prev) day = ROTATION[0];
      else if (isSameCalendarDay(prev.startedAt, w.startedAt)) day = prev.day;
      else day = nextInRotation(prev.day);
    }
    dayById.set(w.id, day);
    prev = { day, startedAt: w.startedAt };
  }
  return dayById;
}

/**
 * Black-or-white label color for text sitting ON a muscle-color fill — the
 * pale family shades (butter, ice blue, light pink) need dark text where the
 * old all-midtone palette could hardcode white.
 */
export function textOnColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const yiq = (((n >> 16) & 255) * 299 + (((n >> 8) & 255) * 587) + ((n & 255) * 114)) / 1000;
  return yiq >= 150 ? '#1c1c1e' : '#ffffff';
}

function isSameCalendarDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

/**
 * The rotation day the app considers "today":
 *  1. an active workout that fits the rotation wins (you're doing that day);
 *  2. else, if the last rotation workout finished today, today IS that day;
 *  3. else it's the next day in the cycle after the last one;
 *  4. brand-new install → first day of the rotation.
 * Mirrors the "Today: X" hint on the workout start screen.
 */
export function currentDayName(finishedWorkouts, activeWorkout) {
  const activeDay = normalizeDayName(activeWorkout?.name);
  if (activeDay) return activeDay;
  const last = lastRotationWorkout(finishedWorkouts);
  if (!last) return ROTATION[0];
  return isSameCalendarDay(last.startedAt, Date.now())
    ? last.normalized
    : nextInRotation(last.normalized);
}

/**
 * Recomputes today's day and re-themes the app to its color by stamping
 * <html data-day="...">; styles.css maps each day key to its accent set.
 * Called on launch, whenever workout data changes, and when the app returns
 * to the foreground (so the theme rolls over past midnight).
 */
export async function refreshDayTheme() {
  try {
    const [finished, active] = await Promise.all([getFinishedWorkouts(), getActiveWorkout()]);
    const day = currentDayName(finished, active);
    document.documentElement.dataset.day = DAYS[day].key;
    return day;
  } catch {
    return null;  // storage not ready — keep whatever theme is showing
  }
}
