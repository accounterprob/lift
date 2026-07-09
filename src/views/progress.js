import {
  getFinishedWorkouts, getAll, get, getWorkoutSets, deleteWorkoutAndSets, put,
  performedSets,
} from '../db.js';
import {
  esc, formatVolumeLbs, formatDateShort, formatDateLong, formatDurationShort,
  formatLbs, emit, shareIcon, trashIcon, errorState, showSheet, debounce,
} from '../utils.js';
import { openBackupSheet } from '../backup.js';
import { mountTimeSeriesChart } from '../charts.js';
import { openExerciseDetailSheet } from './exercises.js';
import { displayName, exerciseRowMain, setCountLabel } from '../seed.js';

// Cached snapshot per render of the Progress tab so sub-pages don't reload
// from IndexedDB on every navigation.
let snapshot = null;

export function renderProgressTab(ctx) {
  let mounted = true;
  loadSnapshot().then((snap) => {
    if (!mounted) return;
    snapshot = snap;
    renderOverview(ctx);
  }).catch((err) => {
    if (mounted) ctx.container.innerHTML = errorState(err);
  });
  return () => { mounted = false; };
}

async function loadSnapshot() {
  const [workouts, allSets, allExercises] = await Promise.all([
    getFinishedWorkouts(),
    getAll('sets'),
    getAll('exercises'),
  ]);
  const exMap = new Map(allExercises.map((e) => [e.id, e]));
  // performedSets: the shared in-app vs imported rule, so Progress totals and
  // history agree with the volume bars, records, and PR detection.
  const setsByWorkout = new Map();
  for (const s of performedSets(allSets)) {
    if (!setsByWorkout.has(s.workoutId)) setsByWorkout.set(s.workoutId, []);
    setsByWorkout.get(s.workoutId).push(s);
  }

  let totalVolume = 0;
  let totalSets = 0;
  const volumePoints = [];
  const exerciseCounts = new Map();
  const bestByExercise = new Map();

  for (const w of workouts) {
    const completed = setsByWorkout.get(w.id) || [];
    const vol = completed.reduce((s, x) => s + x.weight * x.reps, 0);
    totalVolume += vol;
    totalSets += completed.length;

    // All workouts — the chart's period selector handles the time window.
    if (vol > 0) volumePoints.push({ date: w.startedAt, value: vol });

    for (const s of completed) {
      const ex = exMap.get(s.exerciseId);
      if (!ex) continue;
      const ec = exerciseCounts.get(s.exerciseId) || { id: s.exerciseId, exercise: ex, count: 0 };
      ec.count += 1;
      exerciseCounts.set(s.exerciseId, ec);

      if (s.weight > 0 && s.reps > 0) {
        const cur = bestByExercise.get(s.exerciseId);
        if (!cur || s.weight > cur.weight || (s.weight === cur.weight && s.reps > cur.reps)) {
          bestByExercise.set(s.exerciseId, {
            id: s.exerciseId, weight: s.weight, reps: s.reps, date: w.startedAt, name: displayName(ex),
          });
        }
      }
    }
  }

  const topExercises = Array.from(exerciseCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([, e]) => e);
  const prs = Array.from(bestByExercise.values()).sort((a, b) => b.weight - a.weight);

  return { workouts, allSets, allExercises, exMap, setsByWorkout, totalVolume, totalSets, volumePoints, topExercises, prs };
}

