import fs from 'node:fs';

const path = process.argv[2];
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const exercises = data.exercises ?? [];
const workouts = data.workouts ?? [];
const sets = data.sets ?? [];
const duplicates = (rows) => [...Map.groupBy(rows, (r) => r.id)]
  .filter(([, values]) => values.length > 1)
  .map(([id, values]) => ({ id, count: values.length }));
const workoutIDs = new Set(workouts.map((w) => w.id));
const exerciseIDs = new Set(exercises.map((e) => e.id));
const setsByWorkout = Map.groupBy(sets, (s) => s.workoutId);
const exerciseByID = new Map(exercises.map((e) => [e.id, e]));
const knownCategories = new Set([
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Legs', 'Glutes', 'Calves', 'Core', 'Cardio', 'Full Body', 'Other',
]);

const validTime = [];
const invalidTime = [];
for (const w of workouts) {
  const start = Number(w.startedAt);
  const end = Number(w.endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) invalidTime.push(w.id);
  else validTime.push(w);
}

const exactIntervals = [...Map.groupBy(validTime, (w) => `${w.startedAt}:${w.endedAt}`)]
  .filter(([, values]) => values.length > 1)
  .map(([, values]) => values.map((w) => w.id));
const sorted = [...validTime].sort((a, b) => a.startedAt - b.startedAt);
const overlaps = [];
for (let i = 0; i < sorted.length; i += 1) {
  for (let j = i + 1; j < sorted.length && sorted[j].startedAt < sorted[i].endedAt; j += 1) {
    const overlap = Math.min(sorted[i].endedAt, sorted[j].endedAt) - sorted[j].startedAt;
    const shorter = Math.min(sorted[i].endedAt - sorted[i].startedAt, sorted[j].endedAt - sorted[j].startedAt);
    if (overlap / shorter >= 0.5) overlaps.push({ first: sorted[i].id, second: sorted[j].id, overlapRatio: overlap / shorter });
  }
}

const noSets = [];
const noCompleted = [];
const incompleteByWorkout = [];
const cardioNamedResistance = [];
for (const w of workouts) {
  const ws = setsByWorkout.get(w.id) ?? [];
  const complete = ws.filter((s) => s.completed);
  const incomplete = ws.filter((s) => !s.completed);
  if (!ws.length) noSets.push(w.id);
  if (!complete.length) noCompleted.push(w.id);
  if (incomplete.length) incompleteByWorkout.push({ id: w.id, name: w.name, incomplete: incomplete.length });
  if (/cardio/i.test(w.name ?? '')) {
    const categories = [...new Set(ws.map((s) => exerciseByID.get(s.exerciseId)?.category).filter(Boolean))];
    if (categories.length && categories.some((c) => c !== 'Cardio')) {
      cardioNamedResistance.push({ id: w.id, startedAt: w.startedAt, categories });
    }
  }
}

const suspectedDuplicateExercises = [...Map.groupBy(exercises, (e) => String(e.name ?? '').trim().toLocaleLowerCase())]
  .filter(([, values]) => values.length > 1)
  .map(([name, values]) => ({ name, ids: values.map((e) => e.id) }));

const durationMinutes = validTime.map((w) => (w.endedAt - w.startedAt) / 60000);
const summary = {
  source: path,
  version: data.version,
  exportedAt: data.exportedAt,
  counts: { exercises: exercises.length, workouts: workouts.length, sets: sets.length },
  duplicateIDs: { exercises: duplicates(exercises), workouts: duplicates(workouts), sets: duplicates(sets) },
  orphanedSets: {
    missingWorkout: sets.filter((s) => !workoutIDs.has(s.workoutId)).map((s) => s.id),
    missingExercise: sets.filter((s) => !exerciseIDs.has(s.exerciseId)).map((s) => s.id),
  },
  timing: {
    valid: validTime.length,
    invalid: invalidTime,
    exactDuplicateIntervals: exactIntervals,
    heavilyOverlapping: overlaps,
    minMinutes: Math.min(...durationMinutes),
    maxMinutes: Math.max(...durationMinutes),
    overSixHours: validTime.filter((w) => w.endedAt - w.startedAt > 6 * 3600000).map((w) => w.id),
  },
  content: {
    workoutsWithNoSets: noSets,
    workoutsWithNoCompletedSets: noCompleted,
    incompleteByWorkout,
    cardioNamedResistance,
    unknownExerciseCategories: exercises.filter((e) => !knownCategories.has(e.category)).map((e) => ({ id: e.id, name: e.name, category: e.category })),
    suspectedDuplicateExercises,
    nonemptyWorkoutNotes: workouts.filter((w) => String(w.notes ?? '').trim()).map((w) => w.id),
    nonemptyExerciseNotes: exercises.filter((e) => String(e.notes ?? '').trim()).map((e) => e.id),
    populatedRPE: sets.filter((s) => s.rpe !== null && s.rpe !== undefined && s.rpe !== '').map((s) => ({ id: s.id, rpe: s.rpe })),
  },
  existingHealthFields: {
    workouts: workouts.filter((w) => Object.keys(w).some((key) => /health|sync/i.test(key))).length,
    topLevelKeys: Object.keys(data).filter((key) => /health|sync|migration|wellbeing|asthma|pending|link/i.test(key)),
  },
};

console.log(JSON.stringify(summary, null, 2));
