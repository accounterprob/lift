// Client-side backup encryption. Backups are AES-256-GCM encrypted with a key
// derived (PBKDF2) from a passphrase, so the JSON file that lands in iCloud
// Drive is unreadable scrambled text without it. The passphrase is generated
// once, cached on-device for silent daily backups, and shown to the user to
// save in their Passwords app as the recovery key (needed to restore on
// another device). All crypto is the browser's built-in SubtleCrypto — no
// libraries, works offline, requires a secure context (https / localhost).

import { getMeta, setMeta } from './db.js';

const PASSPHRASE_KEY = 'lift-backup-passphrase';
const PBKDF2_ITERATIONS = 250000;
// Unambiguous alphabet (no 0/O/1/I/l) for a human-copyable recovery key.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Base64-encode in 32 KB chunks. A naive String.fromCharCode(...bytes) spreads
// the whole array into arguments and overflows the call-stack / argument limit
// on Safari once a backup is more than ~64 KB — which real histories easily are.
function b64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** A strong random recovery key, grouped for readability: XXXXX-XXXXX-XXXXX-XXXXX. */
export function generatePassphrase() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]);
  return [0, 5, 10, 15].map((i) => chars.slice(i, i + 5).join('')).join('-');
}

// Resolved passphrase for this session. Populated by ensurePassphrase() at
// launch so the synchronous accessors below can't be caught without a value.
let cached = null;

const readLocal = () => {
  try { return localStorage.getItem(PASSPHRASE_KEY); } catch { return null; }
};
const writeLocal = (p) => {
  try { localStorage.setItem(PASSPHRASE_KEY, p); } catch { /* private mode */ }
};

/**
 * Settle this device's backup passphrase, once, at launch.
 *
 * The passphrase is generated only when the device genuinely has none — it is
 * never rotated on its own, because a silent change would leave every existing
 * backup decryptable only by a password the user no longer sees.
 *
 * It is kept in TWO places: localStorage (fast, synchronous) and the appMeta
 * store in IndexedDB (durable). localStorage alone was not enough — Safari can
 * evict or clear it independently of IndexedDB, and a device that still had all
 * its data would then quietly start encrypting new backups under a new key.
 * Whichever copy survives repopulates the other.
 */
export async function ensurePassphrase() {
  if (cached) return cached;
  const local = readLocal();
  let stored = null;
  try { stored = await getMeta(PASSPHRASE_KEY); } catch { /* DB unavailable */ }

  // localStorage wins when both exist: it is what this device has been
  // encrypting with. Otherwise adopt whichever copy survived, and only mint a
  // new passphrase when neither does.
  cached = local || stored || generatePassphrase();

  if (cached !== local) writeLocal(cached);
  if (cached !== stored) {
    try { await setMeta(PASSPHRASE_KEY, cached); } catch { /* stays in localStorage */ }
  }
  return cached;
}

/**
 * The device's backup passphrase. Synchronous for callers that render it
 * directly; ensurePassphrase() has normally already resolved it at launch.
 */
export function getOrCreatePassphrase() {
  if (cached) return cached;
  let p = readLocal();
  if (!p) {
    p = generatePassphrase();
    writeLocal(p);
  }
  cached = p;
  // Mirror into the durable store without blocking the caller.
  setMeta(PASSPHRASE_KEY, p).catch(() => { /* localStorage copy still stands */ });
  return p;
}

/** Read the stored passphrase without creating one (null if none yet). */
export function getStoredPassphrase() {
  return cached || readLocal();
}

/** Adopt a passphrase as this device's key (e.g. after restoring on a new device). */
export function setStoredPassphrase(passphrase) {
  cached = passphrase;
  writeLocal(passphrase);
  setMeta(PASSPHRASE_KEY, passphrase).catch(() => { /* localStorage copy still stands */ });
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
