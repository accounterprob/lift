import {
  getAll, get, del, getActiveWorkout, performedSets,
} from '../db.js';
import {
  esc, formatLbs, formatDateShort, emit, showSheet, trashIcon, errorState,
} from '../utils.js';
import { openExerciseForm } from './workout.js';
import { openWorkoutDetailSheet } from './progress.js';
import { primaryMuscleFor, displayName, exerciseRowMain, setCountLabel, muscleChipsHtml } from '../seed.js';
import { mountTimeSeriesChart } from '../charts.js';

export function renderExercisesTab(ctx) {
  let mounted = true;
  renderList(ctx).catch((err) => {
    if (mounted) ctx.container.innerHTML = errorState(err);
  });
  return () => { mounted = false; };
}

async function renderList(ctx) {
  ctx.setTitle('Exercises');
  ctx.setBack(null);
  ctx.setAction({
    label: 'Add exercise',
    html: '<span style="font-size: 24px;">+</span>',
    onClick: () => {
      openExerciseForm(null);  // create mode emits data:changed itself
    },
  });

  const [rawExercises, allSets] = await Promise.all([getAll('exercises'), getAll('sets')]);
  const allExercises = rawExercises.sort((a, b) => a.name.localeCompare(b.name));
  const setCounts = new Map();
  for (const s of allSets) {
    setCounts.set(s.exerciseId, (setCounts.get(s.exerciseId) ?? 0) + 1);
  }

  let search = '';
  let category = null;

  ctx.container.innerHTML = `
    <div class="search-bar">
      <input class="search-input" id="ex-search" placeholder="Search exercises" />
    </div>
    <div class="chip-row" id="ex-chips"></div>
    <div class="list" id="ex-list"></div>
  `;

  const listEl = ctx.container.querySelector('#ex-list');
  const chipsEl = ctx.container.querySelector('#ex-chips');
  const searchInput = ctx.container.querySelector('#ex-search');

  function renderChips() {
    chipsEl.innerHTML = muscleChipsHtml(allExercises, category);
    for (const chip of chipsEl.querySelectorAll('.chip')) {
      chip.addEventListener('click', () => {
        const c = chip.dataset.cat;
        category = c === 'All' ? null : c;
        renderChips();
        renderRows();
      });
    }
  }

  function renderRows() {
    const filtered = allExercises
      .filter((e) => !category || primaryMuscleFor(e) === category)
      .filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()));

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((e) => `
        <button class="list-row" data-id="${e.id}">
          ${exerciseRowMain(e)}
          <div class="row-trailing trailing-stack">${setCountLabel(setCounts.get(e.id) ?? 0)}</div>
          <div class="chevron">›</div>
        </button>
      `)
      .join('');

    for (const row of listEl.querySelectorAll('[data-id]')) {
      row.addEventListener('click', () => {
        renderDetail(ctx, row.dataset.id).catch((err) => {
          ctx.container.innerHTML = errorState(err);
        });
      });
    }
  }

  searchInput.addEventListener('input', () => {
    search = searchInput.value;
    renderRows();
  });

  renderChips();
  renderRows();
}

function renderDetail(ctx, exerciseId) {
  return renderExerciseDetailPage(ctx, exerciseId, () => renderList(ctx));
}

/**
 * Full-page exercise detail (history/stats/chart) rendered into the current
 * tab's view, with the nav back button wired to `onBack` — used by the
 * Exercises tab list and by tapping a movement's name in the active workout,
 * so both navigations look and behave identically (tab bar stays visible).
 */
export async function renderExerciseDetailPage(ctx, exerciseId, onBack) {
  ctx.setBack(onBack);

  const detail = await buildExerciseDetail(exerciseId);
  if (!detail) {
    ctx.container.innerHTML = errorState({ message: 'Exercise not found.' });
    return;
  }

  ctx.setTitle(displayName(detail.exercise));
  ctx.setAction(detail.exercise.isCustom
    ? {
        label: 'Delete exercise',
        html: trashIcon(),
        onClick: async () => {
          if (detail.completed.length > 0) {
            alert(`Can't delete — this exercise has ${detail.completed.length} logged set${detail.completed.length === 1 ? '' : 's'}.`);
            return;
          }
          if (!confirm('Delete this custom exercise?')) return;
          await del('exercises', exerciseId);
          emit('data:changed');
        },
      }
    : null);

  ctx.container.innerHTML = detail.html;
  ctx.container.scrollTop = 0;
  ctx.container.querySelector('#exd-edit')?.addEventListener('click', () => {
    openExerciseForm(detail.exercise, () => renderExerciseDetailPage(ctx, exerciseId, onBack));
  });
  wireRecentSetLinks(ctx.container);
  const mount = ctx.container.querySelector('.exercise-chart-mount');
  if (mount && detail.chartData.length > 0) {
    mountTimeSeriesChart(mount, detail.chartData, { unit: 'lbs' });
  }
}

