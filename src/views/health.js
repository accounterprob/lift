import { getFinishedWorkouts } from '../db.js';
import { esc, formatDateShort, showToast, showSheet } from '../utils.js';
import {
  loadHealth, moodVsWorkouts, adherenceByMedication,
  saveStateOfMind, saveMedication, saveDose, deleteHealthRecord,
  EMOTION_LABELS, ASSOCIATION_LABELS, DOSE_STATUS_OPTIONS,
} from '../health.js';

const STATUS_WORD = Object.fromEntries(DOSE_STATUS_OPTIONS);
const timeStr = (ms) => new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
// Same "+" nav-bar action the Exercises tab uses for adding.
const PLUS = '<span style="font-size: 24px;">+</span>';

// ============================ State of Mind ============================

export async function renderStateOfMindPage(ctx, onBack) {
  const rerender = () => renderStateOfMindPage(ctx, onBack);
  ctx.setTitle('State of Mind');
  ctx.setBack(onBack);
  ctx.setAction({ html: PLUS, onClick: () => openStateOfMindForm(rerender) });

  const [{ stateOfMind }, workouts] = await Promise.all([loadHealth(), getFinishedWorkouts()]);
  const corr = moodVsWorkouts(stateOfMind, workouts);

  ctx.container.innerHTML = `
    ${stateOfMind.length ? `
      <div class="section">Summary</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${stateOfMind.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${formatDateShort(stateOfMind[0].date)} – ${formatDateShort(stateOfMind[stateOfMind.length - 1].date)}</div></div>
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${valencePill(avgValence(stateOfMind))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${corr.onWorkout != null ? valencePill(corr.onWorkout) + ` (${corr.onCount})` : '—'}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${corr.offWorkout != null ? valencePill(corr.offWorkout) + ` (${corr.offCount})` : '—'}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${corr.delta != null ? (corr.delta >= 0 ? '+' : '') + corr.delta.toFixed(2) : '—'}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${stateOfMind.slice(-30).reverse().map(moodRow).join('')}</div>
    ` : emptyState('🧠', 'No mood entries', 'Tap ＋ to log how you\'re feeling.')}
  `;
  ctx.container.scrollTop = 0;

  for (const btn of ctx.container.querySelectorAll('[data-edit-som]')) {
    const m = stateOfMind.find((x) => x.id === btn.dataset.editSom);
    if (m) btn.addEventListener('click', () => openStateOfMindForm(rerender, m));
  }
}

function moodRow(m) {
  const daily = m.kind === 'dailyMood';
  const title = m.labels.length ? m.labels.join(', ') : (daily ? 'Daily mood' : 'Momentary emotion');
  // Only prefix the kind when the title is emotion labels — otherwise the title
  // already names the kind and repeating it reads redundant.
  const sub = [
    ...(m.labels.length ? [daily ? 'Daily mood' : 'Moment'] : []),
    formatDateShort(m.date), timeStr(m.date),
    ...(m.associations.length ? [m.associations.join(', ')] : []),
  ].join(' · ');
  return `
    <button class="list-row" data-edit-som="${esc(m.id)}">
      <div class="row-main">
        <div class="row-title">${esc(title)}</div>
        <div class="row-subtitle">${esc(sub)}</div>
      </div>
      <div class="row-trailing">${valencePill(m.valence)}</div>
      <div class="chevron">›</div>
    </button>`;
}

// ============================ Medications ============================

export async function renderMedicationsPage(ctx, onBack) {
  const rerender = () => renderMedicationsPage(ctx, onBack);
  ctx.setTitle('Medications');
  ctx.setBack(onBack);
  ctx.setAction({ html: PLUS, onClick: () => openMedicationForm(rerender) });

  const { medications, doseEvents } = await loadHealth();
  const adherence = adherenceByMedication(medications, doseEvents);
  const medById = new Map(medications.map((m) => [m.id, m]));
  // A short preview here; the full log lives behind "Dose History", the same
  // shape as Progress → Workout History.
  const recentDoses = doseEvents.slice(-10).reverse();

  // Count "taken" doses logged today (local day) per medication, so daily meds
  // can show whether they've been taken yet.
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const takenToday = new Map();
  for (const d of doseEvents) {
    if (d.status === 'taken' && d.date >= startOfToday.getTime()) {
      takenToday.set(d.medicationId, (takenToday.get(d.medicationId) || 0) + 1);
    }
  }

  ctx.container.innerHTML = `
    ${medications.length ? `
      <div class="section">Your medications</div>
      ${adherence.map((a) => medCard(a, takenToday.get(a.medication.id) || 0)).join('')}
      ${recentDoses.length ? `
        <div class="section">Recent doses</div>
        <div class="list">${recentDoses.map((d) => doseRow(d, medById)).join('')}</div>
        <div class="list">
          <button class="list-row" data-dose-history>
            <div class="row-main">
              <div class="row-title">Dose History</div>
              <div class="row-subtitle">${doseEvents.length.toLocaleString()} dose${doseEvents.length === 1 ? '' : 's'}</div>
            </div>
            <div class="chevron">›</div>
          </button>
        </div>
      ` : ''}
    ` : emptyState('💊', 'No medications', 'Tap ＋ to add one, then log each dose as you take it.')}
  `;
  ctx.container.scrollTop = 0;

  ctx.container.querySelector('[data-dose-history]')?.addEventListener('click', () => {
    renderDoseHistoryPage(ctx, rerender);
  });

  for (const btn of ctx.container.querySelectorAll('[data-take]')) {
    btn.addEventListener('click', async () => {
      await saveDose({ medicationId: btn.dataset.take, status: btn.dataset.status, date: Date.now(), doseQuantity: doseAmountOf(medById.get(btn.dataset.take)) });
      showToast(btn.dataset.status === 'taken' ? 'Logged as taken' : 'Logged as skipped');
      rerender();
    });
  }
  for (const btn of ctx.container.querySelectorAll('[data-logat]')) {
    btn.addEventListener('click', () => openDoseForm(medications, rerender, btn.dataset.logat));
  }
  for (const btn of ctx.container.querySelectorAll('[data-edit-dose]')) {
    const d = doseEvents.find((x) => x.id === btn.dataset.editDose);
    if (d) btn.addEventListener('click', () => openDoseForm(medications, rerender, null, d));
  }
  for (const btn of ctx.container.querySelectorAll('[data-edit-med]')) {
    const m = medById.get(btn.dataset.editMed);
    if (m) btn.addEventListener('click', () => openMedicationForm(rerender, m));
  }
}

/** Every dose ever logged, newest first, grouped under a heading per day so a
 * long log stays scannable. Rows open the same edit sheet as the preview list. */
async function renderDoseHistoryPage(ctx, onBack) {
  const rerender = () => renderDoseHistoryPage(ctx, onBack);
  ctx.setTitle('Dose History');
  ctx.setBack(onBack);
  ctx.setAction(null);

  const { medications, doseEvents } = await loadHealth();
  const medById = new Map(medications.map((m) => [m.id, m]));
  const newestFirst = [...doseEvents].reverse();

  // Group into days, preserving newest-first order.
  const days = [];
  let current = null;
  for (const d of newestFirst) {
    const key = dayKey(d.date);
    if (!current || current.key !== key) {
      current = { key, date: d.date, doses: [] };
      days.push(current);
    }
    current.doses.push(d);
  }

  const taken = doseEvents.filter((d) => d.status === 'taken').length;
  ctx.container.innerHTML = newestFirst.length ? `
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Doses logged</div><div class="stat-value">${doseEvents.length.toLocaleString()}</div></div>
      <div class="stat-row"><div class="stat-label">Taken</div><div class="stat-value">${taken.toLocaleString()}</div></div>
      <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${formatDateShort(doseEvents[0].date)} – ${formatDateShort(doseEvents[doseEvents.length - 1].date)}</div></div>
    </div>
    ${days.map((day) => `
      <div class="section">${esc(dayHeading(day.date))}</div>
      <div class="list">${day.doses.map((d) => doseRow(d, medById, { showDate: false })).join('')}</div>
    `).join('')}
  ` : emptyState('💊', 'No doses yet', 'Log a dose from the Medications page and it will show up here.');
  ctx.container.scrollTop = 0;

  for (const btn of ctx.container.querySelectorAll('[data-edit-dose]')) {
    const d = doseEvents.find((x) => x.id === btn.dataset.editDose);
    if (d) btn.addEventListener('click', () => openDoseForm(medications, rerender, null, d));
  }
}

const dayKey = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** "Today" / "Yesterday" / "Mon, Jul 21" for a day heading. */
function dayHeading(ms) {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (dayKey(ms) === dayKey(today.getTime())) return 'Today';
  if (dayKey(ms) === dayKey(yesterday.getTime())) return 'Yesterday';
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    year: new Date(ms).getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

function medCard(a, takenToday) {
  const m = a.medication;
  const sub = [m.concept.form || 'No form set', a.pct != null ? `${Math.round(a.pct * 100)}% taken (${a.taken}/${a.total})` : 'no doses yet'].join(' · ');
  // Daily meds show a today indicator; as-needed meds (e.g. an inhaler) don't.
  const todayBadge = m.hasSchedule
    ? (takenToday > 0
        ? '<span class="hz-pill" style="--pc: #2ba758;">✓ Taken today</span>'
        : '<span class="hz-pill muted">Not taken today</span>')
    : '';
  return `
    <div class="exercise-section">
      <button class="exercise-section-header" data-edit-med="${esc(m.id)}">
        <div class="row-main">
          <div class="row-title" style="font-weight:600">${esc(m.nickname || m.concept.displayText)}</div>
          <div class="row-subtitle">${esc(sub)}</div>
          ${todayBadge ? `<div style="margin-top: 8px;">${todayBadge}</div>` : ''}
        </div>
        <div class="chevron">›</div>
      </button>
      <div class="med-actions">
        <button class="btn-secondary" data-take="${esc(m.id)}" data-status="taken">Taken now</button>
        <button class="btn-secondary" data-take="${esc(m.id)}" data-status="skipped">Skip</button>
        <button class="btn-secondary" data-logat="${esc(m.id)}">Log at time…</button>
      </div>
    </div>`;
}

// Per-dose amount for a medication, defaulting to 1 for entries that predate the
// field (so a quick "Taken now" still logs a sensible amount).
const doseAmountOf = (m) => (Number(m?.doseAmount) > 0 ? Number(m.doseAmount) : 1);

/** "4 capsules", "1 tablet", "5 mg", or "1 dose" — plain measurement units
 * (mg/ml/g…) don't pluralize; countable units (capsule, tablet) do. */
function doseLabel(qty, unit) {
  const u = (unit || '').trim() || 'dose';
  const plural = qty === 1 || /^(mg|mcg|ml|cc|g|kg|l|oz|iu|puff|puffs)$/i.test(u) || u.endsWith('s') ? u : `${u}s`;
  return `${formatQty(qty)} ${plural}`;
}

function doseRow(d, medById, { showDate = true } = {}) {
  const med = medById.get(d.medicationId);
  const qty = Number(d.doseQuantity) || 0;
  const sub = [
    ...(showDate ? [formatDateShort(d.date)] : []),
    timeStr(d.date),
    ...(qty > 0 ? [doseLabel(qty, med?.doseUnit)] : []),
  ].join(' · ');
  return `
    <button class="list-row" data-edit-dose="${esc(d.id)}">
      <div class="row-main">
        <div class="row-title">${esc(med ? (med.nickname || med.concept.displayText) : 'Medication')}</div>
        <div class="row-subtitle">${esc(sub)}</div>
      </div>
      <div class="row-trailing">${esc(STATUS_WORD[d.status] || d.status)}</div>
      <div class="chevron">›</div>
    </button>`;
}

// ============================ Shared ============================

function emptyState(icon, title, text) {
  return `
    <div class="empty-state" style="padding: 48px 24px; min-height: auto;">
      <div class="empty-icon">${icon}</div>
      <h2>${esc(title)}</h2>
      <p>${esc(text)}</p>
    </div>`;
}

function avgValence(rows) {
  return rows.reduce((a, r) => a + r.valence, 0) / rows.length;
}

const formatQty = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))));

