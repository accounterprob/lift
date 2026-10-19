// Reads backups made while Lift encrypted them (until 2026-10-18). New backups
// are plain JSON; this file only exists so an old AES-256-GCM envelope can
// still be restored. The envelope's key is derived (PBKDF2) from the device
// passphrase, which an older install may still hold in localStorage or the
// appMeta store. All crypto is the browser's built-in SubtleCrypto.

import { getMeta } from './db.js';

const PASSPHRASE_KEY = 'lift-backup-passphrase';

const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** The passphrase an older install saved on this device, or null. */
export async function getStoredPassphrase() {
  try {
    const local = localStorage.getItem(PASSPHRASE_KEY);
    if (local) return local;
  } catch { /* private mode */ }
  try { return (await getMeta(PASSPHRASE_KEY)) || null; } catch { return null; }
}

/** True if a parsed backup is one of the old encrypted envelopes. */
export function isEncryptedBackup(obj) {
  return !!obj && obj.lift === 'encrypted-backup' && typeof obj.data === 'string';
}

/**
 * Decrypt an envelope back to the snapshot object. Throws if the passphrase is
 * wrong or the file is corrupt (AES-GCM authentication fails).
 */
export async function decryptSnapshot(envelope, passphrase) {
  const base = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: unb64(envelope.kdf.salt), iterations: envelope.kdf.iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(envelope.iv) }, key, unb64(envelope.data));
  } catch {
    throw new Error('Wrong backup password (or the file is damaged).');
  }
  return JSON.parse(new TextDecoder().decode(plain));
}
