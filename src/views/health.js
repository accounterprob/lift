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
        <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${valenceBadge(avgValence(stateOfMind))}</div></div>
      </div>

      <div class="section">Mood vs. training</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${corr.onWorkout != null ? valenceBadge(corr.onWorkout) + ` (${corr.onCount})` : '—'}</div></div>
        <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${corr.offWorkout != null ? valenceBadge(corr.offWorkout) + ` (${corr.offCount})` : '—'}</div></div>
        <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${corr.delta != null ? (corr.delta >= 0 ? '+' : '') + corr.delta.toFixed(2) : '—'}</div></div>
      </div>

      <div class="section">Recent entries</div>
      <div class="list">${stateOfMind.slice(-30).reverse().map(moodRow).join('')}</div>
    ` : emptyState('🧠', 'No mood entries', 'Tap ＋ to log how you\'re feeling.')}
  `;
  ctx.container.scrollTop = 0;
  wireDeletes(ctx, rerender);
}

function moodRow(m) {
  const labels = m.labels.length ? m.labels.join(', ') : (m.kind === 'dailyMood' ? 'Daily mood' : 'Momentary');
  return `
    <div class="list-row">
      <div class="row-main">
        <div class="row-title">${esc(labels)}</div>
        <div class="row-subtitle">${formatDateShort(m.date)} · ${timeStr(m.date)}${m.associations.length ? ' · ' + esc(m.associations.join(', ')) : ''}</div>
      </div>
      <div class="row-trailing">${valenceBadge(m.valence)}</div>
      ${delBtn('stateOfMind', m.id)}
    </div>`;
}

// ============================ Medications ============================

export async function renderMedicationsPage(ctx, onBack) {
  const rerender = () => renderMedicationsPage(ctx, onBack);
  ctx.setTitle('Medications');
  ctx.setBack(onBack);
  ctx.setAction({ html: PLUS, onClick: () => openMedicationForm(rerender) });

  const { medications, doseEvents } = await loadHealth();
  const adherence = adherenceByMedication(medications, doseEvents);
  const medName = new Map(medications.map((m) => [m.id, m.nickname || m.concept.displayText]));
  const recentDoses = doseEvents.slice(-20).reverse();

  ctx.container.innerHTML = `
    ${medications.length ? `
      <div class="section">Your medications</div>
      ${adherence.map(medCard).join('')}
      ${recentDoses.length ? `
        <div class="section">Recent doses</div>
        <div class="list">${recentDoses.map((d) => doseRow(d, medName)).join('')}</div>
      ` : ''}
    ` : emptyState('💊', 'No medications', 'Tap ＋ to add one, then log each dose as you take it.')}
  `;
  ctx.container.scrollTop = 0;

  for (const btn of ctx.container.querySelectorAll('[data-take]')) {
    btn.addEventListener('click', async () => {
      await saveDose({ medicationId: btn.dataset.take, status: btn.dataset.status, date: Date.now(), doseQuantity: 1 });
      showToast(btn.dataset.status === 'taken' ? 'Logged as taken' : 'Logged as skipped');
      rerender();
    });
  }
  for (const btn of ctx.container.querySelectorAll('[data-logat]')) {
    btn.addEventListener('click', () => openDoseForm(medications, rerender, btn.dataset.logat));
  }
  wireDeletes(ctx, rerender);
}

function medCard(a) {
  const m = a.medication;
  const sub = [m.concept.form || 'No form set', a.pct != null ? `${Math.round(a.pct * 100)}% taken (${a.taken}/${a.total})` : 'no doses yet'].join(' · ');
  return `
    <div class="exercise-section">
      <div class="exercise-section-header">
        <div class="row-main">
          <div class="row-title" style="font-weight:600">${esc(m.nickname || m.concept.displayText)}</div>
          <div class="row-subtitle">${esc(sub)}</div>
        </div>
        <button class="menu" data-del-store="medications" data-del-id="${esc(m.id)}" aria-label="Delete">✕</button>
      </div>
      <div class="med-actions">
        <button class="btn-secondary" data-take="${esc(m.id)}" data-status="taken">Taken now</button>
        <button class="btn-secondary" data-take="${esc(m.id)}" data-status="skipped">Skip</button>
        <button class="btn-secondary" data-logat="${esc(m.id)}">Log at time…</button>
      </div>
    </div>`;
}

function doseRow(d, medName) {
  return `
    <div class="list-row">
      <div class="row-main">
        <div class="row-title">${esc(medName.get(d.medicationId) || 'Medication')}</div>
        <div class="row-subtitle">${formatDateShort(d.date)} · ${timeStr(d.date)}</div>
      </div>
      <div class="row-trailing">${esc(STATUS_WORD[d.status] || d.status)}</div>
      ${delBtn('doseEvents', d.id)}
    </div>`;
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

function delBtn(store, id) {
  return `<button class="hz-del" data-del-store="${store}" data-del-id="${esc(id)}" aria-label="Delete">✕</button>`;
}

function wireDeletes(ctx, rerender) {
  for (const btn of ctx.container.querySelectorAll('[data-del-id]')) {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this entry?')) return;
      await deleteHealthRecord(btn.dataset.delStore, btn.dataset.delId);
      rerender();
    });
  }
}

function avgValence(rows) {
  return rows.reduce((a, r) => a + r.valence, 0) / rows.length;
}

/** Plain word for a valence in -1..1 — rendered in the surrounding text color
 * so it reads like every other stat value, not a colored badge. Seven buckets
 * matching Apple's State of Mind labels. */
function valenceWord(v) {
  return v >= 0.7 ? 'Very pleasant'
    : v >= 0.4 ? 'Pleasant'
    : v >= 0.1 ? 'Slightly pleasant'
    : v > -0.1 ? 'Neutral'
    : v > -0.4 ? 'Slightly unpleasant'
    : v > -0.7 ? 'Unpleasant'
    : 'Very unpleasant';
}
const valenceBadge = (v) => esc(valenceWord(v));

