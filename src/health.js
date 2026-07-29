// Mental-health data logged directly in Lift: State of Mind (moods) and a
// reference list of medications, stored in Lift's own IndexedDB stores. The
// data model mirrors Apple's HealthKit fields (valence, emotion labels) so it
// reads naturally, but Lift owns it — nothing syncs to or from Health.
//
// Medications are a standing list, not a log: the same doses are taken daily,
// so there is nothing to record per-day and no dose history to keep.

import { getAll, get, put, del } from './db.js';
import { uuid } from './utils.js';

// Vocabularies for entry, mirroring Apple's State of Mind pickers.
export const EMOTION_LABELS = [
  'Amazed', 'Excited', 'Happy', 'Joyful', 'Content', 'Calm', 'Relieved', 'Grateful', 'Hopeful',
  'Confident', 'Proud', 'Surprised', 'Indifferent', 'Anxious', 'Stressed', 'Overwhelmed',
  'Frustrated', 'Angry', 'Irritated', 'Sad', 'Lonely', 'Discouraged', 'Drained', 'Worried', 'Embarrassed',
];
export const ASSOCIATION_LABELS = [
  'Health', 'Fitness', 'Self-Care', 'Hobbies', 'Identity', 'Community',
  'Family', 'Friends', 'Partner', 'Work', 'Education', 'Money', 'Weather', 'Tasks',
];
function clampValence(v) {
  const n = Number(v);
  if (!isFinite(n)) return 0;
  return Math.max(-1, Math.min(1, n));
}

// ---------- Manual entry (write) ----------

export async function saveStateOfMind({ id, kind, valence, labels, associations, date }) {
  const entry = {
    id: id || uuid(),
    kind: kind === 'dailyMood' ? 'dailyMood' : 'momentaryEmotion',
    date: date || Date.now(),
    valence: clampValence(valence),
    labels: labels || [],
    associations: associations || [],
  };
  await put('stateOfMind', entry);
  return entry;
}

export async function saveMedication({ id, nickname, form, hasSchedule, doseAmount, doseUnit }) {
  const name = (nickname || '').trim() || 'Medication';
  // On edit, preserve fields the form doesn't touch (identifier, rxnorm, the
  // formal displayText) by merging over the stored record.
  const prev = id ? await get('medications', id) : null;
  const amt = Number(doseAmount);
  const med = {
    id: id || uuid(),
    nickname: name,
    isArchived: prev ? !!prev.isArchived : false,
    hasSchedule: !!hasSchedule,
    doseAmount: amt > 0 ? amt : 1,
    doseUnit: (doseUnit || '').trim(),
    concept: {
      identifier: prev?.concept?.identifier || '',
      displayText: prev?.concept?.displayText || name,
      form: (form || '').trim(),
      rxnorm: prev?.concept?.rxnorm || [],
    },
  };
  await put('medications', med);
  return med;
}

/** Delete a manually-entered health record by id. */
export async function deleteHealthRecord(store, id) {
  await del(store, id);
}

// ---------- Loading + analysis for the UI ----------

export async function loadHealth() {
  const [stateOfMind, medications] = await Promise.all([
    getAll('stateOfMind'), getAll('medications'),
  ]);
  stateOfMind.sort((a, b) => a.date - b.date);
  medications.sort((a, b) => (a.nickname || '').localeCompare(b.nickname || ''));
  return { stateOfMind, medications };
}

const dayKey = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);

/**
 * First-pass correlation toward the stated goal: average State-of-Mind valence
 * on days with a workout vs. days without. `workouts` is the finished-workout
 * list; moods are State-of-Mind entries. Returns {onWorkout, offWorkout, delta}
 * with valences in -1..1 (null when a side has no mood data).
 */
export function moodVsWorkouts(stateOfMind, workouts) {
  const workoutDays = new Set(workouts.map((w) => dayKey(w.startedAt)));
  const on = [];
  const off = [];
  for (const m of stateOfMind) {
    (workoutDays.has(dayKey(m.date)) ? on : off).push(m.valence);
  }
  const onWorkout = avg(on);
  const offWorkout = avg(off);
  return {
    onWorkout, offWorkout,
    delta: onWorkout != null && offWorkout != null ? onWorkout - offWorkout : null,
    onCount: on.length, offCount: off.length,
  };
}

