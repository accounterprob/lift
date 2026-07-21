import test from 'node:test';
import assert from 'node:assert/strict';
import { makeOutboxOperation, stableSyncIdentifier } from '../src/health/domain.js';
import { drainOutbox } from '../src/health/outbox-runner.js';
import { FakeHealthKitService } from '../src/health/service.js';

function harness(initial, service) {
  let operations = structuredClone(initial);
  const links = [];
  return {
    operations: () => operations,
    links,
    run: (shouldCancel = () => false) => drainOutbox({
      loadOperations: async () => operations,
      service,
      shouldCancel,
      markAttempt: async (operation) => { operations = operations.map((item) => item.id === operation.id ? structuredClone(operation) : item); },
      commitSuccess: async (operation, result) => {
        links.push({ syncIdentifier: operation.syncIdentifier, objectUUIDs: result.objectUUIDs });
        operations = operations.filter((item) => item.id !== operation.id);
      },
      commitFailure: async (operation) => { operations = operations.map((item) => item.id === operation.id ? structuredClone(operation) : item); },
    }),
  };
}

test('workout dependency is saved before effort and successful payloads are purged', async () => {
  const workout = makeOutboxOperation({ id: 'workout-op', localEntityID: 'w', operationType: 'saveWorkout', entityKind: 'workout', syncIdentifier: stableSyncIdentifier('workout', 'w'), payload: { start: 1, end: 2 } });
  const effort = makeOutboxOperation({ id: 'effort-op', localEntityID: 'w:effort', operationType: 'saveWorkoutEffort', entityKind: 'workoutEffort', syncIdentifier: stableSyncIdentifier('workoutEffort', 'w:effort'), dependencyIDs: ['workout-op'], payload: { value: 8, workoutSyncIdentifier: workout.syncIdentifier } });
  const service = new FakeHealthKitService();
  const store = harness([effort, workout], service);
  const result = await store.run();
  assert.deepEqual(result, { processed: 2, succeeded: 2, failed: 0, canceled: false });
  assert.equal(store.operations().length, 0);
  assert.equal(service.relationships[0].workoutSyncIdentifier, workout.syncIdentifier);
});

test('failed payload is retained for retry', async () => {
  const operation = makeOutboxOperation({ id: 'bad', localEntityID: 'e', operationType: 'saveInhalerUsage', entityKind: 'inhalerUsage', syncIdentifier: stableSyncIdentifier('inhalerUsage', 'e'), payload: { puffs: 1 } });
  const service = new FakeHealthKitService({ failures: new Map([['bad', new Error('permission')]]) });
  const store = harness([operation], service);
  const result = await store.run();
  assert.equal(result.failed, 1);
  assert.equal(store.operations().length, 1);
  assert.equal(store.operations()[0].syncStatus, 'failed');
  assert.equal(store.operations()[0].attemptCount, 1);
});

test('same sync identifier is idempotent and higher version replaces it', async () => {
  const service = new FakeHealthKitService();
  const base = { id: 'a', localEntityID: 'w', operationType: 'saveWorkout', entityKind: 'workout', syncIdentifier: stableSyncIdentifier('workout', 'w'), payload: { start: 1, end: 2 } };
  await service.performOperation({ ...base, syncVersion: 1 });
  await service.performOperation({ ...base, id: 'b', syncVersion: 1 });
  assert.equal(service.objects.size, 1);
  await service.performOperation({ ...base, id: 'c', syncVersion: 2, payload: { start: 1, end: 3 } });
  assert.equal(service.objects.size, 1);
  assert.equal(service.objects.get(base.syncIdentifier).syncVersion, 2);
});

test('cancellation leaves a resumable outbox', async () => {
  const operation = makeOutboxOperation({ id: 'one', localEntityID: 'w', operationType: 'saveWorkout', entityKind: 'workout', syncIdentifier: stableSyncIdentifier('workout', 'w'), payload: { start: 1, end: 2 } });
  const store = harness([operation], new FakeHealthKitService());
  const result = await store.run(() => true);
  assert.equal(result.canceled, true);
  assert.equal(store.operations().length, 1);
});

