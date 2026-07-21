export const SHORTCUT_DEFAULT_NAME = 'Lift Add Workout';

export function makeWorkoutShortcutPayload(workout) {
  const start = Number(workout?.startedAt);
  const end = Number(workout?.endedAt);
  if (!workout?.id || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error('A completed workout with a valid start and end time is required.');
  }
  const durationSeconds = Math.max(1, Math.round((end - start) / 1000));
  return {
    liftWorkoutID: String(workout.id),
    name: String(workout.name || 'Lift Workout'),
    startDate: new Date(start).toISOString(),
    endDate: new Date(end).toISOString(),
    durationSeconds,
    durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
    activityType: 'Traditional Strength Training',
  };
}

export function cleanShortcutCallbackURL(url) {
  const parsed = new URL(url);
  for (const key of ['liftShortcutResult', 'liftWorkoutID', 'errorMessage']) parsed.searchParams.delete(key);
  return parsed.toString();
}

export function buildWorkoutShortcutURL(workout, {
  shortcutName = SHORTCUT_DEFAULT_NAME,
  returnURL = typeof window !== 'undefined' ? window.location.href : 'https://example.invalid/lift/',
} = {}) {
  const payload = makeWorkoutShortcutPayload(workout);
  const cleanReturnURL = cleanShortcutCallbackURL(returnURL);
  const callback = (result) => {
    const url = new URL(cleanReturnURL);
    url.searchParams.set('liftShortcutResult', result);
    url.searchParams.set('liftWorkoutID', payload.liftWorkoutID);
    return url.toString();
  };
  const url = new URL('shortcuts://x-callback-url/run-shortcut');
  url.searchParams.set('name', shortcutName.trim() || SHORTCUT_DEFAULT_NAME);
  url.searchParams.set('input', 'text');
  url.searchParams.set('text', JSON.stringify(payload));
  url.searchParams.set('x-success', callback('success'));
  url.searchParams.set('x-cancel', callback('cancel'));
  url.searchParams.set('x-error', callback('error'));
  return url.toString();
}

export function parseShortcutCallback(url) {
  const parsed = new URL(url);
  const result = parsed.searchParams.get('liftShortcutResult');
  const workoutID = parsed.searchParams.get('liftWorkoutID');
  if (!['success', 'cancel', 'error'].includes(result) || !workoutID) return null;
  return {
    result,
    workoutID,
    errorMessage: parsed.searchParams.get('errorMessage'),
    cleanURL: cleanShortcutCallbackURL(parsed.toString()),
  };
}
