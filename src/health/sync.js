import {
  del, get, getAll, getByIndex, getSetting, put, setSetting,
} from '../db.js';
import { uuid } from '../utils.js';
import {
  currentTimeZone,
  makeOutboxOperation,
  moodToValence,
  stableSyncIdentifier,
  validateAsthmaInput,
  validateEffort,
  validateWellbeingInput,
} from './domain.js';
import { healthKitService } from './service.js';
import { drainOutbox } from './outbox-runner.js';

export async function healthWritesEnabled() {
  return getSetting('healthWritesEnabled', true);
}

export async function setHealthWritesEnabled(enabled) {
  return setSetting('healthWritesEnabled', Boolean(enabled));
}

async function upsertOperation(operation) {
  const existing = (await getByIndex('healthKitOutbox', 'localEntityID', operation.localEntityID))
    .find((candidate) => candidate.entityKind === operation.entityKind && candidate.operationType === operation.operationType);
  if (existing) operation.id = existing.id;
  await put('healthKitOutbox', operation);
  return operation;
}

export async function enqueueWorkout(workout, { backfilled = false, migrationVersion = null } = {}) {
  if (!workout?.id || !Number.isFinite(Number(workout.startedAt)) || !Number.isFinite(Number(workout.endedAt)) || workout.endedAt <= workout.startedAt) {
    throw new Error('A completed workout with a valid interval is required.');
  }
  const syncVersion = Math.max(1, Number(workout.healthKitSyncVersion ?? 1));
  const syncIdentifier = stableSyncIdentifier('workout', workout.id);
  const operation = makeOutboxOperation({
    id: uuid(),
    localEntityID: workout.id,
    operationType: 'saveWorkout',
    entityKind: 'workout',
    syncIdentifier,
    syncVersion,
    payload: {
      workoutID: workout.id,
      name: workout.name,
      start: Number(workout.startedAt),
      end: Number(workout.endedAt),
      activityType: 'traditionalStrengthTraining',
      backfilled,
      migrationVersion,
      timeZone: backfilled ? (workout.timeZone ?? null) : currentTimeZone(),
    },
  });
  workout.healthKitSyncVersion = syncVersion;
  workout.healthKitSyncStatus = 'pending';
  workout.healthKitLastAttemptAt = null;
  workout.healthKitLastError = null;
  await put('workouts', workout);
  return upsertOperation(operation);
}

export async function enqueueWorkoutUpdate(workout) {
  const currentVersion = Math.max(0, Number(workout.healthKitSyncVersion ?? 0));
  workout.healthKitSyncVersion = currentVersion > 0 ? currentVersion + 1 : 1;
  return enqueueWorkout(workout);
}

export async function enqueueWorkoutEffort(workout, effort, workoutOperationID) {
  const value = validateEffort(effort);
  const localEntityID = `${workout.id}:effort`;
  return upsertOperation(makeOutboxOperation({
    id: uuid(),
    localEntityID,
    operationType: 'saveWorkoutEffort',
    entityKind: 'workoutEffort',
    syncIdentifier: stableSyncIdentifier('workoutEffort', localEntityID),
    syncVersion: 1,
    dependencyIDs: workoutOperationID ? [workoutOperationID] : [],
    payload: {
      value,
      timestamp: Number(workout.endedAt),
      start: Number(workout.startedAt),
      end: Number(workout.endedAt),
      workoutID: workout.id,
      effortEventID: localEntityID,
      workoutSyncIdentifier: stableSyncIdentifier('workout', workout.id),
      timeZone: currentTimeZone(),
    },
  }));
}

