// Checks a backup before a restore touches anything. A bad file has to fail
// here, while the current data is still in place, and imported ids end up in
// the app's HTML, so they're held to characters that can't break out of it.

export const BACKUP_VERSION = 4;

const SAFE_ID = /^[\w-]+$/;

const isNumberOrUnset = (v) => v == null || Number.isFinite(v);
const isStringOrUnset = (v) => v == null || typeof v === 'string';

function damaged(what) {
  throw new Error(`This backup is damaged: ${what}.`);
}

function checkIds(rows, label) {
  const ids = new Set();
  rows.forEach((row, i) => {
    if (!row || typeof row !== 'object') damaged(`${label} ${i + 1} is unreadable`);
    if (typeof row.id !== 'string' || !SAFE_ID.test(row.id)) damaged(`${label} ${i + 1} has a bad id`);
    if (ids.has(row.id)) damaged(`${label} ${i + 1} is a duplicate`);
    ids.add(row.id);
  });
  return ids;
}

/** Throws a plain-English error for anything a restore couldn't safely load. */
export function validateSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.exercises) || !Array.isArray(snapshot.workouts) || !Array.isArray(snapshot.sets)) {
    throw new Error('File doesn\'t look like a Lift backup.');
  }
  if (snapshot.version > BACKUP_VERSION) {
    throw new Error('This backup came from a newer version of Lift. Update the app first.');
  }

  const exerciseIds = checkIds(snapshot.exercises, 'exercise');
  const workoutIds = checkIds(snapshot.workouts, 'workout');
  checkIds(snapshot.sets, 'set');

  snapshot.exercises.forEach((e, i) => {
    if (typeof e.name !== 'string' || !e.name.trim()) damaged(`exercise ${i + 1} has no name`);
    if (!isStringOrUnset(e.category) || !isStringOrUnset(e.equipment)) damaged(`exercise ${i + 1} has a bad muscle or equipment`);
  });
  snapshot.workouts.forEach((w, i) => {
    if (!Number.isFinite(w.startedAt)) damaged(`workout ${i + 1} has no start time`);
    if (!isNumberOrUnset(w.endedAt)) damaged(`workout ${i + 1} has a bad end time`);
    if (!isStringOrUnset(w.name)) damaged(`workout ${i + 1} has a bad name`);
  });
  snapshot.sets.forEach((s, i) => {
    if (!workoutIds.has(s.workoutId)) damaged(`set ${i + 1} belongs to a missing workout`);
    if (!exerciseIds.has(s.exerciseId)) damaged(`set ${i + 1} belongs to a missing exercise`);
    if (!isNumberOrUnset(s.weight) || !isNumberOrUnset(s.reps) || !isNumberOrUnset(s.order)) damaged(`set ${i + 1} has bad numbers`);
    if (!isStringOrUnset(s.setType)) damaged(`set ${i + 1} has a bad set type`);
  });
}