/** Word + pill color for a valence in -1..1. Seven buckets matching Apple's
 * State of Mind labels, on a red→gray→green diverging scale that reads in both
 * light and dark mode (the pill tints a translucent wash of this color). */
function valenceInfo(v) {
  if (v >= 0.7) return ['Very pleasant', '#2ba758'];
  if (v >= 0.4) return ['Pleasant', '#54a85a'];
  if (v >= 0.1) return ['Slightly pleasant', '#9cad46'];
  if (v > -0.1) return ['Neutral', '#8a8a8e'];
  if (v > -0.4) return ['Slightly unpleasant', '#d99a3c'];
  if (v > -0.7) return ['Unpleasant', '#e07a4e'];
  return ['Very unpleasant', '#e0574f'];
}
function valencePill(v) {
  const [word, color] = valenceInfo(v);
  return `<span class="hz-pill" style="--pc: ${color};">${esc(word)}</span>`;
}

// ============================ Entry forms ============================

function toLocalValue(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const nowLocalValue = () => toLocalValue(Date.now());
function parseLocal(v) {
  const t = v ? new Date(v).getTime() : NaN;
  return isFinite(t) ? t : Date.now();
}
// Map a -1..1 valence onto the 7-position slider (-3..3).
const valenceToStep = (v) => Math.max(-3, Math.min(3, Math.round(v * 3)));
function chips(items, active = []) {
  return items.map((c) => `<button type="button" class="chip${active.includes(c) ? ' active' : ''}" data-chip="${esc(c)}">${esc(c)}</button>`).join('');
}
function wireChips(root, selector, opts = {}) {
  for (const chip of root.querySelectorAll(`${selector} .chip`)) {
    chip.addEventListener('click', () => {
      if (opts.single) root.querySelectorAll(`${selector} .chip`).forEach((c) => c.classList.remove('active'));
      chip.classList.toggle('active', opts.single ? true : !chip.classList.contains('active'));
    });
  }
}
const selectedChips = (root, selector) =>
  [...root.querySelectorAll(`${selector} .chip.active`)].map((c) => c.dataset.chip);

function openStateOfMindForm(onSaved, entry = null) {
  const editing = !!entry;
  const daily = editing && entry.kind === 'dailyMood';
  const initialStep = editing ? valenceToStep(entry.valence) : 1;
  // Track the valence separately so an untouched slider keeps the entry's exact
  // imported value instead of snapping it to the nearest 7-step position.
  let currentValence = editing ? entry.valence : initialStep / 3;
  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="som-cancel">Cancel</button>
        <div class="title">${editing ? 'Edit Entry' : 'State of Mind'}</div>
        <button class="btn-text primary" id="som-save">Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Kind</div>
        <div class="chip-row" id="som-kind">
          <button type="button" class="chip${daily ? '' : ' active'}" data-chip="momentaryEmotion">Momentary emotion</button>
          <button type="button" class="chip${daily ? ' active' : ''}" data-chip="dailyMood">Daily mood</button>
        </div>
        <div class="section">How pleasant?</div>
        <div class="form-section" style="padding: 6px 18px 18px;">
          <div id="som-val-label" style="text-align: center; font-weight: 600; padding: 10px 0;"></div>
          <input type="range" class="mood-slider" id="som-val" min="-3" max="3" step="1" value="${initialStep}" />
        </div>
        <div class="section">Emotions (optional)</div>
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${chips(EMOTION_LABELS, editing ? entry.labels : [])}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${chips(ASSOCIATION_LABELS, editing ? entry.associations : [])}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${editing ? toLocalValue(entry.date) : nowLocalValue()}" style="text-align: left;" /></div>
        </div>
        ${editing ? `
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="som-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Entry</div></div></button>
        </div>` : ''}
        <div style="height: 16px;"></div>
      </div>
    `,
    onMount(sheet) {
      const slider = sheet.querySelector('#som-val');
      const label = sheet.querySelector('#som-val-label');
      // Derive the label from the same buckets as the recent-entry pills so the
      // wording always matches (e.g. "Very pleasant", not "Very Pleasant").
      const paint = () => { label.textContent = valenceInfo(Number(slider.value) / 3)[0]; };
      paint();
      slider.addEventListener('input', () => { currentValence = Number(slider.value) / 3; paint(); });
      wireChips(sheet, '#som-kind', { single: true });
      wireChips(sheet, '#som-emotions');
      wireChips(sheet, '#som-assoc');
      sheet.querySelector('#som-cancel').addEventListener('click', () => dismiss());
      sheet.querySelector('#som-save').addEventListener('click', async () => {
        await saveStateOfMind({
          id: entry?.id,
          kind: selectedChips(sheet, '#som-kind')[0] || 'momentaryEmotion',
          valence: currentValence,
          labels: selectedChips(sheet, '#som-emotions'),
          associations: selectedChips(sheet, '#som-assoc'),
          date: parseLocal(sheet.querySelector('#som-date').value),
        });
        dismiss();
        showToast(editing ? 'Entry updated' : 'Logged State of Mind');
        onSaved?.();
      });
      sheet.querySelector('#som-delete')?.addEventListener('click', async () => {
        if (!confirm('Delete this entry?')) return;
        await deleteHealthRecord('stateOfMind', entry.id);
        dismiss();
        showToast('Entry deleted');
        onSaved?.();
      });
    },
  });
}

function openMedicationForm(onSaved, med = null) {
  const editing = !!med;
  const daily = editing ? !!med.hasSchedule : true;
  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="med-cancel">Cancel</button>
        <div class="title">${editing ? 'Edit Medication' : 'Add Medication'}</div>
        <button class="btn-text primary" id="med-save"${editing ? '' : ' disabled'}>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row"><input id="med-name" placeholder="e.g. Sertraline" value="${editing ? esc(med.nickname || med.concept.displayText) : ''}" style="text-align: left;" /></div>
        </div>
        <div class="section">Form (optional)</div>
        <div class="form-section">
          <div class="form-row"><input id="med-form" placeholder="e.g. tablet, 50 mg" value="${editing ? esc(med.concept?.form || '') : ''}" style="text-align: left;" /></div>
        </div>
        <div class="section">Amount per dose</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="med-amount" inputmode="decimal" min="0" step="0.25" value="${editing ? esc(String(doseAmountOf(med))) : '1'}" style="text-align: left;" /></div>
          <div class="form-row"><input id="med-unit" placeholder="unit — e.g. capsule, tablet, mg" value="${editing ? esc(med.doseUnit || '') : ''}" style="text-align: left;" /></div>
        </div>
        <div class="section-footer">How many you take at once. Creatine, for example, is 4 capsules — one “Taken now” then logs all four.</div>
        <div class="section">Type</div>
        <div class="chip-row" id="med-type">
          <button type="button" class="chip${daily ? ' active' : ''}" data-chip="daily">Daily</button>
          <button type="button" class="chip${daily ? '' : ' active'}" data-chip="asneeded">As needed</button>
        </div>
        <div class="section-footer">Daily medications show whether you've taken them today.</div>
        ${editing ? `
        <div class="form-section">
          <button class="list-row button destructive" id="med-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Medication</div></div></button>
        </div>` : ''}
        <div style="height: 16px;"></div>
      </div>
    `,
    onMount(sheet) {
      const name = sheet.querySelector('#med-name');
      const save = sheet.querySelector('#med-save');
      name.addEventListener('input', () => { save.disabled = name.value.trim().length === 0; });
      wireChips(sheet, '#med-type', { single: true });
      sheet.querySelector('#med-cancel').addEventListener('click', () => dismiss());
      save.addEventListener('click', async () => {
        if (!name.value.trim()) return;
        await saveMedication({
          id: med?.id,
          nickname: name.value,
          form: sheet.querySelector('#med-form').value,
          hasSchedule: (selectedChips(sheet, '#med-type')[0] || 'daily') === 'daily',
          doseAmount: sheet.querySelector('#med-amount').value,
          doseUnit: sheet.querySelector('#med-unit').value,
        });
        dismiss();
        showToast(editing ? 'Medication updated' : 'Medication added');
        onSaved?.();
      });
      sheet.querySelector('#med-delete')?.addEventListener('click', async () => {
        if (!confirm('Delete this medication? Its logged doses stay in your history.')) return;
        await deleteHealthRecord('medications', med.id);
        dismiss();
        showToast('Medication deleted');
        onSaved?.();
      });
      if (!editing) setTimeout(() => name.focus(), 50);
    },
  });
}

