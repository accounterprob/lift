import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWorkoutShortcutURL,
  cleanShortcutCallbackURL,
  makeWorkoutShortcutPayload,
  parseShortcutCallback,
} from '../src/health/shortcut.js';

const workout = {
  id: 'workout-123',
  name: 'Chest Day',
  startedAt: Date.parse('2026-07-20T15:00:00.000Z'),
  endedAt: Date.parse('2026-07-20T16:05:30.000Z'),
};

test('shortcut payload contains only an exact completed workout summary', () => {
  assert.deepEqual(makeWorkoutShortcutPayload(workout), {
    liftWorkoutID: 'workout-123',
    name: 'Chest Day',
    startDate: '2026-07-20T15:00:00.000Z',
    endDate: '2026-07-20T16:05:30.000Z',
    durationSeconds: 3930,
    durationMinutes: 66,
    activityType: 'Traditional Strength Training',
  });
});

test('shortcut payload rejects unfinished and backwards intervals', () => {
  assert.throws(() => makeWorkoutShortcutPayload({ ...workout, endedAt: null }), /completed workout/i);
  assert.throws(() => makeWorkoutShortcutPayload({ ...workout, endedAt: workout.startedAt - 1 }), /completed workout/i);
});

test('x-callback URL carries JSON text and success, cancel, and error returns', () => {
  const value = buildWorkoutShortcutURL(workout, {
    shortcutName: 'My Lift Shortcut',
    returnURL: 'https://lift.example/app/?installed=1',
  });
  const url = new URL(value);
  assert.equal(url.protocol, 'shortcuts:');
  assert.equal(url.hostname, 'x-callback-url');
  assert.equal(url.pathname, '/run-shortcut');
  assert.equal(url.searchParams.get('name'), 'My Lift Shortcut');
  assert.equal(url.searchParams.get('input'), 'text');
  assert.equal(JSON.parse(url.searchParams.get('text')).liftWorkoutID, workout.id);
  for (const [parameter, result] of [['x-success', 'success'], ['x-cancel', 'cancel'], ['x-error', 'error']]) {
    const callback = parseShortcutCallback(url.searchParams.get(parameter));
    assert.equal(callback.result, result);
    assert.equal(callback.workoutID, workout.id);
    assert.match(callback.cleanURL, /installed=1/);
  }
});

test('callback parsing ignores unrelated URLs and cleans only Lift callback fields', () => {
  assert.equal(parseShortcutCallback('https://lift.example/?foo=bar'), null);
  assert.equal(
    cleanShortcutCallbackURL('https://lift.example/?foo=bar&liftShortcutResult=success&liftWorkoutID=w&errorMessage=no'),
    'https://lift.example/?foo=bar',
  );
});
