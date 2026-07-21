export const HEALTH_NAMESPACE = 'com.accounterprob.lift';
export const HEALTH_SYNC_SCHEMA_VERSION = 1;
export const BACKUP_SCHEMA_VERSION = 2;

export const HEALTH_ENTITY_KINDS = Object.freeze([
  'workout',
  'workoutEffort',
  'stateOfMind',
  'inhalerUsage',
  'wheezing',
  'shortnessOfBreath',
  'coughing',
  'chestTightnessOrPain',
]);

export const RESPIRATORY_SYMPTOMS = Object.freeze([
  { kind: 'wheezing', label: 'Wheezing' },
  { kind: 'shortnessOfBreath', label: 'Shortness of breath' },
  { kind: 'coughing', label: 'Coughing' },
  { kind: 'chestTightnessOrPain', label: 'Chest tightness or pain' },
]);

export const SYMPTOM_SEVERITIES = Object.freeze(['unspecified', 'mild', 'moderate', 'severe']);
export const WELLBEING_CONTEXTS = Object.freeze(['general', 'preWorkout', 'postWorkout']);
export const ASTHMA_CONTEXTS = Object.freeze(['beforeWorkout', 'duringWorkout', 'afterWorkout', 'outsideWorkout']);

export function stableSyncIdentifier(entityKind, localEntityID) {
  if (!HEALTH_ENTITY_KINDS.includes(entityKind)) throw new Error(`Unsupported HealthKit entity kind: ${entityKind}`);
  if (!localEntityID) throw new Error('A local entity ID is required.');
  return `${HEALTH_NAMESPACE}.${entityKind}.${localEntityID}`;
}

export function moodToValence(mood) {
  const mapping = new Map([[1, -1], [2, -0.5], [3, 0], [4, 0.5], [5, 1]]);
  if (!mapping.has(Number(mood))) throw new RangeError('Mood must be an integer from 1 through 5.');
  return mapping.get(Number(mood));
}

export function valenceToMood(valence) {
  const value = Number(valence);
  if (!Number.isFinite(value) || value < -1 || value > 1) {
    throw new RangeError('State of Mind valence must be from -1 through 1.');
  }
  return Math.max(1, Math.min(5, Math.round((value + 1) * 2) + 1));
}

export function localCalendarDayIdentifier(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) throw new Error('A valid date is required.');
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function currentTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
}

export function validateEffort(value) {
  const effort = Number(value);
  if (!Number.isInteger(effort) || effort < 1 || effort > 10) {
    throw new RangeError('Workout effort must be an integer from 1 through 10.');
  }
  return effort;
}

