// Merge-import for Health Auto Export JSON (the free iOS app that can read the
// medication dose log HealthKit exposes but Apple's own export leaves out).
//
// Shape it produces: { data: { medications: [ { displayText, start, end,
// scheduledDate, status, dosage, scheduledDosage, units, codings[] } ], ... } }
//
// The import MERGES: doses attach to the medications already in Lift (matched by
// name), anything unrecognized is created, and re-importing the same file is a
// no-op because each dose gets an id derived from its medication + timestamp.

import { getAll, putMany } from './db.js';
import { uuid } from './utils.js';

/** "2026-06-25 07:29:56 -0500" → ms. Rewritten to ISO 8601 first: the raw form
 * parses in V8 but not reliably in Safari, which is the actual target. */
export function parseHaeDate(s) {
  const m = String(s || '').match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?\s*([+-])(\d{2}):?(\d{2})$/);
  if (m) {
    const t = Date.parse(`${m[1]}T${m[2]}${m[3]}${m[4]}:${m[5]}`);
    if (isFinite(t)) return t;
  }
  const t = Date.parse(s);
  return isFinite(t) ? t : NaN;
}

const STATUS_MAP = {
  taken: 'taken', skipped: 'skipped', snoozed: 'snoozed', notinteracted: 'notInteracted',
};
const mapStatus = (s) => STATUS_MAP[String(s || '').toLowerCase().replace(/[^a-z]/g, '')] || 'taken';

/** Names compare loosely: Health exports a full formal name like "Amoxicillin
 * Trihydrate 500mg Oral capsule" where Lift stores just "Amoxicillin". */
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Split a Health display name into a short nickname + the dose/form remainder,
 * e.g. "Ibuprofen Sodium 200mg Oral tablet" → ["Ibuprofen Sodium", "200mg Oral tablet"]. */
export function splitDisplayName(displayText) {
  const full = String(displayText || '').trim();
  const m = full.match(/\s\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|%)\b/i);
  if (!m) return [full || 'Medication', ''];
  return [full.slice(0, m.index).trim() || full, full.slice(m.index).trim()];
}

/** Find the medication an imported name refers to, comparing against both the
 * nickname and the formal display text and preferring the longest match (so a
 * short name can't win a row that a more specific name also matches). */
export function matchMedication(displayText, medications) {
  const target = norm(displayText);
  if (!target) return null;
  let best = null;
  let bestLen = 0;
  for (const med of medications) {
    for (const candidate of [med.nickname, med.concept?.displayText]) {
      const key = norm(candidate);
      if (!key || key.length <= bestLen) continue;
      const hit = target === key
        || target.startsWith(`${key} `)
        || key.startsWith(`${target} `)
        || target.includes(` ${key} `);
      if (hit) { best = med; bestLen = key.length; }
    }
  }
  return best;
}

/** Does this row look like a logged dose? Used to locate the dose array in an
 * export whose wrapping differs from the shape we know. */
const looksLikeDose = (r) =>
  !!r && typeof r === 'object' && !Array.isArray(r)
  && (r.displayText || r.name)
  && (r.start || r.scheduledDate || r.date || r.end);

/** Find the dose array anywhere in the file. Health Auto Export has shipped
 * more than one wrapping (and exports differ per app version), so check the
 * known paths first, then fall back to scanning for an array whose entries
 * look like doses rather than failing on an unfamiliar envelope. */
function findDoseRows(parsed, depth = 0) {
  if (depth === 0) {
    for (const known of [parsed?.data?.medications, parsed?.medications, parsed?.data?.medication]) {
      if (Array.isArray(known) && known.some(looksLikeDose)) return known;
    }
  }
  if (depth > 4 || !parsed || typeof parsed !== 'object') return null;
  if (Array.isArray(parsed)) return parsed.some(looksLikeDose) ? parsed : null;
  for (const value of Object.values(parsed)) {
    const hit = findDoseRows(value, depth + 1);
    if (hit) return hit;
  }
  return null;
}

/** Describe what the file actually holds, so a failed import can say why
 * instead of just "no data". */
function describeShape(parsed) {
  if (!parsed || typeof parsed !== 'object') return 'not a JSON object';
  if (Array.isArray(parsed)) return `a list of ${parsed.length} item(s)`;
  const inner = parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data) ? parsed.data : null;
  const describe = (obj) => Object.entries(obj)
    .map(([k, v]) => (Array.isArray(v) ? `${k}[${v.length}]` : k))
    .join(', ');
  const top = describe(parsed);
  return inner ? `data → ${describe(inner) || 'empty'}` : (top || 'empty');
}

