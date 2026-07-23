import { getFinishedWorkouts } from '../db.js';
import { esc, formatDateShort, showToast, emit, showSheet } from '../utils.js';
import {
  importHealthFile, loadHealth, moodVsWorkouts, adherenceByMedication,
  saveStateOfMind, saveMedication, saveDose, deleteHealthRecord,
  EMOTION_LABELS, ASSOCIATION_LABELS, DOSE_STATUS_OPTIONS,
} from '../health.js';

const STATUS_WORD = Object.fromEntries(DOSE_STATUS_OPTIONS);

/**
 * Mental Health page: manually log State of Mind + Medications/doses (or import
 * an Apple Health bridge file), with a first correlation (mood on workout vs.
 * rest days) and dose adherence. Reached from the Progress tab.
 */
export async function renderHealthPage(ctx, onBack) {
  ctx.setTitle('Mental Health');
  ctx.setBack(onBack);
  ctx.setAction(null);

  const [{ stateOfMind, medications, doseEvents }, workouts] = await Promise.all([
    loadHealth(), getFinishedWorkouts(),
  ]);
  const rerender = () => renderHealthPage(ctx, onBack);

  const hasData = stateOfMind.length || medications.length;
  ctx.container.innerHTML = `
    <div class="section">Log</div>
    <div class="form-section">
      <button class="list-row button" id="hz-log-mood">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">＋ Log State of Mind</div></div>
      </button>
      <button class="list-row button" id="hz-add-med">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">＋ Add Medication</div></div>
      </button>
      ${medications.length ? `
      <button class="list-row button" id="hz-log-dose">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">＋ Log a Dose</div></div>
      </button>` : ''}
    </div>

    ${hasData ? renderData(stateOfMind, medications, doseEvents, workouts) : renderEmpty()}

    <div class="section">Apple Health</div>
    <div class="form-section">
      <button class="list-row button" id="hz-import">
        <div class="row-main"><div class="row-title" style="color: var(--text-secondary);">Import Health data…</div></div>
      </button>
    </div>
    <div class="section-footer">
      Optional: import a <b>health-import</b> JSON file exported from Apple Health
      (Lift can't read Health directly). Re-importing updates existing entries.
    </div>
    <input type="file" id="hz-file" accept=".json,application/json" style="display: none;" />
  `;
  ctx.container.scrollTop = 0;

  ctx.container.querySelector('#hz-log-mood').addEventListener('click', () => openStateOfMindForm(rerender));
  ctx.container.querySelector('#hz-add-med').addEventListener('click', () => openMedicationForm(rerender));
  ctx.container.querySelector('#hz-log-dose')?.addEventListener('click', () => openDoseForm(medications, rerender));

  const fileInput = ctx.container.querySelector('#hz-file');
  ctx.container.querySelector('#hz-import').addEventListener('click', () => { fileInput.value = ''; fileInput.click(); });
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const c = await importHealthFile(file);
      showToast(`Imported ${c.stateOfMind} moods, ${c.medications} meds, ${c.doseEvents} doses`);
      emit('data:changed');
      rerender();
    } catch (err) { showToast(`Import failed: ${err.message}`); }
  });

  for (const btn of ctx.container.querySelectorAll('[data-del-id]')) {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this entry?')) return;
      await deleteHealthRecord(btn.dataset.delStore, btn.dataset.delId);
      emit('data:changed');
      rerender();
    });
  }
}

function renderEmpty() {
  return `
    <div class="empty-state" style="padding: 32px 24px; min-height: auto;">
      <div class="empty-icon">🧠</div>
      <p style="color: var(--text-secondary); max-width: 300px;">
        No entries yet. Tap <b>Log State of Mind</b> or <b>Add Medication</b> above to start.
      </p>
    </div>`;
}

