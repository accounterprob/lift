// Restore safety (src/backup.js, src/validate.js), against a small in-memory
// stand-in for IndexedDB. Not a browser or iOS storage test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rows, reset, failNextGetAll } from './fake-idb.mjs';
import { categoryFor } from '../src/seed.js';
import { validateSnapshot } from '../src/validate.js';

// Migration toasts need only this much of a page.
globalThis.document = {
  querySelector: () => null,
  createElement: () => ({ classList: { add() {} }, addEventListener() {}, remove() {} }),
  body: { appendChild() {} },
};
const { restoreFromFile, undoLastRestore } = await import('../src/backup.js');

const exercise = { id: 'row', name: 'Seated Row Machine', category: 'Back', equipment: 'Machine' };
const workout = { id: 'w', name: 'Back Day', startedAt: 1000, endedAt: 3601000 };
const set = { id: 's', workoutId: 'w', exerciseId: 'row', weight: 100, reps: 10, order: 0, completed: true, setType: 'working' };
const backup = (over = {}) => ({ version: 4, exercises: [exercise], workouts: [workout], sets: [set], ...over });
const file = (data) => ({ text: async () => JSON.stringify(data) });

const current = () => ({
  exercises: [{ id: 'bench', name: 'Bench Press', category: 'Chest' }],
  workouts: [{ id: 'today', name: 'Chest Day', startedAt: 5000, endedAt: 6000 }],
  sets: [{ ...set, id: 'mine', workoutId: 'today', exerciseId: 'bench' }],
});

test('rowing machines stay cardio, but a strength row is never deleted', () => {
  assert.equal(categoryFor('Rowing Machine'), 'Cardio');
  assert.equal(categoryFor('Treadmill'), 'Cardio');
  assert.equal(categoryFor('Seated Row Machine'), 'Back');
  assert.equal(categoryFor('Row Machine'), 'Back');
});

test('an old backup keeps a strength row filed under Other, and counts are real', async () => {
  reset(current());
  const cardio = { id: 'tread', name: 'Treadmill', category: 'Other' };
  const counts = await restoreFromFile(file(backup({
    exercises: [{ ...exercise, category: 'Other' }, cardio],
    workouts: [workout, { ...workout, id: 'w2' }],
    sets: [set, { ...set, id: 'run', workoutId: 'w2', exerciseId: 'tread' }],
  })));
  assert.deepEqual(counts, { exercises: 1, workouts: 1, sets: 1 });
  assert.equal(rows.exercises.get('row').category, 'Back');
  assert.ok(rows.sets.has('s'));
});

test('a damaged backup is refused before anything changes', async () => {
  const bad = [
    backup({ exercises: [{ ...exercise, name: 42 }] }),
    backup({ sets: [{ ...set, exerciseId: 'nope' }] }),
    backup({ sets: [{ ...set, workoutId: 'nope' }] }),
    backup({ sets: [set, set] }),
    backup({ sets: [{ ...set, weight: 'heavy' }] }),
    backup({ sets: [{ ...set, id: '"><img src=x onerror=alert(1)>' }] }),
    backup({ workouts: [{ ...workout, startedAt: null }] }),
    backup({ version: 99 }),
  ];
  for (const b of bad) {
    reset(current());
    await assert.rejects(restoreFromFile(file(b)));
    assert.ok(rows.sets.has('mine'));
    assert.equal(rows.workouts.size, 1);
    assert.equal(rows.appMeta.size, 0);
  }
});

test('a failed cleanup puts the old data straight back', async () => {
  reset(current());
  const f = file(backup());
  failNextGetAll('exercises', 2);  // the cleanups read exercises; the pre-restore copy reads first
  await assert.rejects(restoreFromFile(f), /Your data was not changed/);
  assert.ok(rows.sets.has('mine'));
  assert.ok(!rows.sets.has('s'));
});

test('Undo Last Restore brings the data back, and can itself be undone', async () => {
  reset(current());
  await restoreFromFile(file(backup()));
  assert.ok(rows.sets.has('s') && !rows.sets.has('mine'));
  await undoLastRestore();
  assert.ok(rows.sets.has('mine') && !rows.sets.has('s'));
  await undoLastRestore();
  assert.ok(rows.sets.has('s') && !rows.sets.has('mine'));
});

test('a normal backup passes validation, including imported rows with no types', () => {
  validateSnapshot(backup());
  validateSnapshot(backup({ sets: [{ ...set, setType: null, completed: false }] }));
  validateSnapshot(backup({ workouts: [{ ...workout, endedAt: null }] }));
  assert.throws(() => validateSnapshot({ hello: 'world' }), /doesn't look like a Lift backup/);
});
