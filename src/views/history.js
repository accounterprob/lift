import {
  getFinishedWorkouts, getWorkoutSets, getAll, deleteWorkoutAndSets,
} from '../db.js';
import {
  esc, formatDateShort, formatDateLong, formatDurationShort,
  formatVolume, formatLbs, emit,
} from '../utils.js';

export function renderHistoryTab(ctx) {
  let mounted = true;

  renderList(ctx).then((cleanup) => {
    if (!mounted && typeof cleanup === 'function') cleanup();
  }).catch((err) => {
    if (mounted) ctx.container.innerHTML = errorState(err);
  });

  return () => { mounted = false; };
}

async function renderList(ctx) {
  ctx.setTitle('History');
  ctx.setBack(null);
  ctx.setAction(null);

  const workouts = await getFinishedWorkouts();
  if (workouts.length === 0) {
    ctx.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⏱</div>
        <h2>No workouts yet</h2>
        <p>Your finished workouts will show up here.</p>
      </div>
    `;
    return;
  }

  const allSets = await getAll('sets');
  const allExercises = await getAll('exercises');
  const exMap = new Map(allExercises.map((e) => [e.id, e]));
  const setsByWorkout = new Map();
  for (const s of allSets) {
    if (!setsByWorkout.has(s.workoutId)) setsByWorkout.set(s.workoutId, []);
    setsByWorkout.get(s.workoutId).push(s);
  }

  ctx.container.innerHTML = `
    <div class="list" style="margin-top: 16px;">
      ${workouts.map((w) => renderRow(w, setsByWorkout.get(w.id) || [], exMap)).join('')}
    </div>
  `;

  for (const row of ctx.container.querySelectorAll('[data-workout-id]')) {
    row.addEventListener('click', () => {
      const wid = row.dataset.workoutId;
      renderDetail(ctx, wid).catch((err) => {
        ctx.container.innerHTML = errorState(err);
      });
    });
  }
}

function renderRow(workout, sets, exMap) {
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
          ? `<div class="row-subtitle" style="margin-top: 4px;">${esc(exNames.join(' · '))}${sets.length > 0 && seen.size > 3 ? ' …' : ''}</div>`
          : ''}
      </div>
      <div class="chevron">›</div>
    </button>
  `;
}

async function renderDetail(ctx, workoutId) {
  ctx.setBack(() => renderList(ctx));
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

    ${workout.notes ? `
      <div class="section">Notes</div>
      <div class="form-section">
        <div class="form-row" style="white-space: pre-wrap; text-align: left;">${esc(workout.notes)}</div>
      </div>
    ` : ''}

    ${exerciseIds.map((eid) => {
      const ex = exMap.get(eid);
      const sets = setsByExercise.get(eid);
      return `
        <div class="section">${esc(ex?.name ?? 'Unknown exercise')}</div>
        <div class="form-section">
          ${sets.map((s, i) => `
            <div class="stat-row">
              <div class="stat-label">Set ${i + 1}</div>
              <div class="stat-value">${formatLbs(s.weight)} × ${s.reps}${s.completed ? ' ✓' : ''}</div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('')}
  `;
}

function trashIcon() {
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
}

function errorState(err) {
  return `<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${esc(err.message || String(err))}</p></div>`;
}
