import { getFinishedWorkouts } from '../db.js';
import { esc, formatDateShort, showToast, emit } from '../utils.js';
import {
  importHealthFile, loadHealth, moodVsWorkouts, adherenceByMedication,
} from '../health.js';

/**
 * Rough-draft Mental Health page: State of Mind + Medications imported from
 * Apple Health via the bridge file, with a first correlation (mood on workout
 * vs. rest days) and dose adherence. Reached from the Progress tab.
 */
export async function renderHealthPage(ctx, onBack) {
  ctx.setTitle('Mental Health');
  ctx.setBack(onBack);
  ctx.setAction(null);

  const [{ stateOfMind, medications, doseEvents }, workouts] = await Promise.all([
    loadHealth(), getFinishedWorkouts(),
  ]);

  const hasData = stateOfMind.length || medications.length;
  ctx.container.innerHTML = `
    <div class="section">Apple Health</div>
    <div class="form-section">
      <button class="list-row button" id="hz-import">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Import Health data…</div></div>
      </button>
    </div>
    <div class="section-footer">
      Reads a <b>health-import</b> JSON file exported from Apple Health (Lift can't
      read Health directly). Re-importing updates existing entries.
    </div>
    ${hasData ? renderData(stateOfMind, medications, doseEvents, workouts) : renderEmpty()}
    <input type="file" id="hz-file" accept=".json,application/json" style="display: none;" />
  `;
  ctx.container.scrollTop = 0;

  const fileInput = ctx.container.querySelector('#hz-file');
  ctx.container.querySelector('#hz-import').addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const c = await importHealthFile(file);
      showToast(`Imported ${c.stateOfMind} moods, ${c.medications} meds, ${c.doseEvents} doses`);
      emit('data:changed');
      renderHealthPage(ctx, onBack);  // re-render with the new data
    } catch (err) {
      showToast(`Import failed: ${err.message}`);
    }
  });
}

function renderEmpty() {
  return `
    <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
      <div class="empty-icon">🧠</div>
      <p style="color: var(--text-secondary); max-width: 300px;">
        No mood or medication data yet. Export it from Apple Health into a
        health-import file, then tap <b>Import Health data</b> above.
      </p>
    </div>`;
}

function renderData(stateOfMind, medications, doseEvents, workouts) {
  const corr = moodVsWorkouts(stateOfMind, workouts);
  const adherence = adherenceByMedication(medications, doseEvents);

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
    <div class="section-footer">A first look. Sleep &amp; daylight correlations come next once the import includes them.</div>

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
            <div class="row-subtitle">${esc([a.medication.concept.displayText, a.medication.concept.form].filter(Boolean).join(' · '))}</div>
          </div>
          <div class="row-trailing">${a.pct != null ? Math.round(a.pct * 100) + '%' : '—'}<br><span style="font-size:12px;color:var(--text-tertiary)">${a.taken}/${a.total} taken</span></div>
        </div>
      `).join('')}
    </div>
    <div class="section-footer">Adherence = taken ÷ (taken + skipped). Next: dose adherence vs. mood.</div>
  ` : '';

  return moodSummary + medSummary;
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
  // hue 0 (red) at -1 → 140 (green) at +1
  const hue = Math.round((v + 1) / 2 * 140);
  return `<span style="color: hsl(${hue} 65% 42%); font-weight: 600;">${word}</span>`;
}
