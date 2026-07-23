// Apple Health import + analysis (READ-ONLY). A PWA can't touch HealthKit, so
// this is the receiving end of the bridge: an export tool / Shortcut on the
// phone reads Health and writes a JSON file in the format below; Lift imports
// it into its own stores and does the correlations Apple's Health app won't.
// Lift never writes back to Health — you keep logging there.
//
// IMPORT FILE FORMAT (all fields mirror HealthKit so a Shortcut can map them):
// {
//   "lift": "health-import", "v": 1,
//   "stateOfMind": [{
//     "id": "<stable source id>",
//     "kind": "momentaryEmotion" | "dailyMood",
//     "date": <epoch ms or ISO string>,      // sample start
//     "valence": -1.0 .. 1.0,                 // pleasant↔unpleasant
//     "labels": ["happy","calm"],             // emotion labels (optional)
//     "associations": ["work","health"]       // contexts (optional)
//   }],
//   "medications": [{
//     "id": "<HKUserAnnotatedMedication id>",
//     "nickname": "<optional>",
//     "isArchived": false, "hasSchedule": true,
//     "concept": { "identifier": "...", "displayText": "Sertraline",
//                  "form": "tablet", "rxnorm": ["36437"] }
//   }],
//   "doseEvents": [{
//     "id": "<HKMedicationDoseEvent id>",
//     "medicationId": "<links to a medications[].id>",
//     "status": "taken" | "skipped" | "snoozed" | "notInteracted",
//     "date": <epoch ms>,                     // scheduled or log date
//     "scheduledQuantity": 1, "doseQuantity": 1
//   }]
// }

import { getAll, putMany } from './db.js';

const toMs = (d) => (typeof d === 'number' ? d : Date.parse(d));

/** Parse + import a health JSON file. Upserts by id (re-importing updates edited
 * rows). Returns per-store counts. Throws on a file that isn't our format. */
export async function importHealthFile(file) {
  const payload = JSON.parse(await file.text());
  if (!payload || payload.lift !== 'health-import') {
    throw new Error('Not a Lift health-import file.');
  }

  const som = normalizeStateOfMind(payload.stateOfMind);
  const meds = normalizeMedications(payload.medications);
  const doses = normalizeDoses(payload.doseEvents);

  if (som.length) await putMany('stateOfMind', som);
  if (meds.length) await putMany('medications', meds);
  if (doses.length) await putMany('doseEvents', doses);

  return { stateOfMind: som.length, medications: meds.length, doseEvents: doses.length };
}

function normalizeStateOfMind(rows) {
  return (rows ?? []).filter((r) => r && r.id != null).map((r) => ({
    id: String(r.id),
    kind: r.kind === 'dailyMood' ? 'dailyMood' : 'momentaryEmotion',
    date: toMs(r.date) || 0,
    valence: clampValence(r.valence),
    labels: Array.isArray(r.labels) ? r.labels : [],
    associations: Array.isArray(r.associations) ? r.associations : [],
  }));
}

function normalizeMedications(rows) {
  return (rows ?? []).filter((r) => r && r.id != null).map((r) => ({
    id: String(r.id),
    nickname: r.nickname ?? '',
    isArchived: !!r.isArchived,
    hasSchedule: !!r.hasSchedule,
    concept: {
      identifier: r.concept?.identifier ?? '',
      displayText: r.concept?.displayText ?? r.nickname ?? 'Medication',
      form: r.concept?.form ?? '',
      rxnorm: Array.isArray(r.concept?.rxnorm) ? r.concept.rxnorm : [],
    },
  }));
}

const DOSE_STATUSES = new Set(['taken', 'skipped', 'snoozed', 'notInteracted']);
function normalizeDoses(rows) {
  return (rows ?? []).filter((r) => r && r.id != null).map((r) => ({
    id: String(r.id),
    medicationId: r.medicationId != null ? String(r.medicationId) : '',
    status: DOSE_STATUSES.has(r.status) ? r.status : 'notInteracted',
    date: toMs(r.date) || 0,
    scheduledQuantity: Number(r.scheduledQuantity) || 0,
    doseQuantity: Number(r.doseQuantity) || 0,
  }));
}

function clampValence(v) {
  const n = Number(v);
  if (!isFinite(n)) return 0;
  return Math.max(-1, Math.min(1, n));
}

// ---------- Loading + analysis for the UI ----------

export async function loadHealth() {
  const [stateOfMind, medications, doseEvents] = await Promise.all([
    getAll('stateOfMind'), getAll('medications'), getAll('doseEvents'),
  ]);
  stateOfMind.sort((a, b) => a.date - b.date);
  doseEvents.sort((a, b) => a.date - b.date);
  return { stateOfMind, medications, doseEvents };
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

/** Dose adherence per medication: taken / (taken + skipped). Snoozed and
 * never-interacted reminders are excluded (they're not decisions). */
export function adherenceByMedication(medications, doseEvents) {
  const byMed = new Map();
  for (const d of doseEvents) {
    if (d.status !== 'taken' && d.status !== 'skipped') continue;
    const cur = byMed.get(d.medicationId) ?? { taken: 0, total: 0 };
    cur.total += 1;
    if (d.status === 'taken') cur.taken += 1;
    byMed.set(d.medicationId, cur);
  }
  return medications.map((m) => {
    const s = byMed.get(m.id) ?? { taken: 0, total: 0 };
    return { medication: m, taken: s.taken, total: s.total, pct: s.total ? s.taken / s.total : null };
  });
}
