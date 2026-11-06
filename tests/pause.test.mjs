// Workout duration with pauses (src/utils.js workoutElapsedMs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workoutElapsedMs } from '../src/utils.js';

const MIN = 60 * 1000;

test('a workout with no pauses counts straight through', () => {
  assert.equal(workoutElapsedMs({ startedAt: 0, endedAt: 60 * MIN }), 60 * MIN);
  assert.equal(workoutElapsedMs({ startedAt: 0, endedAt: null }, 5 * MIN), 5 * MIN);
});

test('finished pauses are left out', () => {
  assert.equal(workoutElapsedMs({ startedAt: 0, endedAt: 60 * MIN, pausedMs: 15 * MIN }), 45 * MIN);
  assert.equal(workoutElapsedMs({ startedAt: 0, endedAt: null, pausedMs: 2 * MIN }, 10 * MIN), 8 * MIN);
});

test('the clock stands still during a pause', () => {
  const w = { startedAt: 0, endedAt: null, pausedMs: 2 * MIN, pausedAt: 20 * MIN };
  assert.equal(workoutElapsedMs(w, 21 * MIN), 18 * MIN);
  assert.equal(workoutElapsedMs(w, 90 * MIN), 18 * MIN);
});

test('never negative', () => {
  assert.equal(workoutElapsedMs({ startedAt: 10 * MIN, endedAt: 5 * MIN }), 0);
});