export function validateWellbeingInput(input) {
  const integerIn = (name, min, max) => {
    const value = Number(input[name]);
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${name} must be an integer from ${min} through ${max}.`);
    }
    return value;
  };
  if (!WELLBEING_CONTEXTS.includes(input.context)) throw new Error('Unsupported wellbeing context.');
  return {
    mood: integerIn('mood', 1, 5),
    energy: integerIn('energy', 1, 5),
    stress: integerIn('stress', 1, 5),
    muscularSoreness: integerIn('muscularSoreness', 0, 3),
    breathingLimitation: integerIn('breathingLimitation', 0, 3),
    context: input.context,
  };
}

export function validateAsthmaInput(input) {
  const puffs = Number(input.puffs ?? 0);
  if (!Number.isInteger(puffs) || puffs < 0 || puffs > 99) {
    throw new RangeError('Inhaler puffs must be a whole number from 0 through 99.');
  }
  if (!ASTHMA_CONTEXTS.includes(input.context)) throw new Error('Unsupported asthma-event context.');
  const symptoms = {};
  for (const { kind } of RESPIRATORY_SYMPTOMS) {
    const value = input.symptoms?.[kind];
    if (value == null || value === false || value === '') continue;
    if (!SYMPTOM_SEVERITIES.includes(value)) throw new Error(`Unsupported severity for ${kind}.`);
    symptoms[kind] = value;
  }
  if (puffs === 0 && Object.keys(symptoms).length === 0) {
    throw new Error('Log at least one inhaler puff or one symptom.');
  }
  return { puffs, symptoms, context: input.context, note: String(input.note ?? '').trim() };
}

export function makeOutboxOperation({
  id,
  localEntityID,
  operationType,
  entityKind,
  payload,
  dependencyIDs = [],
  syncIdentifier,
  syncVersion = 1,
  createdAt = Date.now(),
}) {
  return {
    id,
    localEntityID,
    operationType,
    entityKind,
    payload,
    dependencyIDs: [...dependencyIDs],
    attemptCount: 0,
    createdAt,
    lastAttemptAt: null,
    lastError: null,
    syncIdentifier,
    syncVersion,
    syncStatus: 'pending',
    requiresUserAttention: false,
  };
}

export function orderReadyOperations(operations, completedIDs = new Set()) {
  const byID = new Map(operations.map((op) => [op.id, op]));
  const done = new Set(completedIDs);
  for (const op of operations) {
    if (op.syncStatus === 'succeeded') done.add(op.id);
  }
  return operations
    .filter((op) => ['pending', 'failed'].includes(op.syncStatus) && !op.requiresUserAttention)
    .filter((op) => (op.dependencyIDs ?? []).every((id) => done.has(id) || !byID.has(id)))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function classifyHealthError(error) {
  const code = String(error?.code ?? '').toLowerCase();
  const message = String(error?.message ?? error ?? 'HealthKit write failed.');
  const unsupported = code === 'unsupported' || code.includes('invalidtype');
  return {
    userMessage: unsupported ? 'This Health data type is not supported on this device.' : friendlyHealthError(message),
    requiresUserAttention: unsupported,
  };
}

function friendlyHealthError(message) {
  const lower = message.toLowerCase();
  if (lower.includes('authorization') || lower.includes('permission') || lower.includes('did not allow')) return 'Apple Health did not allow this write. You can review access in Settings.';
  if (lower.includes('protected') || lower.includes('locked')) return 'Health data is temporarily unavailable while the device is locked.';
  return 'Apple Health could not save this entry. Lift kept it for retry.';
}

export function auditLiftData({ exercises = [], workouts = [], sets = [], healthKitLinks = [], healthKitOutbox = [], migrationState = [] }) {
  const findings = [];
  const add = (category, code, message, details = {}) => findings.push({ category, code, message, ...details });
  const duplicateIDs = (rows, kind) => {
    const counts = new Map();
    for (const row of rows) counts.set(row.id, (counts.get(row.id) ?? 0) + 1);
    for (const [id, count] of counts) if (count > 1) add('blocking', `duplicate-${kind}-id`, `Duplicate ${kind} ID`, { id, count });
  };
  duplicateIDs(exercises, 'exercise');
  duplicateIDs(workouts, 'workout');
  duplicateIDs(sets, 'set');

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const workoutMap = new Map(workouts.map((w) => [w.id, w]));
  const setsByWorkout = new Map();
  for (const set of sets) {
    if (!setsByWorkout.has(set.workoutId)) setsByWorkout.set(set.workoutId, []);
    setsByWorkout.get(set.workoutId).push(set);
    if (!workoutMap.has(set.workoutId)) add('blocking', 'orphaned-set-workout', 'Set references a missing workout.', { setID: set.id });
    if (!exerciseMap.has(set.exerciseId)) add('blocking', 'orphaned-set-exercise', 'Set references a missing exercise.', { setID: set.id });
  }

  const intervalMap = new Map();
  const workoutLinks = new Map(healthKitLinks.filter((link) => link.entityKind === 'workout').map((link) => [link.localEntityID, link]));
  const pendingWorkoutIDs = new Set(healthKitOutbox.filter((operation) => operation.entityKind === 'workout').map((operation) => operation.localEntityID));
  const rows = workouts.map((workout) => {
    const workoutSets = setsByWorkout.get(workout.id) ?? [];
    const completedSetCount = workoutSets.filter((s) => s.completed).length;
    const incompleteSetCount = workoutSets.length - completedSetCount;
    const start = Number(workout.startedAt);
    const end = Number(workout.endedAt);
    let status = 'eligible';
    let reason = null;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      status = 'invalid';
      reason = 'Missing or invalid workout interval.';
      add('blocking', 'invalid-workout-interval', reason, { workoutID: workout.id });
    } else {
      const duration = end - start;
      if (duration > 6 * 60 * 60 * 1000) {
        status = 'requiresReview';
        reason = 'Workout duration exceeds six hours.';
        add('reviewRecommended', 'long-workout', reason, { workoutID: workout.id });
      }
      const key = `${start}:${end}`;
      if (!intervalMap.has(key)) intervalMap.set(key, []);
      intervalMap.get(key).push(workout.id);
    }
    if (workoutSets.length === 0 || completedSetCount === 0) {
      status = status === 'invalid' ? status : 'requiresReview';
      reason = workoutSets.length === 0 ? 'Workout has no sets.' : 'Workout has no completed sets.';
      add('reviewRecommended', 'workout-without-completed-sets', reason, { workoutID: workout.id });
    }
    if (incompleteSetCount > 0) add('informational', 'incomplete-sets', `${incompleteSetCount} incomplete set(s) retained.`, { workoutID: workout.id, count: incompleteSetCount });

    const categories = new Set(workoutSets.map((s) => exerciseMap.get(s.exerciseId)?.category).filter(Boolean));
    const resistance = [...categories].some((category) => category !== 'Cardio');
    if (!resistance && categories.size > 0) {
      status = status === 'eligible' ? 'requiresReview' : status;
      reason ??= 'Recorded content does not clearly represent resistance training.';
    }
    if (/cardio/i.test(workout.name ?? '') && resistance) {
      add('reviewRecommended', 'name-content-mismatch', 'Cardio-named workout contains resistance exercises.', { workoutID: workout.id });
    }
    const existingLink = workoutLinks.get(workout.id);
    if (existingLink && status !== 'invalid') {
      if (existingLink.syncStatus === 'synchronized' && !existingLink.externallyDeletedOrInaccessible) {
        status = 'alreadySynchronized';
        reason = 'A synchronized Lift HealthKit link already exists.';
      } else if (status === 'eligible') {
        status = 'requiresReview';
        reason = 'An existing HealthKit link requires reconciliation.';
      }
    }
    if (pendingWorkoutIDs.has(workout.id) && status === 'eligible') {
      status = 'requiresReview';
      reason = 'A pending HealthKit workout write already exists.';
    }
    return {
      workoutID: workout.id,
      date: start,
      start,
      end,
      duration: Number.isFinite(end - start) ? end - start : null,
      name: workout.name,
      completedSetCount,
      incompleteSetCount,
      exercises: [...new Set(workoutSets.map((s) => exerciseMap.get(s.exerciseId)?.name).filter(Boolean))],
      proposedActivityType: resistance ? 'traditionalStrengthTraining' : null,
      status,
      reason,
    };
  });

  for (const ids of intervalMap.values()) {
    if (ids.length < 2) continue;
    add('blocking', 'duplicate-workout-interval', 'Multiple workouts have the exact same interval.', { workoutIDs: ids });
    for (const id of ids) {
      const row = rows.find((item) => item.workoutID === id);
      if (row) { row.status = 'invalid'; row.reason = 'Unresolved duplicate workout interval.'; }
    }
  }

  const sorted = rows.filter((r) => r.start && r.end && r.end > r.start).sort((a, b) => a.start - b.start);
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length && sorted[j].start < sorted[i].end; j += 1) {
      const overlap = Math.min(sorted[i].end, sorted[j].end) - sorted[j].start;
      const shorter = Math.min(sorted[i].duration, sorted[j].duration);
      if (overlap / shorter >= 0.5) {
        add('reviewRecommended', 'overlapping-workouts', 'Lift workouts substantially overlap.', { workoutIDs: [sorted[i].workoutID, sorted[j].workoutID] });
        for (const row of [sorted[i], sorted[j]]) {
          if (row.status === 'eligible') { row.status = 'requiresReview'; row.reason = 'Substantially overlaps another Lift workout.'; }
        }
      }
    }
  }

  const knownCategories = new Set(['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Legs', 'Glutes', 'Calves', 'Core', 'Cardio', 'Full Body', 'Other']);
  for (const exercise of exercises) {
    if (!knownCategories.has(exercise.category)) add('reviewRecommended', 'unknown-exercise-category', 'Exercise has an unknown category.', { exerciseID: exercise.id, currentValue: exercise.category });
  }
  const byName = new Map();
  for (const exercise of exercises) {
    const key = String(exercise.name ?? '').trim().toLocaleLowerCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(exercise);
  }
  for (const [name, values] of byName) {
    if (name && values.length > 1) add('reviewRecommended', 'suspected-duplicate-exercise', 'Exercises share the same normalized name.', { currentValue: name, exerciseIDs: values.map((e) => e.id), affectedRecords: values.length });
  }
  if (!sets.some((s) => s.rpe != null && s.rpe !== '')) {
    add('safeAutomaticNormalization', 'unused-null-rpe', 'All legacy set-level RPE values are empty; future backups may omit the field.', { affectedRecords: sets.length });
  }
  if (!workouts.some((w) => String(w.notes ?? '').trim())) add('informational', 'empty-workout-notes', 'All workout notes are empty.');
  if (healthKitLinks.length) add('informational', 'existing-healthkit-links', `${healthKitLinks.length} existing HealthKit link(s) require consideration.`, { count: healthKitLinks.length });
  if (healthKitOutbox.length) add('reviewRecommended', 'existing-healthkit-outbox', `${healthKitOutbox.length} pending or failed HealthKit write(s) require consideration.`, { count: healthKitOutbox.length });
  const partialMigrations = migrationState.filter((state) => state.status && state.status !== 'completed');
  if (partialMigrations.length) add('reviewRecommended', 'partial-migration', 'A partially completed or canceled migration can be resumed.', { count: partialMigrations.length });

  return {
    scanned: workouts.length,
    rows,
    findings,
    counts: {
      eligible: rows.filter((r) => r.status === 'eligible').length,
      requiresReview: rows.filter((r) => r.status === 'requiresReview').length,
      invalid: rows.filter((r) => r.status === 'invalid').length,
      alreadySynchronized: rows.filter((r) => r.status === 'alreadySynchronized').length,
    },
  };
}

export function detectAccessibleWorkoutConflicts(audit, accessibleWorkouts, toleranceMs = 5 * 60 * 1000) {
  return audit.rows.map((row) => {
    if (!row.start || !row.end) return row;
    const sameSync = accessibleWorkouts.find((w) => w.syncIdentifier === stableSyncIdentifier('workout', row.workoutID));
    if (sameSync) return { ...row, status: sameSync.syncVersion >= 1 ? 'alreadySynchronized' : 'needsUpdate', healthKitObject: sameSync };
    const conflict = accessibleWorkouts.find((w) => {
      if (w.createdByLift) return false;
      const closeBounds = Math.abs(w.start - row.start) <= toleranceMs && Math.abs(w.end - row.end) <= toleranceMs;
      const overlap = Math.max(0, Math.min(w.end, row.end) - Math.max(w.start, row.start));
      return closeBounds || overlap / Math.max(1, row.duration) >= 0.8;
    });
    if (conflict) return { ...row, status: 'possibleConflict', reason: 'An accessible workout from another source overlaps this interval.', healthKitObject: conflict };
    return row;
  });
}
