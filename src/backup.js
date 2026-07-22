import { getAll, replaceAllData } from './db.js';
import { showSheet, showToast, emit } from './utils.js';
import { runDataMigrations } from './migrations.js';

export async function buildSnapshot() {
  const [exercises, workouts, sets] = await Promise.all([
    getAll('exercises'),
    getAll('workouts'),
    getAll('sets'),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    workouts,
    sets,
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
  const snapshot = JSON.parse(text);

  if (!snapshot || !Array.isArray(snapshot.exercises) || !Array.isArray(snapshot.workouts) || !Array.isArray(snapshot.sets)) {
    throw new Error('File doesn\'t look like a Lift backup.');
  }

  await replaceAllData({
    exercises: snapshot.exercises,
    workouts: snapshot.workouts,
    sets: snapshot.sets,
  });

  // A restored backup can predate the one-time cleanups (old cardio/"Other"
  // categories, equipment-in-name), so run them now rather than relying on the
  // once-per-device launch gate.
  await runDataMigrations();

  return {
    exercises: snapshot.exercises.length,
    workouts: snapshot.workouts.length,
    sets: snapshot.sets.length,
  };
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
