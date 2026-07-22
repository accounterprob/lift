import {
  purgeCardioData, reorganizeOtherExercises, stripEquipmentFromNames,
  mergeButterflyIntoChestFly,
} from './db.js';
import { categoryFor } from './seed.js';
import { showToast } from './utils.js';

// Marks that the one-time data cleanups have finished on THIS device. Bump the
// suffix when a new cleanup is added so it runs once more everywhere.
const MIGRATIONS_KEY = 'lift-migrations-done-v1';

/**
 * The one-time data cleanups: purge the retired Cardio category, re-home the
 * retired "Other" category, strip equipment words duplicated in names, and
 * merge Butterfly into Chest Fly. Each is idempotent but scans the whole
 * database, so we don't want them on every launch — see runDataMigrationsOnce.
 * Run directly (not "once") after a restore, which brings in data that may
 * predate these cleanups.
 */
export async function runDataMigrations() {
  const purged = await purgeCardioData();
  if (purged.exercises > 0) {
    console.info(`Removed ${purged.exercises} cardio exercise(s), ${purged.sets} set(s), ${purged.workouts} cardio-only workout(s).`);
  }
  const reorg = await reorganizeOtherExercises(categoryFor);
  if (reorg.recategorized > 0 || reorg.deleted > 0) {
    console.info(`Reorganized "Other": recategorized ${reorg.recategorized}, removed ${reorg.deleted} cardio, dropped ${reorg.workouts} empty workout(s).`);
    const parts = [];
    if (reorg.recategorized > 0) parts.push(`sorted ${reorg.recategorized} exercise${reorg.recategorized === 1 ? '' : 's'}`);
    if (reorg.deleted > 0) parts.push(`removed ${reorg.deleted} cardio`);
    showToast(`Cleaned up “Other”: ${parts.join(', ')}.`);
  }
  const stripped = await stripEquipmentFromNames();
  if (stripped > 0) console.info(`Stripped equipment from ${stripped} exercise name(s).`);
  const merged = await mergeButterflyIntoChestFly();
  if (merged > 0) showToast(`Merged Butterfly into Chest Fly (${merged} sets moved).`);
}

/**
 * Launch path: run the cleanups only the first time on this device, then
 * remember it so later launches skip the whole-database scans. A restore
 * re-runs them directly (runDataMigrations), so gating here can't leave
 * imported data uncleaned.
 */
export async function runDataMigrationsOnce() {
  try {
    if (localStorage.getItem(MIGRATIONS_KEY)) return;
  } catch { /* storage blocked (private mode) — just run them */ }
  await runDataMigrations();
  try {
    localStorage.setItem(MIGRATIONS_KEY, String(Date.now()));
  } catch { /* can't persist the flag — they'll run again next launch, still safe */ }
}
