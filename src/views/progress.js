import {
  getFinishedWorkouts, getAll, getWorkoutSets, deleteWorkoutAndSets,
} from '../db.js';
import {
  esc, formatVolume, formatDateShort, formatDateLong, formatDurationShort,
  formatLbs, emit, shareIcon, trashIcon, errorState,
} from '../utils.js';
import { openBackupSheet } from '../backup.js';
import { mountTimeSeriesChart } from '../charts.js';

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
  const setsByWorkout = new Map();
  for (const s of allSets) {
    if (!setsByWorkout.has(s.workoutId)) setsByWorkout.set(s.workoutId, []);
    setsByWorkout.get(s.workoutId).push(s);
  }

  let totalVolume = 0;
  let totalSets = 0;
  const volumePoints = [];
  const exerciseCounts = new Map();
  const bestByExercise = new Map();

  for (const w of workouts) {
    const sets = setsByWorkout.get(w.id) || [];
    const completed = sets.filter((s) => s.completed);
    const vol = completed.reduce((s, x) => s + x.weight * x.reps, 0);
    totalVolume += vol;
    totalSets += completed.length;

    // All workouts — the chart's period selector handles the time window.
    if (vol > 0) volumePoints.push({ date: w.startedAt, value: vol });

    for (const s of completed) {
      const ex = exMap.get(s.exerciseId);
      if (!ex) continue;
      const ec = exerciseCounts.get(s.exerciseId) || { name: ex.name, count: 0 };
      ec.count += 1;
      exerciseCounts.set(s.exerciseId, ec);

      if (s.weight > 0 && s.reps > 0) {
        const cur = bestByExercise.get(s.exerciseId);
        if (!cur || s.weight > cur.weight || (s.weight === cur.weight && s.reps > cur.reps)) {
          bestByExercise.set(s.exerciseId, {
            weight: s.weight, reps: s.reps, date: w.startedAt, name: ex.name,
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
      <div class="stat-row"><div class="stat-label">Workouts</div><div class="stat-value">${workouts.length}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${Math.round(totalVolume).toLocaleString()} lbs</div></div>
      <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${totalSets}</div></div>
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
        <div class="list-row" style="cursor: default;">
          <div class="row-main">
            <div class="row-title">${esc(e.name)}</div>
          </div>
          <div class="row-trailing">${e.count} set${e.count === 1 ? '' : 's'}</div>
        </div>
      `).join('')}
    </div>
  `;
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
        <div class="list-row" style="cursor: default; align-items: flex-start;">
          <div class="row-main">
            <div class="row-title">${esc(pr.name)}</div>
            <div class="row-subtitle">${formatDateShort(pr.date)}</div>
          </div>
          <div class="row-trailing" style="text-align: right;">
            <div style="font-weight: 600; color: var(--text);">${formatLbs(pr.weight)} lbs</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${pr.reps} rep${pr.reps === 1 ? '' : 's'}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
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
  const completed = sets.filter((s) => s.completed);
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
          ${formatDateShort(workout.startedAt)} · ${formatDurationShort(duration)} · ${completed.length} sets · ${formatVolume(volume)}
        </div>
        ${exNames.length > 0
          ? `<div class="row-subtitle" style="margin-top: 4px;">${esc(exNames.join(' · '))}${seen.size > 3 ? ' …' : ''}</div>`
          : ''}
      </div>
      <div class="chevron">›</div>
    </button>
  `;
}

async function renderWorkoutDetail(ctx, workoutId) {
  ctx.setBack(() => renderHistoryList(ctx));
  ctx.setAction({
    html: trashIcon(),
    onClick: async () => {
      if (!confirm('Delete this workout?')) return;
      await deleteWorkoutAndSets(workoutId);
      emit('data:changed');
    },
  });

  const [workouts, allExercises, allSets] = await Promise.all([
    getFinishedWorkouts(),
    getAll('exercises'),
    getWorkoutSets(workoutId),
  ]);

  const workout = workouts.find((w) => w.id === workoutId);
  if (!workout) {
    ctx.container.innerHTML = errorState({ message: 'Workout not found.' });
    return;
  }

  ctx.setTitle(workout.name);

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

  const totalVolume = allSets
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.weight * s.reps, 0);
  const completedCount = allSets.filter((s) => s.completed).length;
  const duration = (workout.endedAt - workout.startedAt) / 1000;

  ctx.container.innerHTML = `
    <div class="section">Summary</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${formatDateLong(workout.startedAt)}</div></div>
      <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${formatDurationShort(duration)}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${formatVolume(totalVolume)}</div></div>
      <div class="stat-row"><div class="stat-label">Completed Sets</div><div class="stat-value">${completedCount}</div></div>
    </div>

    ${exerciseIds.map((eid) => {
      const ex = exMap.get(eid);
      const sets = setsByExercise.get(eid);
      let workingIdx = 0;
      let warmupIdx = 0;
      return `
        <div class="section">${esc(ex?.name ?? 'Unknown exercise')}</div>
        <div class="form-section">
          ${sets.map((s) => {
            const type = s.setType || 'working';
            const label = type === 'warmup' ? `W${++warmupIdx}` : String(++workingIdx);
            return `
              <div class="stat-row">
                <div class="stat-label">Set ${label}</div>
                <div class="stat-value">${formatLbs(s.weight)} × ${s.reps}${s.completed ? ' ✓' : ''}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('')}
  `;
}
