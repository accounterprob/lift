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

/**
 * Sets from the most recent prior workout that contains this exercise,
 * ordered by `order` ASC. Used to show "Previous" hints in the active workout.
 * Doesn't require endedAt to be set — that filter was excluding legitimate
 * imported data where the source CSV had no end time.
 */
export async function previousWorkoutSetsForExercise(exerciseId, excludeWorkoutId = null) {
  const allSets = await getExerciseSets(exerciseId);
  const byWorkout = new Map();
  for (const s of allSets) {
    if (excludeWorkoutId && s.workoutId === excludeWorkoutId) continue;
    if (!byWorkout.has(s.workoutId)) byWorkout.set(s.workoutId, []);
    byWorkout.get(s.workoutId).push(s);
  }
  if (byWorkout.size === 0) return [];

  const workouts = await Promise.all(
    Array.from(byWorkout.keys()).map((id) => get('workouts', id))
  );
  const candidates = workouts
    .filter(Boolean)
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  if (candidates.length === 0) return [];

  return byWorkout.get(candidates[0].id).sort((a, b) => a.order - b.order);
}

/**
 * For every set "slot" (type + position-within-type) each exercise has ever
 * had, find the matching set from the most recent prior workout that actually
 * contains that slot. Walks workouts newest→oldest, so e.g. set 5 falls back to
 * an older workout when the last one only had 4 sets, while sets 1–4 still come
 * from the latest. Warmups fall back independently of working sets. Returns a
 * Map of exerciseId → slot Map keyed `${type}#${position}` (1-indexed). Slots
 * no prior workout ever had simply won't be present — a genuinely new set →
 * blank PREV.
 *
 * Only real, performed sets participate (weight > 0 and reps > 0): leftover
 * prefilled rows like 155×0 would otherwise occupy a slot and mask genuine
 * history in older workouts.
 *
 * Imported HEVY data and workouts that predate warmup flags have no setType on
 * any set, so their warmups are indistinguishable from working sets. Those
 * typeless workouts must NOT claim typed slots (a warmup-weight set would
 * wrongly become working#1 once the current workout has warmups); they're
 * indexed only by absolute position (`any#n`), which lookups fall back to when
 * no typed history has a slot.
 *
 * Pure function over pre-loaded data so one getAll('sets')/getAll('workouts')
 * serves every exercise in the workout.
 */
export function buildPrevSlotMaps(allSets, allWorkouts, excludeWorkoutId = null) {
  const startedAt = new Map(allWorkouts.map((w) => [w.id, w.startedAt ?? 0]));
  // exerciseId → workoutId → sets
  const byExercise = new Map();
  for (const s of allSets) {
    if (s.workoutId === excludeWorkoutId || !startedAt.has(s.workoutId)) continue;
    if ((s.weight || 0) <= 0 || (s.reps || 0) <= 0) continue;
    let byW = byExercise.get(s.exerciseId);
    if (!byW) byExercise.set(s.exerciseId, (byW = new Map()));
    let arr = byW.get(s.workoutId);
    if (!arr) byW.set(s.workoutId, (arr = []));
    arr.push(s);
  }

  const maps = new Map();
  for (const [exerciseId, byW] of byExercise) {
    const orderedWids = [...byW.keys()].sort((a, b) => startedAt.get(b) - startedAt.get(a));
    const result = new Map();
    for (const wid of orderedWids) {
      const sets = byW.get(wid).sort((a, b) => a.order - b.order);
      const isTypeless = sets.every((s) => s.setType == null);
      let working = 0;
      let warmup = 0;
      sets.forEach((s, i) => {
        if (isTypeless) {
          const anyKey = `any#${i + 1}`;
          if (!result.has(anyKey)) result.set(anyKey, s);
          return;
        }
        const type = s.setType || 'working';
        const pos = type === 'warmup' ? (warmup += 1) : (working += 1);
        const key = `${type}#${pos}`;
        if (!result.has(key)) result.set(key, s);  // newest workout wins per slot
      });
    }
    maps.set(exerciseId, result);
  }
  return maps;
}

/**
 * One-time cleanup: exercise names like "Preacher Curl (Barbell)" or
 * "Seated Row Machine" duplicate the equipment field. Strip the trailing
 * equipment marker from the name and sync the equipment field from it (the
 * name's marker is the more specific source, e.g. HEVY imports). Only plain
 * equipment words are stripped — meaningful variants like "(Smith Machine)",
 * "(Sumo)", "(Seated)", or "Dip (Chest)" stay in the name. Idempotent.
 * The UI derives the "(Barbell)" suffix from the equipment field instead.
 */
const EQUIPMENT_WORDS = {
  barbell: 'Barbell', dumbbell: 'Dumbbell', machine: 'Machine', cable: 'Cable',
  bodyweight: 'Bodyweight', kettlebell: 'Kettlebell', band: 'Bands', bands: 'Bands',
};
const EQUIP_SUFFIX = /\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|bands?)\)$|\s+(Machine|Barbell|Dumbbell|Cable|Kettlebell)$/i;