/** Pull the dose rows out of a parsed Health Auto Export file. Throws if the
 * file isn't one. Pure — no database access, so it's directly testable. */
export function parseHealthAutoExport(parsed) {
  const rows = findDoseRows(parsed);
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(
      `No medication doses found — this file has ${describeShape(parsed)}. `
      + 'In Health Auto Export, pick Medications (not Health Metrics), set the date range, and export as JSON.'
    );
  }
  const doses = [];
  let skipped = 0;
  for (const r of rows) {
    const date = parseHaeDate(r.start || r.scheduledDate || r.date || r.end);
    const name = r.displayText || r.name;
    if (!isFinite(date) || !name) { skipped += 1; continue; }
    doses.push({
      displayText: String(name),
      date,
      status: mapStatus(r.status),
      // A dose that was never acted on has no `dosage` — only what was scheduled.
      doseQuantity: Number(r.dosage) || 0,
      scheduledQuantity: Number(r.scheduledDosage) || 0,
      hasSchedule: !!r.scheduledDate,
      units: String(r.units || ''),
      rxnorm: (r.codings || []).map((c) => c?.code).filter(Boolean),
    });
  }
  if (doses.length === 0) {
    throw new Error(`Found ${rows.length} record(s) but none had a readable name and date. The export format may have changed.`);
  }
  doses.sort((a, b) => a.date - b.date);
  return { doses, skipped };
}

/**
 * Merge a Health Auto Export file into the database. Existing medications keep
 * their names, per-dose amounts, and units — the import only adds dose history
 * and any medication it can't find. Returns a summary for the UI.
 */
export async function importHealthAutoExport(file) {
  const { doses, skipped } = parseHealthAutoExport(JSON.parse(await file.text()));
  const [medications, doseEvents] = await Promise.all([getAll('medications'), getAll('doseEvents')]);

  const meds = [...medications];
  const newMeds = [];
  const resolved = new Map();  // displayText → medication id

  for (const d of doses) {
    if (resolved.has(d.displayText)) continue;
    const existing = matchMedication(d.displayText, meds);
    if (existing) {
      resolved.set(d.displayText, existing.id);
      continue;
    }
    const [nickname, form] = splitDisplayName(d.displayText);
    const med = {
      id: uuid(),
      nickname,
      isArchived: false,
      hasSchedule: d.hasSchedule,
      // "count" is Health's unit for pills — Lift renders that as plain "doses".
      doseAmount: d.scheduledQuantity || d.doseQuantity || 1,
      doseUnit: d.units && d.units !== 'count' ? d.units : '',
      concept: { identifier: '', displayText: d.displayText, form, rxnorm: d.rxnorm },
    };
    meds.push(med);
    newMeds.push(med);
    resolved.set(d.displayText, med.id);
  }

  // Don't re-add a dose already present: same id (a repeat import of this file)
  // or the same medication already logged in that same minute.
  const existingIds = new Set(doseEvents.map((d) => d.id));
  const existingSlots = new Set(doseEvents.map((d) => `${d.medicationId}|${Math.floor(d.date / 60000)}`));

  const newDoses = [];
  let duplicates = 0;
  for (const d of doses) {
    const medicationId = resolved.get(d.displayText);
    const id = `hae-${medicationId}-${d.date}`;
    const slot = `${medicationId}|${Math.floor(d.date / 60000)}`;
    if (existingIds.has(id) || existingSlots.has(slot)) { duplicates += 1; continue; }
    existingIds.add(id);
    existingSlots.add(slot);
    newDoses.push({
      id,
      medicationId,
      status: d.status,
      date: d.date,
      scheduledQuantity: d.scheduledQuantity,
      doseQuantity: d.doseQuantity,
    });
  }

  if (newMeds.length) await putMany('medications', newMeds);
  if (newDoses.length) await putMany('doseEvents', newDoses);

  return {
    doses: newDoses.length,
    medications: newMeds.length,
    duplicates,
    skipped,
    total: doses.length,
    range: newDoses.length ? [newDoses[0].date, newDoses[newDoses.length - 1].date] : null,
  };
}
