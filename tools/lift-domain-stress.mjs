import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  performedSets,
  buildPrevSlotMaps,
} from '../src/db.js';
import {
  ROTATION,
  classifyWorkoutDays,
} from '../src/days.js';

const exerciseCount = 60;
const workoutCount = 750;
const setsPerExercise = 5;
const exercises = Array.from({ length: exerciseCount }, (_, index) => ({
  id: `exercise-${index}`,
  name: index % 3 === 0 ? `Bench Press ${index}` : index % 3 === 1 ? `Back Squat ${index}` : `Seated Row ${index}`,
  category: index % 3 === 0 ? 'Chest' : index % 3 === 1 ? 'Legs' : 'Back',
}));
const workouts = [];
const sets = [];
const base = Date.now() - workoutCount * 86_400_000;

for (let workoutIndex = 0; workoutIndex < workoutCount; workoutIndex += 1) {
  const workoutId = `workout-${workoutIndex}`;
  const day = ROTATION[workoutIndex % ROTATION.length];
  workouts.push({
    id: workoutId,
    name: workoutIndex % 10 === 0 ? `Imported Session ${workoutIndex}` : day,
    startedAt: base + workoutIndex * 86_400_000,
    endedAt: base + workoutIndex * 86_400_000 + 3_600_000,
  });
  for (let exerciseOffset = 0; exerciseOffset < 8; exerciseOffset += 1) {
    const exercise = exercises[(workoutIndex * 3 + exerciseOffset) % exercises.length];
    for (let setIndex = 0; setIndex < setsPerExercise; setIndex += 1) {
      sets.push({
        id: `${workoutId}-${exercise.id}-${setIndex}`,
        workoutId,
        exerciseId: exercise.id,
        order: exerciseOffset * setsPerExercise + setIndex,
        setType: setIndex === 0 ? 'warmup' : 'working',
        weight: 45 + ((workoutIndex + exerciseOffset + setIndex) % 60) * 2.5,
        reps: 5 + ((workoutIndex + setIndex) % 8),
        completed: setIndex !== setsPerExercise - 1,
      });
    }
  }
}

const started = performance.now();
const performed = performedSets(sets);
const prev = buildPrevSlotMaps(sets, workouts, null);
const setsByWorkout = new Map();
for (const set of performed) {
  if (!setsByWorkout.has(set.workoutId)) setsByWorkout.set(set.workoutId, []);
  setsByWorkout.get(set.workoutId).push(set);
}
const classifications = classifyWorkoutDays(workouts, setsByWorkout, new Map(exercises.map((exercise) => [exercise.id, exercise])));
const elapsed = performance.now() - started;

assert.equal(sets.length, workoutCount * 8 * setsPerExercise);
assert.equal(performed.length, workoutCount * 8 * (setsPerExercise - 1));
assert.equal(prev.size, exerciseCount);
assert.equal(classifications.size, workoutCount);
for (const day of classifications.values()) assert.ok(ROTATION.includes(day));
for (const slots of prev.values()) {
  assert.ok(slots.has('warmup#1'));
  assert.ok(slots.has('working#1'));
}
assert.ok(elapsed < 1_500, `Domain stress pass took ${elapsed.toFixed(1)}ms`);

console.log(`Lift domain stress passed: ${workouts.length} workouts, ${sets.length} sets in ${elapsed.toFixed(1)}ms.`);