export async function stripEquipmentFromNames() {
  const exercises = await getAll('exercises');
  const toUpdate = [];
  for (const e of exercises) {
    const m = (e.name || '').match(EQUIP_SUFFIX);
    if (!m) continue;
    const stripped = e.name.slice(0, m.index).trim();
    if (!stripped) continue;         // never blank a name (e.g. an exercise just called "Machine")
    if (/smith$/i.test(stripped)) continue;  // "Smith Machine" is a variant, not redundancy
    const word = (m[1] || m[2]).toLowerCase();
    toUpdate.push({ ...e, name: stripped, equipment: EQUIPMENT_WORDS[word] || e.equipment });
  }
  if (toUpdate.length > 0) await putMany('exercises', toUpdate);
  return toUpdate.length;
}

/**
 * Removes built-in exercises that have never been used (no associated sets).
 * Custom user-created exercises are always preserved, even if unused.
 */
export async function deleteUnusedExercises() {
  const [exercises, sets] = await Promise.all([
    getAll('exercises'),
    getAll('sets'),
  ]);
  const usedIds = new Set(sets.map((s) => s.exerciseId));

  const toDelete = exercises.filter((e) => !usedIds.has(e.id) && !e.isCustom);
  for (const e of toDelete) {
    await del('exercises', e.id);
  }
  return {
    deleted: toDelete.length,
    kept: exercises.length - toDelete.length,
  };
}

/**
 * One-time cleanup for the retired "Cardio" category: deletes every exercise
 * filed under it along with all sets logged against those exercises. Idempotent
 * and cheap — a no-op once no cardio data remains, so it's safe to run on every
 * launch (which also scrubs cardio out of any restored backup).
 */
export async function purgeCardioData() {
  const [exercises, sets, workouts] = await Promise.all([
    getAll('exercises'),
    getAll('sets'),
    getAll('workouts'),
  ]);
  const cardioIds = new Set(
    exercises.filter((e) => e.category === 'Cardio').map((e) => e.id)
  );
  if (cardioIds.size === 0) return { exercises: 0, sets: 0, workouts: 0 };

  const setsToDelete = sets.filter((s) => cardioIds.has(s.exerciseId));

  // Workouts whose every set was cardio become empty shells once those sets
  // go — drop them too. Mixed workouts keep their non-cardio sets and survive.
  const nonCardioByWorkout = new Map();
  for (const s of sets) {
    if (cardioIds.has(s.exerciseId)) continue;
    nonCardioByWorkout.set(s.workoutId, (nonCardioByWorkout.get(s.workoutId) || 0) + 1);
  }
  const affectedWorkouts = new Set(setsToDelete.map((s) => s.workoutId));
  const workoutsToDelete = workouts.filter(
    (w) => affectedWorkouts.has(w.id) && !nonCardioByWorkout.get(w.id)
  );

  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(['exercises', 'sets', 'workouts'], 'readwrite');
    const exStore = tx.objectStore('exercises');
    const setStore = tx.objectStore('sets');
    const woStore = tx.objectStore('workouts');
    for (const id of cardioIds) exStore.delete(id);
    for (const s of setsToDelete) setStore.delete(s.id);
    for (const w of workoutsToDelete) woStore.delete(w.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return { exercises: cardioIds.size, sets: setsToDelete.length, workouts: workoutsToDelete.length };
}

/**
 * Empties out the retired "Other" category. Cardio movements filed there are
 * deleted (with their sets, and any workout left with nothing else), and every
 * other movement is reassigned to its best-fit category via `classify(name)`,
 * which returns a target category or 'Cardio' to signal deletion. Idempotent —
 * a no-op once nothing remains under "Other".
 */
export async function reorganizeOtherExercises(classify) {
  const [exercises, sets, workouts] = await Promise.all([
    getAll('exercises'),
    getAll('sets'),
    getAll('workouts'),
  ]);
  const others = exercises.filter((e) => e.category === 'Other');
  if (others.length === 0) return { recategorized: 0, deleted: 0, workouts: 0 };

  const toUpdate = [];
  const deleteIds = new Set();
  for (const e of others) {
    const target = classify(e.name);
    if (target === 'Cardio') deleteIds.add(e.id);
    else toUpdate.push({ ...e, category: target && target !== 'Other' ? target : 'Full Body' });
  }

  const setsToDelete = sets.filter((s) => deleteIds.has(s.exerciseId));
  // Workouts whose every set belonged to a deleted cardio movement become empty
  // shells — drop them too. Anything with a surviving set stays.
  const survivingByWorkout = new Map();
  for (const s of sets) {
    if (deleteIds.has(s.exerciseId)) continue;
    survivingByWorkout.set(s.workoutId, (survivingByWorkout.get(s.workoutId) || 0) + 1);
  }
  const affected = new Set(setsToDelete.map((s) => s.workoutId));
  const workoutsToDelete = workouts.filter(
    (w) => affected.has(w.id) && !survivingByWorkout.get(w.id)
  );

  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(['exercises', 'sets', 'workouts'], 'readwrite');
    const exStore = tx.objectStore('exercises');
    const setStore = tx.objectStore('sets');
    const woStore = tx.objectStore('workouts');
    for (const e of toUpdate) exStore.put(e);
    for (const id of deleteIds) exStore.delete(id);
    for (const s of setsToDelete) setStore.delete(s.id);
    for (const w of workoutsToDelete) woStore.delete(w.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return { recategorized: toUpdate.length, deleted: deleteIds.size, workouts: workoutsToDelete.length };
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