/** Each Recent Sets row opens the workout that set came from, in a sheet. */
function wireRecentSetLinks(rootEl) {
  for (const el of rootEl.querySelectorAll('.recent-set[data-workout-id]')) {
    el.addEventListener('click', () => openWorkoutDetailSheet(el.dataset.workoutId));
  }
}

/**
 * Opens the per-exercise history/stats/chart in a bottom sheet — used from the
 * active workout so you can tap a movement's name and see its progression
 * without leaving your workout.
 */
export async function openExerciseDetailSheet(exerciseId) {
  const detail = await buildExerciseDetail(exerciseId);
  if (!detail) return;
  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="exd-close">Done</button>
        <div class="title">${esc(displayName(detail.exercise))}</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">${detail.html}</div>
    `,
    onMount(sheet) {
      sheet.querySelector('#exd-close').addEventListener('click', () => dismiss());
      sheet.querySelector('#exd-edit')?.addEventListener('click', () => {
        openExerciseForm(detail.exercise, () => {
          // Refresh the active workout behind the sheet, then reopen the sheet
          // with the updated name/details.
          dismiss();
          emit('data:changed');
          openExerciseDetailSheet(exerciseId);
        });
      });
      wireRecentSetLinks(sheet);
      const mount = sheet.querySelector('.exercise-chart-mount');
      if (mount && detail.chartData.length > 0) {
        mountTimeSeriesChart(mount, detail.chartData, { unit: 'lbs' });
      }
    },
  });
}

/** Computes stats + chart data + HTML body for an exercise. Returns null if not found. */
async function buildExerciseDetail(exerciseId) {
  const [exercise, allSets, allWorkouts, active] = await Promise.all([
    get('exercises', exerciseId),
    getAll('sets'),
    getAll('workouts'),
    getActiveWorkout(),
  ]);
  if (!exercise) return null;

  const workoutMap = new Map(allWorkouts.map((w) => [w.id, w]));
  // performedSets needs the full set list (workout completion is judged across
  // ALL of a workout's sets); the in-progress workout is excluded by id so
  // half-done sessions don't pollute the stats. Imported history (no completed
  // flags, no endedAt) counts — same rule as records, PRs, and Progress.
  const completed = performedSets(allSets)
    .filter((s) => s.exerciseId === exerciseId && s.workoutId !== active?.id && workoutMap.has(s.workoutId))
    .map((s) => ({ ...s, workout: workoutMap.get(s.workoutId) }))
    .sort((a, b) => a.workout.startedAt - b.workout.startedAt);

  const totalVolume = completed.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const bestSet = completed.reduce(
    (best, s) => (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) ? s : best,
    null
  );

  // One point per workout: average working-set volume that day (warmups out).
  const byWorkout = new Map();
  for (const s of completed) {
    if (s.weight <= 0 || s.reps <= 0) continue;
    if ((s.setType || 'working') === 'warmup') continue;
    const cur = byWorkout.get(s.workoutId) || { date: s.workout.startedAt, total: 0, count: 0 };
    cur.total += s.weight * s.reps;
    cur.count += 1;
    byWorkout.set(s.workoutId, cur);
  }
  const chartData = Array.from(byWorkout.values())
    .map(({ date, total, count }) => ({ date, value: total / count }))
    .sort((a, b) => a.date - b.date);

  const html = `
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${esc(exercise.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Muscle</div><div class="stat-value">${esc(primaryMuscleFor(exercise))}</div></div>
      <button class="list-row button" id="exd-edit">
        <div class="row-main"><div class="row-title" style="color: var(--accent);">Edit Name, Muscle & Equipment</div></div>
      </button>
    </div>

    ${completed.length > 0 ? `
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${completed.length.toLocaleString()}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${Math.round(totalVolume).toLocaleString()} lbs</div></div>
        ${bestSet ? `<div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${formatLbs(bestSet.weight)} × ${bestSet.reps}</div></div>` : ''}
      </div>
    ` : ''}

    ${chartData.length > 0 ? `
      <div class="section">Avg working-set volume per workout</div>
      <div class="exercise-chart-mount"></div>
    ` : ''}

    ${completed.length > 0 ? `
      <div class="section">Recent Sets · tap to view that workout</div>
      <div class="form-section">
        ${completed.slice(-30).reverse().map((s) => `
          <button class="stat-row recent-set" data-workout-id="${esc(s.workoutId)}">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${formatDateShort(s.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${formatLbs(s.weight)} × ${s.reps} <span class="name-chevron">›</span></div>
          </button>
        `).join('')}
      </div>
    ` : `
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;

  return { exercise, completed, chartData, html };
}