test('partial failure preserves successful imports and only retains the failed payload', async () => {
  const first = makeOutboxOperation({ id: 'first', localEntityID: 'a', operationType: 'saveWorkout', entityKind: 'workout', syncIdentifier: stableSyncIdentifier('workout', 'a'), payload: { start: 1, end: 2 } });
  const second = makeOutboxOperation({ id: 'second', localEntityID: 'b', operationType: 'saveWorkout', entityKind: 'workout', syncIdentifier: stableSyncIdentifier('workout', 'b'), payload: { start: 3, end: 4 } });
  const service = new FakeHealthKitService({ failures: new Map([['second', new Error('permission denied')]]) });
  const store = harness([first, second], service);
  const result = await store.run();
  assert.equal(result.succeeded, 1);
  assert.equal(result.failed, 1);
  assert.deepEqual(store.operations().map((operation) => operation.id), ['second']);
  assert.equal(service.objects.has(first.syncIdentifier), true);
});

test('skipping effort creates no effort sample or relationship', async () => {
  const service = new FakeHealthKitService();
  const workout = makeOutboxOperation({ id: 'workout', localEntityID: 'w', operationType: 'saveWorkout', entityKind: 'workout', syncIdentifier: stableSyncIdentifier('workout', 'w'), payload: { start: 1, end: 2 } });
  const store = harness([workout], service);
  await store.run();
  assert.equal([...service.objects.values()].some((object) => object.entityKind === 'workoutEffort'), false);
  assert.equal(service.relationships.length, 0);
});

test('workout payload duration is represented only by its exact start and end', async () => {
  const service = new FakeHealthKitService();
  const operation = makeOutboxOperation({ id: 'w', localEntityID: 'w', operationType: 'saveWorkout', entityKind: 'workout', syncIdentifier: stableSyncIdentifier('workout', 'w'), payload: { start: 100, end: 3_700, activityType: 'traditionalStrengthTraining' } });
  await service.performOperation(operation);
  const payload = service.objects.get(operation.syncIdentifier).payload;
  assert.equal(payload.end - payload.start, 3_600);
  for (const invented of ['duration', 'calories', 'distance', 'heartRate']) assert.equal(invented in payload, false);
});

test('external deletion remains deleted until an explicit write is performed', async () => {
  const service = new FakeHealthKitService();
  const operation = makeOutboxOperation({ id: 'w', localEntityID: 'w', operationType: 'saveWorkout', entityKind: 'workout', syncIdentifier: stableSyncIdentifier('workout', 'w'), payload: { start: 1, end: 2 } });
  await service.performOperation(operation);
  await service.deleteLiftObjects({ syncIdentifiers: [operation.syncIdentifier] });
  const [result] = await service.reconcileLinks([{ syncIdentifier: operation.syncIdentifier }]);
  assert.equal(result.found, false);
  assert.equal(service.objects.size, 0);
});

test('one asthma action can use one event ID across exact selected sample kinds', async () => {
  const service = new FakeHealthKitService();
  const kinds = ['inhalerUsage', 'wheezing', 'shortnessOfBreath'];
  for (const kind of kinds) {
    await service.performOperation(makeOutboxOperation({
      id: kind,
      localEntityID: 'event-1',
      operationType: kind === 'inhalerUsage' ? 'saveInhalerUsage' : 'saveRespiratorySymptom',
      entityKind: kind,
      syncIdentifier: stableSyncIdentifier(kind, 'event-1'),
      payload: { asthmaEventID: 'event-1', ...(kind === 'inhalerUsage' ? { puffs: 2 } : { symptom: kind, severity: 'mild' }) },
    }));
  }
  assert.deepEqual([...service.objects.values()].map((object) => object.payload.asthmaEventID), ['event-1', 'event-1', 'event-1']);
  assert.equal(service.objects.has(stableSyncIdentifier('coughing', 'event-1')), false);
});