function renderOverview(ctx) {
  ctx.setTitle('Progress');
  ctx.setBack(null);
  ctx.setAction({
    html: shareIcon(),
    onClick: () => openBackupSheet(),
  });

  if (!snapshot || snapshot.workouts.length === 0) {
    ctx.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📈</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
    `;
    return;
  }

  const { workouts, totalVolume, totalSets, volumePoints, topExercises, prs } = snapshot;

  ctx.container.innerHTML = `
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${Math.round(totalVolume).toLocaleString()} lbs</div></div>
      <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${totalSets.toLocaleString()}</div></div>
    </div>

    ${volumePoints.length > 0 ? `
      <div class="section">Workout Volume</div>
      <div class="volume-chart-mount"></div>
    ` : ''}

    <div class="list" style="margin-top: 16px;">
      <button class="list-row" data-page="trained">
        <div class="row-main">
          <div class="row-title">Most-Trained Exercises</div>
          <div class="row-subtitle">${topExercises.length} tracked</div>
        </div>
        <div class="chevron">›</div>
      </button>
      <button class="list-row" data-page="prs">
        <div class="row-main">
          <div class="row-title">Personal Records</div>
          <div class="row-subtitle">${prs.length} exercises</div>
        </div>
        <div class="chevron">›</div>
      </button>
      <button class="list-row" data-page="history">
        <div class="row-main">
          <div class="row-title">Workout History</div>
          <div class="row-subtitle">${workouts.length} workout${workouts.length === 1 ? '' : 's'}</div>
        </div>
        <div class="chevron">›</div>
      </button>
    </div>
  `;

  const chartMount = ctx.container.querySelector('.volume-chart-mount');
  if (chartMount && volumePoints.length > 0) {
    mountTimeSeriesChart(chartMount, volumePoints, { unit: 'lbs' });
  }

  for (const row of ctx.container.querySelectorAll('[data-page]')) {
    row.addEventListener('click', () => {
      const page = row.dataset.page;
      if (page === 'trained') renderMostTrained(ctx);
      else if (page === 'prs') renderPRs(ctx);
      else if (page === 'history') renderHistoryList(ctx);
    });
  }
}

function renderMostTrained(ctx) {
  ctx.setTitle('Most-Trained');
  ctx.setBack(() => renderOverview(ctx));
  ctx.setAction(null);

  const { topExercises } = snapshot;
  ctx.container.innerHTML = `
    <div class="list" style="margin-top: 16px;">
      ${topExercises.map((e) => `
        <button class="list-row" data-exercise-id="${esc(e.id)}">
          ${exerciseRowMain(e.exercise)}
          <div class="row-trailing trailing-stack">${setCountLabel(e.count)}</div>
          <div class="chevron">›</div>
        </button>
      `).join('')}
    </div>
  `;

  wireExerciseLinks(ctx);
}

function renderPRs(ctx) {
  ctx.setTitle('Personal Records');
  ctx.setBack(() => renderOverview(ctx));
  ctx.setAction(null);

  const { prs } = snapshot;
  ctx.container.innerHTML = `
    <div class="section-footer" style="margin-top: 16px;">Heaviest set ever recorded per exercise.</div>
    <div class="list">
      ${prs.map((pr) => `
        <button class="list-row" data-exercise-id="${esc(pr.id)}" style="align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${esc(pr.name)}</div>
            <div class="row-subtitle">${formatDateShort(pr.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${formatLbs(pr.weight)} lbs</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${pr.reps} rep${pr.reps === 1 ? '' : 's'}</div>
          </div>
          <div class="chevron">›</div>
        </button>
      `).join('')}
    </div>
  `;

  wireExerciseLinks(ctx);
}

/**
 * Wires every `[data-exercise-id]` element in the current view to open that
 * movement's history/stats page in a bottom sheet — used by Most-Trained,
 * Personal Records, and the workout-history detail.
 */
function wireExerciseLinks(ctx) {
  for (const el of ctx.container.querySelectorAll('[data-exercise-id]')) {
    el.addEventListener('click', () => {
      openExerciseDetailSheet(el.dataset.exerciseId);
    });
  }
}

function renderHistoryList(ctx) {
  ctx.setTitle('Workout History');
  ctx.setBack(() => renderOverview(ctx));
  ctx.setAction(null);

  const { workouts, setsByWorkout, exMap } = snapshot;
  ctx.container.innerHTML = `
    <div class="list" style="margin-top: 16px;">
      ${workouts.map((w) => renderHistoryRow(w, setsByWorkout.get(w.id) || [], exMap)).join('')}
    </div>
  `;

  for (const row of ctx.container.querySelectorAll('[data-workout-id]')) {
    row.addEventListener('click', () => {
      const wid = row.dataset.workoutId;
      renderWorkoutDetail(ctx, wid).catch((err) => {
        ctx.container.innerHTML = errorState(err);
      });
    });
  }
}

function renderHistoryRow(workout, sets, exMap) {
  // `sets` already passed through performedSets in loadSnapshot.
  const completed = sets;
  const volume = completed.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const duration = (workout.endedAt - workout.startedAt) / 1000;
  const exNames = [];
  const seen = new Set();
  for (const s of sets) {
    if (seen.has(s.exerciseId)) continue;
    seen.add(s.exerciseId);
    const ex = exMap.get(s.exerciseId);
    if (ex) exNames.push(ex.name);
    if (exNames.length >= 3) break;
  }

  return `
    <button class="list-row" data-workout-id="${workout.id}">
      <div class="row-main">
        <div class="row-title" style="font-weight: 600;">${esc(workout.name)}</div>
        <div class="row-subtitle" style="margin-top: 4px;">
          ${formatDateShort(workout.startedAt)} · ${formatDurationShort(duration)} · ${completed.length} sets · ${formatVolumeLbs(volume)}
        </div>
        ${exNames.length > 0
          ? `<div class="row-subtitle" style="margin-top: 4px;">${esc(exNames.join(' · '))}${seen.size > 3 ? ' …' : ''}</div>`
          : ''}
      </div>
      <div class="chevron">›</div>
    </button>
  `;
}

/**
 * Summary + per-exercise set list for a finished workout. Shared by the
 * history detail page and the workout sheet opened from "Recent Sets".
 * Returns null if the workout doesn't exist.
 */
async function buildWorkoutDetail(workoutId) {
  const [workout, allExercises, allSets] = await Promise.all([
    get('workouts', workoutId),
    getAll('exercises'),
    getWorkoutSets(workoutId),
  ]);
  if (!workout) return null;

  const exMap = new Map(allExercises.map((e) => [e.id, e]));
  const setsByExercise = new Map();
  const exerciseIds = [];
  for (const s of allSets) {
    if (!setsByExercise.has(s.exerciseId)) {
      setsByExercise.set(s.exerciseId, []);
      exerciseIds.push(s.exerciseId);
    }
    setsByExercise.get(s.exerciseId).push(s);
  }

  const counted = performedSets(allSets);
  const totalVolume = counted.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const completedCount = counted.length;
  const duration = (workout.endedAt - workout.startedAt) / 1000;

  const html = `
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${formatDateLong(workout.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${formatDurationShort(duration)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${formatVolumeLbs(totalVolume)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${completedCount}</div></div>
    </div>

    ${exerciseIds.map((eid) => {
      const ex = exMap.get(eid);
      const sets = setsByExercise.get(eid);
      let workingIdx = 0;
      let warmupIdx = 0;
      const heading = ex
        ? `<button class="section section-link" data-exercise-id="${esc(eid)}">${esc(displayName(ex))}<span class="name-chevron">›</span></button>`
        : `<div class="section">Unknown exercise</div>`;
      return `
        ${heading}
        <div class="form-section">
          ${sets.map((s) => {
            const type = s.setType || 'working';
            const label = type === 'warmup' ? `W${++warmupIdx}` : String(++workingIdx);
            return `
              <div class="stat-row">
                <div class="stat-label">Set ${label}</div>
                <div class="stat-value hist-edit">
                  <input class="hist-input" type="number" inputmode="decimal" step="0.5"
                         data-set-id="${s.id}" data-field="weight" value="${s.weight > 0 ? s.weight : ''}" placeholder="0" />
                  <span>lbs ×</span>
                  <input class="hist-input" type="number" inputmode="numeric" step="1"
                         data-set-id="${s.id}" data-field="reps" value="${s.reps > 0 ? s.reps : ''}" placeholder="0" />
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('')}
  `;

  return { workout, html, sets: allSets };
}

/**
 * Makes every set's weight/reps in a workout detail editable in place —
 * fixes like a swapped 10 lbs × 205 save straight to the set record, so all
 * derived stats (records, PRs, charts) pick them up on next render.
 */
function wireSetEditors(rootEl, sets) {
  for (const input of rootEl.querySelectorAll('input.hist-input[data-set-id]')) {
    input.addEventListener('input', debounce(async () => {
      const set = sets.find((s) => s.id === input.dataset.setId);
      if (!set) return;
      if (input.dataset.field === 'weight') set.weight = parseFloat(input.value) || 0;
      else set.reps = parseInt(input.value, 10) || 0;
      await put('sets', set);
    }, 250));
  }
}

async function renderWorkoutDetail(ctx, workoutId) {
  // Edits made here change volumes/PRs, so reload the snapshot on the way back.
  ctx.setBack(async () => {
    snapshot = await loadSnapshot();
    renderHistoryList(ctx);
  });
  ctx.setAction({
    html: trashIcon(),
    onClick: async () => {
      if (!confirm('Delete this workout?')) return;
      await deleteWorkoutAndSets(workoutId);
      emit('data:changed');
    },
  });

  const detail = await buildWorkoutDetail(workoutId);
  if (!detail) {
    ctx.container.innerHTML = errorState({ message: 'Workout not found.' });
    return;
  }

  ctx.setTitle(detail.workout.name);
  ctx.container.innerHTML = detail.html;
  wireExerciseLinks(ctx);
  wireSetEditors(ctx.container, detail.sets);
}

/**
 * Opens a finished workout's summary + sets in a bottom sheet — used by the
 * exercise detail's "Recent Sets" so tapping a set jumps to the workout it
 * came from without leaving the current view (or an active workout).
 */
export async function openWorkoutDetailSheet(workoutId) {
  const detail = await buildWorkoutDetail(workoutId);
  if (!detail) return;
  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="wd-close">Done</button>
        <div class="title">${esc(detail.workout.name)}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${detail.html}</div>
    `,
    onMount(sheet) {
      sheet.querySelector('#wd-close').addEventListener('click', () => dismiss());
      for (const el of sheet.querySelectorAll('[data-exercise-id]')) {
        el.addEventListener('click', () => openExerciseDetailSheet(el.dataset.exerciseId));
      }
      wireSetEditors(sheet, detail.sets);
    },
  });
}
