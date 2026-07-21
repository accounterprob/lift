import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSnapshot } from '../src/backup.js';

test('old backup imports with safe defaults and intact core records', () => {
  const old = { version: 1, exercises: [{ id: 'e', name: 'Squat' }], workouts: [{ id: 'w', name: 'Leg Day', startedAt: 1, endedAt: 2 }], sets: [{ id: 's', workoutId: 'w', exerciseId: 'e', completed: true, rpe: null }] };
  const result = normalizeSnapshot(old);
  assert.equal(result.version, 2);
  assert.equal(result.exercises.length, 1);
  assert.equal(result.workouts.length, 1);
  assert.equal(result.sets.length, 1);
  assert.equal(result.workouts[0].healthKitSyncStatus, 'notSynchronized');
  assert.deepEqual(result.healthKitLinks, []);
  assert.deepEqual(result.healthKitOutbox, []);
});

test('new backup shape round-trips and non-null legacy RPE is never lost', () => {
  const current = { version: 2, schemaVersion: 2, exercises: [], workouts: [], sets: [{ id: 's', rpe: 8 }], wellbeingEntries: [{ id: 'd', energy: 4 }], asthmaEvents: [], healthKitLinks: [], healthKitOutbox: [], migrationState: [], appSettings: [] };
  const result = normalizeSnapshot(JSON.parse(JSON.stringify(current)));
  assert.equal(result.sets[0].rpe, 8);
  assert.equal(result.wellbeingEntries[0].energy, 4);
});

test('partially completed migration restores as review-required rather than blindly replaying', () => {
  const current = { version: 2, exercises: [], workouts: [], sets: [], healthKitLinks: [{ id: 'l', syncIdentifier: 'x' }], healthKitOutbox: [{ id: 'o', syncStatus: 'pending' }], migrationState: [{ id: 'healthKitBackfill', status: 'partiallyCompleted' }] };
  const result = normalizeSnapshot(current, { afterRestore: true });
  assert.equal(result.healthKitLinks[0].syncStatus, 'needsReconciliation');
  assert.equal(result.healthKitOutbox[0].syncStatus, 'pendingReviewAfterRestore');
  assert.equal(result.healthKitOutbox[0].requiresUserAttention, true);
  assert.equal(result.migrationState[0].status, 'partiallyCompleted');
});
