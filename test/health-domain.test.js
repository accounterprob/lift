import test from 'node:test';
import assert from 'node:assert/strict';
import {
  auditLiftData,
  detectAccessibleWorkoutConflicts,
  localCalendarDayIdentifier,
  moodToValence,
  stableSyncIdentifier,
  valenceToMood,
  validateAsthmaInput,
  validateEffort,
  validateWellbeingInput,
} from '../src/health/domain.js';

test('mood mapping is deterministic and does not infer labels', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(moodToValence), [-1, -0.5, 0, 0.5, 1]);
  assert.deepEqual([-1, -0.5, 0, 0.5, 1].map(valenceToMood), [1, 2, 3, 4, 5]);
  assert.throws(() => moodToValence(0), RangeError);
});

test('effort only accepts integer values 1 through 10', () => {
  assert.equal(validateEffort(1), 1);
  assert.equal(validateEffort(10), 10);
  for (const value of [0, 11, 5.5, null]) assert.throws(() => validateEffort(value), RangeError);
});

test('calendar identifier is captured once from the local calendar date', () => {
  assert.equal(localCalendarDayIdentifier(new Date(2026, 1, 3, 23, 59)), '2026-02-03');
});

test('wellbeing values remain distinct and general breathing does not create a symptom', () => {
  const result = validateWellbeingInput({ mood: 4, energy: 2, stress: 5, muscularSoreness: 3, breathingLimitation: 2, context: 'preWorkout' });
  assert.deepEqual(result, { mood: 4, energy: 2, stress: 5, muscularSoreness: 3, breathingLimitation: 2, context: 'preWorkout' });
  assert.equal('symptoms' in result, false);
});

test('asthma event rejects empty input and keeps only selected exact symptoms', () => {
  assert.throws(() => validateAsthmaInput({ puffs: 0, symptoms: {}, context: 'outsideWorkout' }), /at least one/i);
  assert.deepEqual(
    validateAsthmaInput({ puffs: 2, symptoms: { wheezing: 'mild', coughing: false }, context: 'duringWorkout', note: ' after set ' }),
    { puffs: 2, symptoms: { wheezing: 'mild' }, context: 'duringWorkout', note: 'after set' },
  );
});

test('stable identifiers are shared by prospective and backfill paths', () => {
  assert.equal(stableSyncIdentifier('workout', 'abc'), 'com.accounterprob.lift.workout.abc');
});

test('historical audit derives duration, rejects bad intervals, and classifies Cardio by content', () => {
  const exercises = [{ id: 'bench', name: 'Bench Press', category: 'Chest' }];
  const workouts = [
    { id: 'good', name: 'Cardio Day', startedAt: 1_000, endedAt: 61_000 },
    { id: 'bad', name: 'Chest Day', startedAt: 5_000, endedAt: 4_000 },
  ];
  const sets = [{ id: 'set', workoutId: 'good', exerciseId: 'bench', completed: true, rpe: null }];
  const audit = auditLiftData({ exercises, workouts, sets });
  const good = audit.rows.find((row) => row.workoutID === 'good');
  assert.equal(good.duration, 60_000);
  assert.equal(good.proposedActivityType, 'traditionalStrengthTraining');
  assert.equal(audit.rows.find((row) => row.workoutID === 'bad').status, 'invalid');
  assert(audit.findings.some((finding) => finding.code === 'name-content-mismatch'));
  assert.equal('effort' in good, false);
});

test('incomplete sets do not block an otherwise eligible workout', () => {
  const audit = auditLiftData({
    exercises: [{ id: 'e', name: 'Squat', category: 'Legs' }],
    workouts: [{ id: 'w', name: 'Leg Day', startedAt: 100, endedAt: 200 }],
    sets: [
      { id: 'done', workoutId: 'w', exerciseId: 'e', completed: true },
      { id: 'open', workoutId: 'w', exerciseId: 'e', completed: false },
    ],
  });
  assert.equal(audit.rows[0].status, 'eligible');
  assert.equal(audit.rows[0].incompleteSetCount, 1);
});

