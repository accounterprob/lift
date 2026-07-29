import { getAll, replaceAllData } from './db.js';
import { showSheet, showToast, emit, esc } from './utils.js';
import { runDataMigrations } from './migrations.js';
import {
  getOrCreatePassphrase, getStoredPassphrase, setStoredPassphrase,
  encryptSnapshot, decryptSnapshot, isEncryptedBackup,
} from './crypto.js';

export async function buildSnapshot() {
  const [exercises, workouts, sets, stateOfMind, medications] = await Promise.all([
    getAll('exercises'), getAll('workouts'), getAll('sets'),
    getAll('stateOfMind'), getAll('medications'),
  ]);
  return {
    // v2 added the mood + medication stores; v3 drops doseEvents, which older
    // backups may still carry (restore simply ignores them).
    version: 3,
    exportedAt: new Date().toISOString(),
    exercises, workouts, sets,
    stateOfMind, medications,
  };
}

function timestampedName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `lift-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
}

/**
 * Export an ENCRYPTED backup. The file written to disk / iCloud is an AES-GCM
 * envelope (see crypto.js) that's unreadable without the device passphrase, so
 * mood + medication data never sits in cloud storage as plaintext.
 */
export async function downloadBackup() {
  const snapshot = await buildSnapshot();
  const passphrase = getOrCreatePassphrase();
  const envelope = await encryptSnapshot(snapshot, passphrase);
  const json = JSON.stringify(envelope);
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

/** Decrypt an encrypted backup: try the device's stored passphrase, else prompt
 * (and adopt a working one so future backups on this device match). */
async function decryptBackup(envelope) {
  const stored = getStoredPassphrase();
  if (stored) {
    try { return await decryptSnapshot(envelope, stored); } catch { /* prompt below */ }
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const entered = prompt('Enter your backup password (saved in your Passwords app):');
    if (entered == null) throw new Error('Restore cancelled.');
    try {
      const snapshot = await decryptSnapshot(envelope, entered.trim());
      setStoredPassphrase(entered.trim());
      return snapshot;
    } catch (err) {
      if (attempt === 2) throw err;
      alert('Wrong password — try again.');
    }
  }
}

export async function restoreFromFile(file) {
  const parsed = JSON.parse(await file.text());
  const snapshot = isEncryptedBackup(parsed) ? await decryptBackup(parsed) : parsed;

  if (!snapshot || !Array.isArray(snapshot.exercises) || !Array.isArray(snapshot.workouts) || !Array.isArray(snapshot.sets)) {
    throw new Error('File doesn\'t look like a Lift backup.');
  }

  await replaceAllData({
    exercises: snapshot.exercises,
    workouts: snapshot.workouts,
    sets: snapshot.sets,
    stateOfMind: snapshot.stateOfMind ?? [],
    medications: snapshot.medications ?? [],
    // snapshot.doseEvents from a pre-v3 backup is intentionally dropped.
  });

  // A restored backup can predate the one-time cleanups (old cardio/"Other"
  // categories, equipment-in-name), so run them now rather than relying on the
  // once-per-device launch gate.
  await runDataMigrations();

  return {
    exercises: snapshot.exercises.length,
    workouts: snapshot.workouts.length,
    sets: snapshot.sets.length,
    stateOfMind: (snapshot.stateOfMind ?? []).length,
  };
}

export function openBackupSheet() {
  const passphrase = getOrCreatePassphrase();
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
          Saves an <b>encrypted</b> JSON file. In Safari on iPhone, after the download finishes tap the Downloads button → long-press the file → <b>Share → Save to Files</b> → pick <b>iCloud Drive</b>.
        </div>

        <div class="section">Backup password</div>
        <div class="form-section">
          <div class="stat-row">
            <div class="stat-value" id="bk-pass" style="font-variant-numeric: tabular-nums; letter-spacing: 0.5px; color: var(--text); -webkit-user-select: all; user-select: all;">${esc(passphrase)}</div>
            <button class="btn-text primary" id="bk-copy">Copy</button>
          </div>
        </div>
        <div class="section-footer">
          Your backups are encrypted with this password. <b>Save it in your Passwords app</b> — you need it to restore on another device or after reinstalling. Without it, encrypted backups can't be recovered.
        </div>

        <div class="section">Restore</div>
        <div class="form-section">
          <button class="list-row button destructive" id="bk-import">
            <div class="row-main"><div class="row-title" style="color: var(--red);">Restore from Backup…</div></div>
          </button>
        </div>
        <div class="section-footer">
          <b>Replaces</b> all current data with the chosen backup. Encrypted files prompt for the password (unless this device already has it).
        </div>

        <input type="file" id="bk-file" accept=".json,application/json" style="display: none;" />
      </div>
    `,
    onMount(sheet, dismiss) {
      sheet.querySelector('#bk-close').addEventListener('click', () => dismiss());

      sheet.querySelector('#bk-copy').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(passphrase); showToast('Password copied — save it in your Passwords app'); }
        catch { showToast('Copy failed — long-press the password to select it'); }
      });

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