function renderData(stateOfMind, medications, doseEvents, workouts) {
  const corr = moodVsWorkouts(stateOfMind, workouts);
  const adherence = adherenceByMedication(medications, doseEvents);
  const recentDoses = doseEvents.slice(-15).reverse();
  const medName = new Map(medications.map((m) => [m.id, m.nickname || m.concept.displayText]));

  const moodSummary = stateOfMind.length ? `
    <div class="section">State of Mind</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Entries</div><div class="stat-value">${stateOfMind.length.toLocaleString()}</div></div>
      <div class="stat-row"><div class="stat-label">Range</div><div class="stat-value">${formatDateShort(stateOfMind[0].date)} – ${formatDateShort(stateOfMind[stateOfMind.length - 1].date)}</div></div>
      <div class="stat-row"><div class="stat-label">Average mood</div><div class="stat-value">${valenceBadge(avgValence(stateOfMind))}</div></div>
    </div>

    <div class="section">Mood vs. training</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">On workout days</div><div class="stat-value">${corr.onWorkout != null ? valenceBadge(corr.onWorkout) + ` <span style="color:var(--text-tertiary)">(${corr.onCount})</span>` : '—'}</div></div>
      <div class="stat-row"><div class="stat-label">On rest days</div><div class="stat-value">${corr.offWorkout != null ? valenceBadge(corr.offWorkout) + ` <span style="color:var(--text-tertiary)">(${corr.offCount})</span>` : '—'}</div></div>
      <div class="stat-row"><div class="stat-label">Difference</div><div class="stat-value">${corr.delta != null ? (corr.delta >= 0 ? '+' : '') + corr.delta.toFixed(2) : '—'}</div></div>
    </div>

    <div class="section">Recent entries</div>
    <div class="list">
      ${stateOfMind.slice(-20).reverse().map(moodRow).join('')}
    </div>
  ` : '';

  const medSummary = medications.length ? `
    <div class="section">Medications</div>
    <div class="list">
      ${adherence.map((a) => `
        <div class="list-row">
          <div class="row-main">
            <div class="row-title">${esc(a.medication.nickname || a.medication.concept.displayText)}${a.medication.isArchived ? ' <span style="color:var(--text-tertiary)">(archived)</span>' : ''}</div>
            <div class="row-subtitle">${esc([a.medication.concept.form].filter(Boolean).join(' · ')) || 'No form set'}</div>
          </div>
          <div class="row-trailing">${a.pct != null ? Math.round(a.pct * 100) + '%' : '—'}<br><span style="font-size:12px;color:var(--text-tertiary)">${a.taken}/${a.total} taken</span></div>
          ${delBtn('medications', a.medication.id)}
        </div>
      `).join('')}
    </div>
    <div class="section-footer">Adherence = taken ÷ (taken + skipped).</div>

    ${recentDoses.length ? `
    <div class="section">Recent doses</div>
    <div class="list">
      ${recentDoses.map((d) => `
        <div class="list-row">
          <div class="row-main">
            <div class="row-title">${esc(medName.get(d.medicationId) || 'Medication')}</div>
            <div class="row-subtitle">${formatDateShort(d.date)}</div>
          </div>
          <div class="row-trailing">${esc(STATUS_WORD[d.status] || d.status)}</div>
          ${delBtn('doseEvents', d.id)}
        </div>
      `).join('')}
    </div>` : ''}
  ` : '';

  return moodSummary + medSummary;
}

function delBtn(store, id) {
  return `<button data-del-store="${store}" data-del-id="${esc(id)}" aria-label="Delete" style="color: var(--text-tertiary); font-size: 18px; padding: 4px 8px; flex-shrink: 0;">✕</button>`;
}

function moodRow(m) {
  const labels = m.labels.length ? m.labels.join(', ') : (m.kind === 'dailyMood' ? 'Daily mood' : 'Momentary');
  return `
    <div class="list-row">
      <div class="row-main">
        <div class="row-title">${esc(labels)}</div>
        <div class="row-subtitle">${formatDateShort(m.date)}${m.associations.length ? ' · ' + esc(m.associations.join(', ')) : ''}</div>
      </div>
      <div class="row-trailing">${valenceBadge(m.valence)}</div>
      ${delBtn('stateOfMind', m.id)}
    </div>`;
}

function avgValence(rows) {
  return rows.reduce((a, r) => a + r.valence, 0) / rows.length;
}

/** A colored word for a valence in -1..1 (green pleasant → red unpleasant). */
function valenceBadge(v) {
  const word = v >= 0.5 ? 'Very pleasant'
    : v >= 0.15 ? 'Pleasant'
    : v > -0.15 ? 'Neutral'
    : v > -0.5 ? 'Unpleasant'
    : 'Very unpleasant';
  const hue = Math.round((v + 1) / 2 * 140);  // 0 red at -1 → 140 green at +1
  return `<span style="color: hsl(${hue} 65% 42%); font-weight: 600;">${word}</span>`;
}

// ---------- Entry forms ----------

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
        <div class="form-section">
          <div class="form-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
            <div id="som-val-label" style="text-align: center; font-weight: 600;"></div>
            <input type="range" class="chart-range" id="som-val" min="-3" max="3" step="1" value="1" />
          </div>
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
      const paint = () => {
        const i = Number(slider.value) + 3;
        const v = Number(slider.value) / 3;
        const hue = Math.round((v + 1) / 2 * 140);
        label.innerHTML = `<span style="color: hsl(${hue} 65% 42%)">${VALENCE_STEPS[i]}</span>`;
      };
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
        emit('data:changed');
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
        emit('data:changed');
        showToast('Medication added');
        onSaved?.();
      });
      setTimeout(() => name.focus(), 50);
    },
  });
}

function openDoseForm(medications, onSaved) {
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
              ${list.map((m) => `<option value="${esc(m.id)}">${esc(m.nickname || m.concept.displayText)}</option>`).join('')}
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
        emit('data:changed');
        showToast('Dose logged');
        onSaved?.();
      });
    },
  });
}
