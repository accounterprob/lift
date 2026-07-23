// Client-side backup encryption. Backups are AES-256-GCM encrypted with a key
// derived (PBKDF2) from a passphrase, so the JSON file that lands in iCloud
// Drive is unreadable scrambled text without it. The passphrase is generated
// once, cached on-device for silent daily backups, and shown to the user to
// save in their Passwords app as the recovery key (needed to restore on
// another device). All crypto is the browser's built-in SubtleCrypto — no
// libraries, works offline, requires a secure context (https / localhost).

const PASSPHRASE_KEY = 'lift-backup-passphrase';
const PBKDF2_ITERATIONS = 250000;
// Unambiguous alphabet (no 0/O/1/I/l) for a human-copyable recovery key.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** A strong random recovery key, grouped for readability: XXXXX-XXXXX-XXXXX-XXXXX. */
export function generatePassphrase() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]);
  return [0, 5, 10, 15].map((i) => chars.slice(i, i + 5).join('')).join('-');
}

/**
 * The device's backup passphrase, generated and cached on first use so daily
 * backups encrypt silently. Its durable home is the user's Passwords app; this
 * cached copy is only for convenience and is never written into a backup.
 */
export function getOrCreatePassphrase() {
  let p = null;
  try { p = localStorage.getItem(PASSPHRASE_KEY); } catch { /* private mode */ }
  if (!p) {
    p = generatePassphrase();
    try { localStorage.setItem(PASSPHRASE_KEY, p); } catch { /* not persisted; still usable this session */ }
  }
  return p;
}

/** Read the cached passphrase without creating one (null if none yet). */
export function getStoredPassphrase() {
  try { return localStorage.getItem(PASSPHRASE_KEY); } catch { return null; }
}

/** Adopt a passphrase as this device's key (e.g. after restoring on a new device). */
export function setStoredPassphrase(passphrase) {
  try { localStorage.setItem(PASSPHRASE_KEY, passphrase); } catch { /* ignore */ }
}

async function deriveKey(passphrase, salt) {
  const base = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** True if a parsed backup is one of our encrypted envelopes. */
export function isEncryptedBackup(obj) {
  return !!obj && obj.lift === 'encrypted-backup' && typeof obj.data === 'string';
}

/** Encrypt a snapshot object → a self-describing envelope safe to write to disk. */
export async function encryptSnapshot(snapshot, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(snapshot));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return {
    lift: 'encrypted-backup',
    v: 1,
    exportedAt: new Date().toISOString(),
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: PBKDF2_ITERATIONS, salt: b64(salt) },
    cipher: 'AES-GCM',
    iv: b64(iv),
    data: b64(cipher),
  };
}

/**
 * Decrypt an envelope back to the snapshot object. Throws if the passphrase is
 * wrong or the file is corrupt (AES-GCM authentication fails).
 */
export async function decryptSnapshot(envelope, passphrase) {
  const salt = unb64(envelope.kdf.salt);
  const iv = unb64(envelope.iv);
  const key = await deriveKey(passphrase, salt);
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, unb64(envelope.data));
  } catch {
    throw new Error('Wrong backup password (or the file is damaged).');
  }
  return JSON.parse(new TextDecoder().decode(plain));
}