test('probable external overlap is flagged and not treated as Lift-created', () => {
  const audit = { rows: [{ workoutID: 'w', start: 1_000, end: 61_000, duration: 60_000, status: 'eligible' }] };
  const rows = detectAccessibleWorkoutConflicts(audit, [{ start: 2_000, end: 60_000, createdByLift: false }]);
  assert.equal(rows[0].status, 'possibleConflict');
});

test('a workout with no completed sets requires review', () => {
  const audit = auditLiftData({
    exercises: [{ id: 'e', name: 'Squat', category: 'Legs' }],
    workouts: [{ id: 'w', name: 'Leg Day', startedAt: 1, endedAt: 10 }],
    sets: [{ id: 's', workoutId: 'w', exerciseId: 'e', completed: false }],
  });
  assert.equal(audit.rows[0].status, 'requiresReview');
  assert.match(audit.rows[0].reason, /no completed/i);
});

test('audit reports duplicate IDs, orphan references, categories, and duplicate exercise definitions without changing them', () => {
  const exercises = [
    { id: 'e', name: 'Squat', category: 'Legs' },
    { id: 'e', name: 'Squat', category: 'Mystery' },
  ];
  const audit = auditLiftData({ exercises, workouts: [], sets: [{ id: 's', workoutId: 'missing', exerciseId: 'missing', completed: true }] });
  const codes = new Set(audit.findings.map((finding) => finding.code));
  for (const code of ['duplicate-exercise-id', 'orphaned-set-workout', 'orphaned-set-exercise', 'unknown-exercise-category', 'suspected-duplicate-exercise']) assert(codes.has(code));
  assert.equal(exercises[1].category, 'Mystery');
});

test('matching Lift sync identifier is classified as already synchronized', () => {
  const audit = { rows: [{ workoutID: 'w', start: 1_000, end: 61_000, duration: 60_000, status: 'eligible' }] };
  const rows = detectAccessibleWorkoutConflicts(audit, [{
    start: 1_000,
    end: 61_000,
    createdByLift: true,
    syncIdentifier: stableSyncIdentifier('workout', 'w'),
    syncVersion: 1,
  }]);
  assert.equal(rows[0].status, 'alreadySynchronized');
});

test('historical audit never invents effort, wellbeing, inhaler, or symptom values', () => {
  const audit = auditLiftData({
    exercises: [{ id: 'e', name: 'Bench', category: 'Chest' }],
    workouts: [{ id: 'w', name: 'Chest', startedAt: 1, endedAt: 5 }],
    sets: [{ id: 's', workoutId: 'w', exerciseId: 'e', completed: true, rpe: null }],
  });
  for (const forbidden of ['effort', 'mood', 'energy', 'stress', 'inhalerUsage', 'symptoms']) {
    assert.equal(forbidden in audit.rows[0], false);
  }
});

test('historical audit accounts for existing links, pending writes, and partial migrations', () => {
  const base = {
    exercises: [{ id: 'e', name: 'Bench', category: 'Chest' }],
    workouts: [
      { id: 'linked', name: 'Chest', startedAt: 1, endedAt: 5 },
      { id: 'pending', name: 'Chest', startedAt: 10, endedAt: 15 },
    ],
    sets: [
      { id: 's1', workoutId: 'linked', exerciseId: 'e', completed: true },
      { id: 's2', workoutId: 'pending', exerciseId: 'e', completed: true },
    ],
    healthKitLinks: [{ localEntityID: 'linked', entityKind: 'workout', syncStatus: 'synchronized' }],
    healthKitOutbox: [{ localEntityID: 'pending', entityKind: 'workout' }],
    migrationState: [{ status: 'partiallyCompleted' }],
  };
  const audit = auditLiftData(base);
  assert.equal(audit.rows.find((row) => row.workoutID === 'linked').status, 'alreadySynchronized');
  assert.equal(audit.rows.find((row) => row.workoutID === 'pending').status, 'requiresReview');
  assert(audit.findings.some((finding) => finding.code === 'partial-migration'));
});
