import { getAll, getMeta, setMeta, replaceAllData } from './db.js';
import { showSheet, showToast, emit, formatDateLong } from './utils.js';
import { runDataMigrations } from './migrations.js';
import { getStoredPassphrase, decryptSnapshot, isEncryptedBackup } from './crypto.js';
import { BACKUP_VERSION, validateSnapshot } from './validate.js';

// Device-local copy of the data as it stood before the last restore.
const RECOVERY_KEY = 'pre-restore-data';

export async function buildSnapshot() {
  const [exercises, workouts, sets] = await Promise.all([
    getAll('exercises'), getAll('workouts'), getAll('sets'),
  ]);
  return {
    // v4 drops the mood + medication stores. Older backups may still carry
    // stateOfMind / medications / doseEvents; restore simply ignores them.
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    exercises, workouts, sets,
  };
}

function timestampedName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `lift-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
}

/** Export a plain JSON backup of the whole database. */
export async function downloadBackup() {
  const snapshot = await buildSnapshot();
  const json = JSON.stringify(snapshot);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const filename = timestampedName();
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

/** Decrypt an old encrypted backup: try the passphrase an older install left
 * on this device, else prompt. */
async function decryptBackup(envelope) {
  const stored = await getStoredPassphrase();
  if (stored) {
    try { return await decryptSnapshot(envelope, stored); } catch { /* prompt below */ }
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const asked = ui.prompt('It\'s saved in your Passwords app.', { title: 'Backup password', ok: 'Unlock' });
    // The kit's prompt field is plain text; mask it, since this is a password.
    const field = document.querySelector('dialog.ui-modal[open] .ui-modal-input');
    if (field) { field.type = 'password'; field.autocomplete = 'current-password'; }
    const entered = await asked;
    if (entered == null) throw new Error('Restore cancelled.');
    try {
      return await decryptSnapshot(envelope, entered.trim());
    } catch (err) {
      if (attempt === 2) throw err;
      await ui.alert('', { title: 'Wrong password', ok: 'Try again' });
    }
  }
}

export async function restoreFromFile(file) {
  const parsed = JSON.parse(await file.text());
  const snapshot = isEncryptedBackup(parsed) ? await decryptBackup(parsed) : parsed;

  validateSnapshot(snapshot);
  return replaceWith(snapshot);
}

/** Put back the data from just before the last restore (a restore itself, so it can be reversed too). */
export async function undoLastRestore() {
  const copy = await getMeta(RECOVERY_KEY);
  if (!copy) throw new Error('No earlier data saved.');
  return replaceWith(copy);
}

/**
 * Swap the whole database for `snapshot`, keeping a copy of what was there. If
 * the cleanups fail partway the old data goes straight back, so "Restore
 * failed" always means nothing changed. Returns what actually survived them.
 */
async function replaceWith(snapshot) {
  const current = await buildSnapshot();
  await setMeta(RECOVERY_KEY, current);

  // Mood / medication data in a pre-v4 backup is intentionally dropped.
  await replaceAllData({
    exercises: snapshot.exercises,
    workouts: snapshot.workouts,
    sets: snapshot.sets,
  });

  // A restored backup can predate the one-time cleanups (old cardio/"Other"
  // categories, equipment-in-name), so run them now rather than relying on the
  // once-per-device launch gate.
  try {
    await runDataMigrations();
  } catch (err) {
    await replaceAllData(current);
    throw new Error(`${err.message} Your data was not changed.`);
  }

  const [exercises, workouts, sets] = await Promise.all([
    getAll('exercises'), getAll('workouts'), getAll('sets'),
  ]);
  return { exercises: exercises.length, workouts: workouts.length, sets: sets.length };
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
          Saves a JSON file. In Safari on iPhone, after the download finishes tap the Downloads button → long-press the file → <b>Share → Save to Files</b> → pick <b>iCloud Drive</b>.
        </div>

        <div class="section">Restore</div>
        <div class="form-section">
          <button class="list-row button destructive" id="bk-import">
            <div class="row-main"><div class="row-title" style="color: var(--red);">Restore from Backup…</div></div>
          </button>
        </div>
        <div class="section-footer">
          <b>Replaces</b> all current data with the chosen backup. Older encrypted backups ask for their password.
        </div>

        <div id="bk-undo-wrap" hidden>
          <div class="form-section">
            <button class="list-row button" id="bk-undo">
              <div class="row-main"><div class="row-title" style="color: var(--accent);">Undo Last Restore</div></div>
            </button>
          </div>
          <div class="section-footer" id="bk-undo-note"></div>
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
        if (!(await ui.confirm('Replaces all current data. You can put it back with Undo Last Restore.', { title: 'Restore this backup?', ok: 'Restore', danger: true }))) return;
        try {
          const counts = await restoreFromFile(file);
          dismiss();
          showToast(`Restored ${counts.workouts} workouts, ${counts.exercises} exercises`);
          emit('data:changed');
        } catch (err) {
          showToast(`Restore failed: ${err.message}`);
        }
      });

      getMeta(RECOVERY_KEY).then((copy) => {
        if (!copy) return;
        sheet.querySelector('#bk-undo-wrap').hidden = false;
        sheet.querySelector('#bk-undo-note').textContent =
          `Puts back your ${copy.workouts.length} workouts from before the last restore (${formatDateLong(Date.parse(copy.exportedAt))}).`;
      }).catch(() => { /* nothing to offer */ });

      sheet.querySelector('#bk-undo').addEventListener('click', async () => {
        if (!(await ui.confirm('Puts back the data from before the last restore, replacing what\'s here now.', { title: 'Undo last restore?', ok: 'Undo restore', danger: true }))) return;
        try {
          const counts = await undoLastRestore();
          dismiss();
          showToast(`Put back ${counts.workouts} workouts, ${counts.exercises} exercises`);
          emit('data:changed');
        } catch (err) {
          showToast(`Undo failed: ${err.message}`);
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
