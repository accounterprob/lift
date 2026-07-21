import { getAll, putMany, clearAll } from './db.js';
import { showSheet, showToast, emit } from './utils.js';
import { BACKUP_SCHEMA_VERSION, HEALTH_SYNC_SCHEMA_VERSION } from './health/domain.js';
import { healthKitService } from './health/service.js';

const EXTENDED_STORES = [
  'wellbeingEntries',
  'asthmaEvents',
  'healthKitLinks',
  'healthKitOutbox',
  'migrationState',
  'appSettings',
];

export async function buildSnapshot() {
  const [exercises, workouts, rawSets, ...extended] = await Promise.all([
    getAll('exercises'),
    getAll('workouts'),
    getAll('sets'),
    ...EXTENDED_STORES.map((store) => getAll(store)),
  ]);
  const hasRealRPE = rawSets.some((set) => set.rpe !== null && set.rpe !== undefined && set.rpe !== '');
  const sets = hasRealRPE
    ? rawSets
    : rawSets.map(({ rpe: _deprecatedRPE, ...set }) => set);
  const containsLocalFallbackHealthValues = workouts.some((workout) => workout.localEffort != null || workout.appleHealthShortcutStatus)
    || extended[0].some((entry) => entry.localMood != null)
    || extended[1].some((event) => event.localPuffs != null || Object.keys(event.localSymptoms ?? {}).length > 0);
  return {
    version: BACKUP_SCHEMA_VERSION,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    healthKitMigrationVersion: HEALTH_SYNC_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    manifest: {
      archiveDescription: 'This Lift backup contains all locally stored Lift data. Keep a separate Apple Health export for entries written natively or through the optional Shortcut.',
      liftOwns: ['exercises', 'workouts', 'sets', 'locally stored effort and check-in values', 'locally stored mood, inhaler, and symptom values', 'asthma notes', 'pending native synchronization payloads'],
      appleHealthOwns: ['entries successfully written by the native app', 'workout summaries created by the optional Apple Health Shortcut'],
      shortcutExportNote: 'Shortcut-created Apple Health workout summaries may also exist in Apple Health; Lift cannot read or include those Health records directly.',
      containsPendingHealthPayloads: extended[3].length > 0,
      containsLocalFallbackHealthValues,
      containsSynchronizedHealthValues: false,
    },
    exercises,
    workouts,
    sets,
    ...Object.fromEntries(EXTENDED_STORES.map((store, index) => [store, extended[index]])),
  };
}

function timestampedName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `lift-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
}

export async function downloadBackup() {
  const snapshot = await buildSnapshot();
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const filename = timestampedName();

  if (typeof healthKitService.exportBackup === 'function' && window.webkit?.messageHandlers?.liftNative) {
    try {
      await healthKitService.exportBackup(filename, json);
      return { filename, bytes: blob.size, snapshot };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);

  return { filename, bytes: blob.size, snapshot };
}

export async function restoreFromFile(file) {
  const text = await file.text();
  const snapshot = normalizeSnapshot(JSON.parse(text), { afterRestore: true });

  await clearAll();
  if (snapshot.exercises.length) await putMany('exercises', snapshot.exercises);
  if (snapshot.workouts.length) await putMany('workouts', snapshot.workouts);
  if (snapshot.sets.length) await putMany('sets', snapshot.sets);
  for (const store of EXTENDED_STORES) {
    if (snapshot[store].length) await putMany(store, snapshot[store]);
  }

  return {
    exercises: snapshot.exercises.length,
    workouts: snapshot.workouts.length,
    sets: snapshot.sets.length,
  };
}

export function normalizeSnapshot(input, { afterRestore = false } = {}) {
  if (!input || !Array.isArray(input.exercises) || !Array.isArray(input.workouts) || !Array.isArray(input.sets)) {
    throw new Error('File doesn\'t look like a Lift backup.');
  }
  const version = Number(input.schemaVersion ?? input.version ?? 1);
  if (!Number.isInteger(version) || version < 1 || version > BACKUP_SCHEMA_VERSION) {
    throw new Error(`Unsupported Lift backup schema version: ${version}.`);
  }
  const normalized = {
    ...input,
    version: BACKUP_SCHEMA_VERSION,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exercises: input.exercises.map((exercise) => ({ notes: '', ...exercise })),
    workouts: input.workouts.map((workout) => ({
      notes: '',
      healthKitLinkID: null,
      healthKitSyncVersion: 0,
      healthKitSyncStatus: 'notSynchronized',
      healthKitLastAttemptAt: null,
      healthKitLastError: null,
      ...workout,
    })),
    sets: input.sets.map((set) => ({ setType: 'working', completed: false, ...set })),
  };
  for (const store of EXTENDED_STORES) normalized[store] = Array.isArray(input[store]) ? input[store] : [];
  if (afterRestore) {
    normalized.healthKitLinks = normalized.healthKitLinks.map((link) => ({
      ...link,
      syncStatus: 'needsReconciliation',
      externallyDeletedOrInaccessible: false,
    }));
    normalized.healthKitOutbox = normalized.healthKitOutbox.map((operation) => ({
      ...operation,
      syncStatus: 'pendingReviewAfterRestore',
      requiresUserAttention: true,
      lastError: 'Review this restored HealthKit write before retrying.',
    }));
  }
  return normalized;
}

export function openBackupSheet() {
  showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="bk-close">Done</button>
        <div class="title">Backup & Restore</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Export</div>
        <div class="form-section">
          <button class="list-row button" id="bk-export">
            <div class="row-main"><div class="row-title" style="color: var(--accent);">Download Backup</div></div>
          </button>
        </div>
        <div class="section-footer">
          Saves a JSON file. In Safari on iPhone, after the download finishes tap the Downloads button → long-press the file → <b>Share → Save to Files</b> → pick <b>iCloud Drive</b>. On Mac, set Safari's download folder to iCloud Drive in Settings.
        </div>

        <div class="section-footer">
          This backup includes values stored locally by the web app. Keep it together with a separate Apple Health export if you also use the Health Shortcut or native HealthKit synchronization.
        </div>

        <div class="section">Restore</div>
        <div class="form-section">
          <button class="list-row button destructive" id="bk-import">
            <div class="row-main"><div class="row-title" style="color: var(--red);">Restore from Backup…</div></div>
          </button>
        </div>
        <div class="section-footer">
          <b>Replaces</b> all current workouts and exercises with the contents of the chosen JSON file.
        </div>

        <input type="file" id="bk-file" accept=".json,application/json" style="display: none;" />
      </div>
    `,
    onMount(sheet, dismiss) {
      sheet.querySelector('#bk-close').addEventListener('click', () => dismiss());

      sheet.querySelector('#bk-export').addEventListener('click', async () => {
        try {
          const { filename, bytes } = await downloadBackup();
          showToast(`Exported ${filename} (${formatBytes(bytes)})`);
        } catch (err) {
          showToast(`Export failed: ${err.message}`);
        }
      });

      const fileInput = sheet.querySelector('#bk-file');
      sheet.querySelector('#bk-import').addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
      });

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!confirm('Replace all current data with this backup? This cannot be undone.')) return;
        try {
          const counts = await restoreFromFile(file);
          dismiss();
          showToast(`Restored ${counts.workouts} workouts, ${counts.exercises} exercises`);
          emit('data:changed');
        } catch (err) {
          showToast(`Restore failed: ${err.message}`);
        }
      });
    },
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
