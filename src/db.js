const DB_NAME = 'lift';
const DB_VERSION = 1;

let _db = null;

export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('exercises')) {
        const s = db.createObjectStore('exercises', { keyPath: 'id' });
        s.createIndex('name', 'name', { unique: false });
        s.createIndex('category', 'category', { unique: false });
      }
      if (!db.objectStoreNames.contains('workouts')) {
        const s = db.createObjectStore('workouts', { keyPath: 'id' });
        s.createIndex('startedAt', 'startedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('sets')) {
        const s = db.createObjectStore('sets', { keyPath: 'id' });
        s.createIndex('workoutId', 'workoutId', { unique: false });
        s.createIndex('exerciseId', 'exerciseId', { unique: false });
      }
    };
  });
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function txStore(name, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}

export async function getAll(store) {
  return promisify((await txStore(store)).getAll());
}

export async function get(store, id) {
  return promisify((await txStore(store)).get(id));
}

export async function put(store, value) {
  await promisify((await txStore(store, 'readwrite')).put(value));
  return value;
}

export async function putMany(store, values) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const s = tx.objectStore(store);
    for (const v of values) s.put(v);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function del(store, id) {
  return promisify((await txStore(store, 'readwrite')).delete(id));
}

export async function clearStore(store) {
  return promisify((await txStore(store, 'readwrite')).clear());
}

export async function getByIndex(store, indexName, value) {
  const s = await txStore(store);
  return promisify(s.index(indexName).getAll(value));
}

export async function clearAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['exercises', 'workouts', 'sets'], 'readwrite');
    tx.objectStore('exercises').clear();
    tx.objectStore('workouts').clear();
    tx.objectStore('sets').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// ---------- Domain helpers ----------

export async function getActiveWorkout() {
  const workouts = await getAll('workouts');
  return workouts.find((w) => !w.endedAt) ?? null;
}

export async function getFinishedWorkouts() {
  const workouts = await getAll('workouts');
  return workouts
    .filter((w) => w.endedAt)
    .sort((a, b) => b.startedAt - a.startedAt);
}

export async function getWorkoutSets(workoutId) {
  const sets = await getByIndex('sets', 'workoutId', workoutId);
  return sets.sort((a, b) => a.order - b.order);
}

export async function getExerciseSets(exerciseId) {
  return await getByIndex('sets', 'exerciseId', exerciseId);
}

export async function lastCompletedSetForExercise(exerciseId, excludeWorkoutId = null) {
  const sets = await getExerciseSets(exerciseId);
  const candidates = sets
    .filter((s) => s.completed && (!excludeWorkoutId || s.workoutId !== excludeWorkoutId))
    .sort((a, b) => b.createdAt - a.createdAt);
  return candidates[0] ?? null;
}

export async function deleteWorkoutAndSets(workoutId) {
  const db = await openDB();
  const sets = await getByIndex('sets', 'workoutId', workoutId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['workouts', 'sets'], 'readwrite');
    tx.objectStore('workouts').delete(workoutId);
    const setStore = tx.objectStore('sets');
    for (const s of sets) setStore.delete(s.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