function openDoseForm(medications, onSaved, presetMedId, dose = null) {
  const editing = !!dose;
  const active = medications.filter((m) => !m.isArchived);
  const list = active.length ? active : medications;
  const selMedId = editing ? dose.medicationId : presetMedId;
  const initialStatus = editing ? dose.status : 'taken';
  // A new dose defaults its amount to the selected med's per-dose amount (e.g.
  // creatine = 4); an edited dose keeps whatever was logged.
  const initialQty = editing ? (Number(dose.doseQuantity) || 1) : doseAmountOf(list.find((m) => m.id === selMedId) || list[0]);
  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="dose-cancel">Cancel</button>
        <div class="title">${editing ? 'Edit Dose' : 'Log a Dose'}</div>
        <button class="btn-text primary" id="dose-save">Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Medication</div>
        <div class="form-section">
          <div class="form-row">
            <select id="dose-med" style="text-align: left;">
              ${list.map((m) => `<option value="${esc(m.id)}"${m.id === selMedId ? ' selected' : ''}>${esc(m.nickname || m.concept.displayText)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="section">Status</div>
        <div class="chip-row" id="dose-status">
          ${DOSE_STATUS_OPTIONS.map(([v, w]) => `<button type="button" class="chip${v === initialStatus ? ' active' : ''}" data-chip="${v}">${esc(w)}</button>`).join('')}
        </div>
        <div class="section">Amount</div>
        <div class="form-section">
          <div class="form-row"><input type="number" id="dose-qty" inputmode="decimal" min="0" step="0.25" value="${initialQty}" style="text-align: left;" /></div>
        </div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="dose-date" value="${editing ? toLocalValue(dose.date) : nowLocalValue()}" style="text-align: left;" /></div>
        </div>
        ${editing ? `
        <div style="height: 8px;"></div>
        <div class="form-section">
          <button class="list-row button destructive" id="dose-delete"><div class="row-main"><div class="row-title" style="color: var(--red);">Delete Dose</div></div></button>
        </div>` : ''}
        <div style="height: 16px;"></div>
      </div>
    `,
    onMount(sheet) {
      wireChips(sheet, '#dose-status', { single: true });
      // When adding a dose, switching medication resets the amount to that med's
      // per-dose default; when editing, the logged amount is left alone.
      if (!editing) {
        const sel = sheet.querySelector('#dose-med');
        const qty = sheet.querySelector('#dose-qty');
        sel.addEventListener('change', () => { qty.value = String(doseAmountOf(medications.find((m) => m.id === sel.value))); });
      }
      sheet.querySelector('#dose-cancel').addEventListener('click', () => dismiss());
      sheet.querySelector('#dose-save').addEventListener('click', async () => {
        await saveDose({
          id: dose?.id,
          medicationId: sheet.querySelector('#dose-med').value,
          status: selectedChips(sheet, '#dose-status')[0] || 'taken',
          date: parseLocal(sheet.querySelector('#dose-date').value),
          doseQuantity: Number(sheet.querySelector('#dose-qty').value) || 0,
        });
        dismiss();
        showToast(editing ? 'Dose updated' : 'Dose logged');
        onSaved?.();
      });
      sheet.querySelector('#dose-delete')?.addEventListener('click', async () => {
        if (!confirm('Delete this dose?')) return;
        await deleteHealthRecord('doseEvents', dose.id);
        dismiss();
        showToast('Dose deleted');
        onSaved?.();
      });
    },
  });
}