export async function saveWellbeingCheckIn({ existing = null, saveMood = true, ...input }) {
  const validated = validateWellbeingInput(input);
  const now = Number(input.timestamp ?? Date.now());
  if (!Number.isFinite(now)) throw new Error('A valid check-in timestamp is required.');
  const id = existing?.id ?? uuid();
  const record = {
    id,
    timestamp: now,
    localCalendarDayIdentifier: input.localCalendarDayIdentifier,
    timeZone: input.timeZone ?? currentTimeZone(),
    energy: validated.energy,
    stress: validated.stress,
    muscularSoreness: validated.muscularSoreness,
    breathingLimitation: validated.breathingLimitation,
    context: validated.context,
    relatedWorkoutID: input.relatedWorkoutID ?? null,
    stateOfMindHealthKitLinkID: existing?.stateOfMindHealthKitLinkID ?? null,
    stateOfMindSyncVersion: existing?.stateOfMindSyncVersion ?? 0,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  if (!healthKitService.nativeAvailable) {
    if (saveMood) record.localMood = validated.mood;
    await put('wellbeingEntries', record);
    return { record, operation: null };
  }
  const status = await healthKitService.getStatus().catch(() => null);
  if (status?.authorization?.stateOfMind === 'unavailable') {
    if (saveMood) record.localMood = validated.mood;
    await put('wellbeingEntries', record);
    return { record, operation: null };
  }
  const version = existing?.stateOfMindHealthKitLinkID ? Number(existing.stateOfMindSyncVersion ?? 1) + 1 : 1;
  if (saveMood) record.stateOfMindSyncVersion = version;
  await put('wellbeingEntries', record);
  const operation = saveMood ? await upsertOperation(makeOutboxOperation({
    id: uuid(),
    localEntityID: id,
    operationType: 'saveStateOfMind',
    entityKind: 'stateOfMind',
    syncIdentifier: stableSyncIdentifier('stateOfMind', id),
    syncVersion: version,
    payload: {
      eventID: id,
      valence: moodToValence(validated.mood),
      timestamp: now,
      context: validated.context,
      relatedWorkoutID: record.relatedWorkoutID,
      timeZone: record.timeZone,
    },
  })) : null;
  return { record, operation };
}

export async function saveAsthmaEvent(input) {
  const validated = validateAsthmaInput(input);
  const id = input.id ?? uuid();
  const timestamp = Number(input.timestamp ?? Date.now());
  if (!Number.isFinite(timestamp)) throw new Error('A valid asthma-event timestamp is required.');
  const event = {
    id,
    timestamp,
    context: validated.context,
    relatedWorkoutID: input.relatedWorkoutID ?? null,
    note: validated.note || null,
    healthKitLinkIDs: [],
    synchronizationSummary: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  if (!healthKitService.nativeAvailable) {
    event.localPuffs = validated.puffs;
    event.localSymptoms = validated.symptoms;
    event.synchronizationSummary = 'storedLocally';
    await put('asthmaEvents', event);
    return { event, operations: [] };
  }
  await put('asthmaEvents', event);
  const common = {
    asthmaEventID: id,
    timestamp,
    context: event.context,
    relatedWorkoutID: event.relatedWorkoutID,
    timeZone: currentTimeZone(),
  };
  const operations = [];
  if (validated.puffs > 0) {
    operations.push(await upsertOperation(makeOutboxOperation({
      id: uuid(),
      localEntityID: id,
      operationType: 'saveInhalerUsage',
      entityKind: 'inhalerUsage',
      syncIdentifier: stableSyncIdentifier('inhalerUsage', id),
      payload: { ...common, puffs: validated.puffs },
    })));
  }
  for (const [entityKind, severity] of Object.entries(validated.symptoms)) {
    operations.push(await upsertOperation(makeOutboxOperation({
      id: uuid(),
      localEntityID: id,
      operationType: 'saveRespiratorySymptom',
      entityKind,
      syncIdentifier: stableSyncIdentifier(entityKind, id),
      payload: { ...common, symptom: entityKind, severity },
    })));
  }
  return { event, operations };
}

export async function processHealthKitOutbox({ service = healthKitService, onProgress = null, shouldCancel = () => false } = {}) {
  if (!(await healthWritesEnabled())) return { processed: 0, succeeded: 0, failed: 0, skipped: 'writesDisabled' };
  const status = await service.getStatus();
  if (!status.available) return { processed: 0, succeeded: 0, failed: 0, skipped: 'unavailable' };
  const result = await drainOutbox({
    loadOperations: () => getAll('healthKitOutbox'),
    service,
    shouldCancel,
    onProgress,
    markAttempt: async (operation) => {
      await put('healthKitOutbox', operation);
      await updateLocalAttempt(operation);
    },
    commitSuccess: async (operation, nativeResult) => {
      const link = await saveLink(operation, nativeResult);
      await applySuccessfulLink(operation, link);
      await del('healthKitOutbox', operation.id);
    },
    commitFailure: async (operation, message) => {
      await put('healthKitOutbox', operation);
      await applyFailedOperation(operation, message);
    },
  });
  if (result.succeeded > 0) await setSetting('lastSuccessfulHealthKitSyncAt', Date.now());
  return result;
}

async function saveLink(operation, result) {
  const existing = (await getByIndex('healthKitLinks', 'syncIdentifier', operation.syncIdentifier))[0];
  const now = Date.now();
  const link = {
    id: existing?.id ?? uuid(),
    localEntityID: operation.localEntityID,
    entityKind: operation.entityKind,
    healthKitObjectUUIDs: result.objectUUIDs ?? [],
    syncIdentifier: operation.syncIdentifier,
    syncVersion: operation.syncVersion,
    syncStatus: 'synchronized',
    createdAt: existing?.createdAt ?? now,
    lastSuccessfulSyncAt: now,
    lastAttemptAt: operation.lastAttemptAt,
    lastError: null,
    externallyDeletedOrInaccessible: false,
  };
  await put('healthKitLinks', link);
  return link;
}

async function updateLocalAttempt(operation) {
  if (operation.entityKind !== 'workout') return;
  const workout = await get('workouts', operation.localEntityID);
  if (!workout) return;
  workout.healthKitSyncStatus = 'syncing';
  workout.healthKitLastAttemptAt = operation.lastAttemptAt;
  await put('workouts', workout);
}

async function applySuccessfulLink(operation, link) {
  if (operation.entityKind === 'workout') {
    const workout = await get('workouts', operation.localEntityID);
    if (workout) {
      workout.healthKitLinkID = link.id;
      workout.healthKitSyncVersion = operation.syncVersion;
      workout.healthKitSyncStatus = 'synchronized';
      workout.healthKitLastAttemptAt = operation.lastAttemptAt;
      workout.healthKitLastError = null;
      await put('workouts', workout);
    }
  } else if (operation.entityKind === 'stateOfMind') {
    const record = await get('wellbeingEntries', operation.localEntityID);
    if (record) {
      record.stateOfMindHealthKitLinkID = link.id;
      record.stateOfMindSyncVersion = operation.syncVersion;
      delete record.localMood;
      record.updatedAt = Date.now();
      await put('wellbeingEntries', record);
    }
  } else if (['inhalerUsage', 'wheezing', 'shortnessOfBreath', 'coughing', 'chestTightnessOrPain'].includes(operation.entityKind)) {
    const event = await get('asthmaEvents', operation.localEntityID);
    if (event) {
      event.healthKitLinkIDs = [...new Set([...(event.healthKitLinkIDs ?? []), link.id])];
      const remaining = (await getByIndex('healthKitOutbox', 'localEntityID', event.id)).filter((op) => op.id !== operation.id);
      event.synchronizationSummary = remaining.length ? 'partiallySynchronized' : 'synchronized';
      delete event.localPuffs;
      delete event.localSymptoms;
      event.updatedAt = Date.now();
      await put('asthmaEvents', event);
    }
  }
}

async function applyFailedOperation(operation, message) {
  if (operation.entityKind === 'workout') {
    const workout = await get('workouts', operation.localEntityID);
    if (workout) {
      workout.healthKitSyncStatus = 'failed';
      workout.healthKitLastError = message;
      await put('workouts', workout);
    }
  } else if (['inhalerUsage', 'wheezing', 'shortnessOfBreath', 'coughing', 'chestTightnessOrPain'].includes(operation.entityKind)) {
    const event = await get('asthmaEvents', operation.localEntityID);
    if (event) {
      event.synchronizationSummary = 'failed';
      event.updatedAt = Date.now();
      await put('asthmaEvents', event);
    }
  }
}

export async function retryAllHealthKitWrites(options = {}) {
  const operations = await getAll('healthKitOutbox');
  for (const operation of operations) {
    operation.syncStatus = 'pending';
    operation.lastError = null;
    operation.requiresUserAttention = false;
    await put('healthKitOutbox', operation);
  }
  return processHealthKitOutbox(options);
}

export async function healthSyncSummary() {
  const [outbox, links, lastSuccess] = await Promise.all([
    getAll('healthKitOutbox'),
    getAll('healthKitLinks'),
    getSetting('lastSuccessfulHealthKitSyncAt', null),
  ]);
  return {
    pendingCount: outbox.filter((op) => ['pending', 'syncing'].includes(op.syncStatus)).length,
    failedCount: outbox.filter((op) => op.syncStatus === 'failed').length,
    attentionCount: outbox.filter((op) => op.requiresUserAttention).length,
    linkCount: links.length,
    lastSuccessfulSyncAt: lastSuccess,
  };
}

export async function reconcileHealthKitLinks(service = healthKitService) {
  const links = await getAll('healthKitLinks');
  if (!links.length || typeof service.reconcileLinks !== 'function') return { checked: 0 };
  const status = await service.getStatus();
  if (!status.available) return { checked: 0 };
  const results = await service.reconcileLinks(links.map((link) => ({
    syncIdentifier: link.syncIdentifier,
    entityKind: link.entityKind,
    objectUUIDs: link.healthKitObjectUUIDs,
  })));
  for (const result of results ?? []) {
    const link = links.find((candidate) => candidate.syncIdentifier === result.syncIdentifier);
    if (!link) continue;
    if (result.found) {
      link.healthKitObjectUUIDs = result.objectUUIDs ?? link.healthKitObjectUUIDs;
      link.externallyDeletedOrInaccessible = false;
      link.syncStatus = 'synchronized';
    } else if (result.definitive === true) {
      link.externallyDeletedOrInaccessible = true;
      link.syncStatus = 'externallyDeleted';
    } else {
      link.syncStatus = 'inaccessibleOrDeleted';
    }
    await put('healthKitLinks', link);
  }
  return { checked: results?.length ?? 0 };
}

export async function deleteWorkoutWithChoice(workoutID, choice, service = healthKitService) {
  const { deleteWorkoutAndSets } = await import('../db.js');
  if (choice === 'cancel') return false;
  const links = await getByIndex('healthKitLinks', 'localEntityID', workoutID);
  const workoutEffortLinks = await getByIndex('healthKitLinks', 'localEntityID', `${workoutID}:effort`);
  const knownLinks = [...links, ...workoutEffortLinks];
  if (choice === 'liftAndHealth') {
    if (knownLinks.length) {
      await service.deleteLiftObjects({
        syncIdentifiers: knownLinks.map((link) => link.syncIdentifier),
        objectUUIDs: knownLinks.flatMap((link) => link.healthKitObjectUUIDs ?? []),
      });
    }
  }
  for (const link of knownLinks) await del('healthKitLinks', link.id);
  const pending = [
    ...(await getByIndex('healthKitOutbox', 'localEntityID', workoutID)),
    ...(await getByIndex('healthKitOutbox', 'localEntityID', `${workoutID}:effort`)),
  ];
  for (const operation of pending) await del('healthKitOutbox', operation.id);
  await deleteWorkoutAndSets(workoutID);
  return true;
}