// ============================ Entry forms ============================

const VALENCE_STEPS = ['Very Unpleasant', 'Unpleasant', 'Slightly Unpleasant', 'Neutral', 'Slightly Pleasant', 'Pleasant', 'Very Pleasant'];

function nowLocalValue() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function parseLocal(v) {
  const t = v ? new Date(v).getTime() : NaN;
  return isFinite(t) ? t : Date.now();
}
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

function openStateOfMindForm(onSaved) {
  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="som-cancel">Cancel</button>
        <div class="title">State of Mind</div>
        <button class="btn-text primary" id="som-save">Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Kind</div>
        <div class="chip-row" id="som-kind">
          <button type="button" class="chip active" data-chip="momentaryEmotion">Momentary emotion</button>
          <button type="button" class="chip" data-chip="dailyMood">Daily mood</button>
        </div>
        <div class="section">How pleasant?</div>
        <div class="form-section" style="padding: 6px 18px 18px;">
          <div id="som-val-label" style="text-align: center; font-weight: 600; padding: 10px 0;"></div>
          <input type="range" class="mood-slider" id="som-val" min="-3" max="3" step="1" value="1" />
        </div>
        <div class="section">Emotions (optional)</div>
        <div class="chip-row" id="som-emotions" style="flex-wrap: wrap;">${chips(EMOTION_LABELS)}</div>
        <div class="section">What's affecting you? (optional)</div>
        <div class="chip-row" id="som-assoc" style="flex-wrap: wrap;">${chips(ASSOCIATION_LABELS)}</div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="som-date" value="${nowLocalValue()}" style="text-align: left;" /></div>
        </div>
        <div style="height: 16px;"></div>
      </div>
    `,
    onMount(sheet) {
      const slider = sheet.querySelector('#som-val');
      const label = sheet.querySelector('#som-val-label');
      const paint = () => { label.textContent = VALENCE_STEPS[Number(slider.value) + 3]; };
      paint();
      slider.addEventListener('input', paint);
      wireChips(sheet, '#som-kind', { single: true });
      wireChips(sheet, '#som-emotions');
      wireChips(sheet, '#som-assoc');
      sheet.querySelector('#som-cancel').addEventListener('click', () => dismiss());
      sheet.querySelector('#som-save').addEventListener('click', async () => {
        await saveStateOfMind({
          kind: selectedChips(sheet, '#som-kind')[0] || 'momentaryEmotion',
          valence: Number(slider.value) / 3,
          labels: selectedChips(sheet, '#som-emotions'),
          associations: selectedChips(sheet, '#som-assoc'),
          date: parseLocal(sheet.querySelector('#som-date').value),
        });
        dismiss();
        showToast('Logged State of Mind');
        onSaved?.();
      });
    },
  });
}

function openMedicationForm(onSaved) {
  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="med-cancel">Cancel</button>
        <div class="title">Add Medication</div>
        <button class="btn-text primary" id="med-save" disabled>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row"><input id="med-name" placeholder="e.g. Sertraline" style="text-align: left;" /></div>
        </div>
        <div class="section">Form (optional)</div>
        <div class="form-section">
          <div class="form-row"><input id="med-form" placeholder="e.g. tablet, 50 mg" style="text-align: left;" /></div>
        </div>
      </div>
    `,
    onMount(sheet) {
      const name = sheet.querySelector('#med-name');
      const save = sheet.querySelector('#med-save');
      name.addEventListener('input', () => { save.disabled = name.value.trim().length === 0; });
      sheet.querySelector('#med-cancel').addEventListener('click', () => dismiss());
      save.addEventListener('click', async () => {
        if (!name.value.trim()) return;
        await saveMedication({ nickname: name.value, form: sheet.querySelector('#med-form').value });
        dismiss();
        showToast('Medication added');
        onSaved?.();
      });
      setTimeout(() => name.focus(), 50);
    },
  });
}

function openDoseForm(medications, onSaved, presetMedId) {
  const active = medications.filter((m) => !m.isArchived);
  const list = active.length ? active : medications;
  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="dose-cancel">Cancel</button>
        <div class="title">Log a Dose</div>
        <button class="btn-text primary" id="dose-save">Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Medication</div>
        <div class="form-section">
          <div class="form-row">
            <select id="dose-med" style="text-align: left;">
              ${list.map((m) => `<option value="${esc(m.id)}"${m.id === presetMedId ? ' selected' : ''}>${esc(m.nickname || m.concept.displayText)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="section">Status</div>
        <div class="chip-row" id="dose-status">
          ${DOSE_STATUS_OPTIONS.map(([v, w], i) => `<button type="button" class="chip${i === 0 ? ' active' : ''}" data-chip="${v}">${esc(w)}</button>`).join('')}
        </div>
        <div class="section">When</div>
        <div class="form-section">
          <div class="form-row"><input type="datetime-local" id="dose-date" value="${nowLocalValue()}" style="text-align: left;" /></div>
        </div>
      </div>
    `,
    onMount(sheet) {
      wireChips(sheet, '#dose-status', { single: true });
      sheet.querySelector('#dose-cancel').addEventListener('click', () => dismiss());
      sheet.querySelector('#dose-save').addEventListener('click', async () => {
        await saveDose({
          medicationId: sheet.querySelector('#dose-med').value,
          status: selectedChips(sheet, '#dose-status')[0] || 'taken',
          date: parseLocal(sheet.querySelector('#dose-date').value),
          doseQuantity: 1,
        });
        dismiss();
        showToast('Dose logged');
        onSaved?.();
      });
    },
  });
}
