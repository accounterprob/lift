import { HEALTH_ENTITY_KINDS } from './domain.js';

export class HealthKitService {
  async getStatus() { throw new Error('Not implemented'); }
  async requestAuthorization() { throw new Error('Not implemented'); }
  async performOperation(_operation) { throw new Error('Not implemented'); }
  async queryWorkouts(_range) { throw new Error('Not implemented'); }
  async queryRecentRespiratoryEvents() { throw new Error('Not implemented'); }
  async queryStateOfMind(_syncIdentifier) { throw new Error('Not implemented'); }
  async deleteLiftObjects(_request) { throw new Error('Not implemented'); }
  async reconcileLinks(_links) { throw new Error('Not implemented'); }
  async openSettings() { throw new Error('Not implemented'); }
  async configureReminder(_configuration) { throw new Error('Not implemented'); }
}

class NativeBridge {
  constructor() {
    this.pending = new Map();
    this.onResponse = (event) => {
      const response = event.detail ?? {};
      const entry = this.pending.get(response.id);
      if (!entry) return;
      this.pending.delete(response.id);
      clearTimeout(entry.timer);
      if (response.ok) entry.resolve(response.result);
      else {
        const error = new Error(response.error?.message || 'The native operation failed.');
        error.code = response.error?.code;
        entry.reject(error);
      }
    };
    if (typeof window !== 'undefined') window.addEventListener('lift:native-response', this.onResponse);
  }

  get available() {
    return typeof window !== 'undefined' && Boolean(window.webkit?.messageHandlers?.liftNative);
  }

  request(action, payload = {}) {
    if (!this.available) return Promise.reject(Object.assign(new Error('Apple Health requires the native Lift app.'), { code: 'nativeUnavailable' }));
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(Object.assign(new Error('The native operation timed out.'), { code: 'timeout' }));
      }, 45000);
      this.pending.set(id, { resolve, reject, timer });
      window.webkit.messageHandlers.liftNative.postMessage({ id, action, payload });
    });
  }
}

export class NativeHealthKitService extends HealthKitService {
  constructor(bridge = new NativeBridge()) {
    super();
    this.bridge = bridge;
  }
  get nativeAvailable() { return this.bridge.available; }
  async getStatus() {
    if (!this.bridge.available) {
      return {
        available: false,
        nativeApp: false,
        writesEnabled: false,
        authorization: Object.fromEntries(HEALTH_ENTITY_KINDS.map((kind) => [kind, 'unavailable'])),
        message: 'Apple Health is unavailable in the browser version. Install and open the native Lift app to connect.',
      };
    }
    return this.bridge.request('health.status');
  }
  requestAuthorization() { return this.bridge.request('health.authorize'); }
  performOperation(operation) { return this.bridge.request('health.performOperation', operation); }
  queryWorkouts(range) { return this.bridge.request('health.queryWorkouts', range); }
  queryRecentRespiratoryEvents() { return this.bridge.request('health.queryRecentRespiratoryEvents'); }
  queryStateOfMind(syncIdentifier) { return this.bridge.request('health.queryStateOfMind', { syncIdentifier }); }
  deleteLiftObjects(request) { return this.bridge.request('health.deleteLiftObjects', request); }
  reconcileLinks(links) { return this.bridge.request('health.reconcileLinks', { links }); }
  openSettings() { return this.bridge.request('app.openSettings'); }
  configureReminder(configuration) { return this.bridge.request('notifications.configureReminder', configuration); }
  exportBackup(filename, json) { return this.bridge.request('files.exportBackup', { filename, json }); }
}

export class FakeHealthKitService extends HealthKitService {
  constructor({ available = true, failures = new Map() } = {}) {
    super();
    this.available = available;
    this.failures = failures;
    this.objects = new Map();
    this.relationships = [];
    this.deleted = [];
    this.authorizationRequested = false;
  }
  get nativeAvailable() { return this.available; }
  async getStatus() {
    return {
      available: this.available,
      nativeApp: true,
      writesEnabled: true,
      authorization: Object.fromEntries(HEALTH_ENTITY_KINDS.map((kind) => [kind, this.available ? 'sharingAuthorized' : 'unavailable'])),
    };
  }
  async requestAuthorization() {
    this.authorizationRequested = true;
    return this.getStatus();
  }
  async performOperation(operation) {
    const failure = this.failures.get(operation.id) ?? this.failures.get(operation.operationType);
    if (failure) throw failure;
    const existing = this.objects.get(operation.syncIdentifier);
    if (!existing || Number(operation.syncVersion) > Number(existing.syncVersion)) {
      this.objects.set(operation.syncIdentifier, {
        uuid: existing?.uuid ?? `fake-${operation.syncIdentifier}`,
        syncIdentifier: operation.syncIdentifier,
        syncVersion: operation.syncVersion,
        operationType: operation.operationType,
        entityKind: operation.entityKind,
        payload: structuredClone(operation.payload),
        createdByLift: true,
      });
    }
    const object = this.objects.get(operation.syncIdentifier);
    if (operation.operationType === 'saveWorkoutEffort') {
      this.relationships.push({ effortSyncIdentifier: operation.syncIdentifier, workoutSyncIdentifier: operation.payload.workoutSyncIdentifier });
    }
    return { objectUUIDs: [object.uuid], syncIdentifier: object.syncIdentifier, syncVersion: object.syncVersion };
  }
  async queryWorkouts({ start = 0, end = Number.MAX_SAFE_INTEGER } = {}) {
    return [...this.objects.values()]
      .filter((object) => object.entityKind === 'workout')
      .filter((object) => object.payload.start >= start && object.payload.end <= end)
      .map((object) => ({ ...object, start: object.payload.start, end: object.payload.end }));
  }
  async queryRecentRespiratoryEvents() { return []; }
  async queryStateOfMind(syncIdentifier) {
    const object = this.objects.get(syncIdentifier);
    return object
      ? { found: true, valence: object.payload.valence, timestamp: object.payload.timestamp }
      : { found: false };
  }
  async deleteLiftObjects({ syncIdentifiers = [] }) {
    for (const identifier of syncIdentifiers) {
      const object = this.objects.get(identifier);
      if (object) this.deleted.push(object);
      this.objects.delete(identifier);
    }
    return { deletedCount: this.deleted.length };
  }
  async reconcileLinks(links) {
    return links.map((link) => {
      const object = this.objects.get(link.syncIdentifier);
      return {
        syncIdentifier: link.syncIdentifier,
        found: Boolean(object),
        definitive: true,
        objectUUIDs: object ? [object.uuid] : [],
      };
    });
  }
  async openSettings() { return { opened: true }; }
  async configureReminder(configuration) { return configuration; }
}

export const healthKitService = new NativeHealthKitService();
