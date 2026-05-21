import {
  getAll, getExerciseSets, del,
} from '../db.js';
import {
  esc, formatLbs, formatDateShort, emit, formatWeight,
} from '../utils.js';
import { openAddCustomExercise } from './workout.js';

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
    html: '<span style="font-size: 24px;">+</span>',
    onClick: () => {
      openAddCustomExercise(() => emit('data:changed'));
    },
  });

  const allExercises = (await getAll('exercises'))
    .sort((a, b) => a.name.localeCompare(b.name));

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
    const cats = ['All', ...new Set(allExercises.map((e) => e.category))];
    chipsEl.innerHTML = cats
      .map((c) => {
        const active = (c === 'All' && !category) || c === category;
        return `<button class="chip${active ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`;
      })
      .join('');
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
      .filter((e) => !category || e.category === category)
      .filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()));

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="list-row"><div class="row-main" style="color: var(--text-secondary);">No matches</div></div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((e) => `
        <button class="list-row" data-id="${e.id}">
          <div class="row-main">
            <div class="row-title">${esc(e.name)}${e.isCustom ? ' <span class="badge">Custom</span>' : ''}</div>
            <div class="row-subtitle">${esc(e.equipment)} · ${esc(e.category)}</div>
          </div>
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

async function renderDetail(ctx, exerciseId) {
  ctx.setBack(() => renderList(ctx));

  const [allExercises, exerciseSets, allWorkouts] = await Promise.all([
    getAll('exercises'),
    getExerciseSets(exerciseId),
    getAll('workouts'),
  ]);

  const exercise = allExercises.find((e) => e.id === exerciseId);
  if (!exercise) {
    ctx.container.innerHTML = errorState({ message: 'Exercise not found.' });
    return;
  }

  ctx.setTitle(exercise.name);
  ctx.setAction(exercise.isCustom
    ? {
        html: trashIcon(),
        onClick: async () => {
          const usedSets = exerciseSets.length;
          if (usedSets > 0) {
            alert(`Can't delete — this exercise has ${usedSets} logged set${usedSets === 1 ? '' : 's'}.`);
            return;
          }
          if (!confirm('Delete this custom exercise?')) return;
          await del('exercises', exerciseId);
          emit('data:changed');
        },
      }
    : null);

  const workoutMap = new Map(allWorkouts.map((w) => [w.id, w]));
  const completed = exerciseSets
    .filter((s) => s.completed && workoutMap.get(s.workoutId)?.endedAt)
    .map((s) => ({ ...s, workout: workoutMap.get(s.workoutId) }))
    .sort((a, b) => a.workout.startedAt - b.workout.startedAt);

  const totalVolume = completed.reduce((sum, s) => sum + s.weight * s.reps, 0);
  // Heaviest set on this exercise (tie-break by reps)
  const bestSet = completed.reduce(
    (best, s) => (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) ? s : best,
    null
  );

  // One point per workout: the AVERAGE working-set volume that day.
  // Warmups are excluded and same-day sets are collapsed so the line tracks
  // session-to-session progression instead of jumping around within a single
  // workout.
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

  ctx.container.innerHTML = `
    <div class="section">Details</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Equipment</div><div class="stat-value">${esc(exercise.equipment)}</div></div>
      <div class="stat-row"><div class="stat-label">Category</div><div class="stat-value">${esc(exercise.category)}</div></div>
      ${exercise.notes ? `<div class="stat-row" style="flex-direction: column; align-items: flex-start; gap: 4px;"><div class="stat-label">Notes</div><div style="color: var(--text-secondary);">${esc(exercise.notes)}</div></div>` : ''}
    </div>

    ${completed.length > 0 ? `
      <div class="section">Stats</div>
      <div class="form-section">
        <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${completed.length}</div></div>
        <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${Math.round(totalVolume).toLocaleString()} lbs</div></div>
        ${bestSet ? `
          <div class="stat-row"><div class="stat-label">Best Set</div><div class="stat-value">${formatLbs(bestSet.weight)} × ${bestSet.reps}</div></div>
        ` : ''}
      </div>
    ` : ''}

    ${chartData.length > 0 ? `
      <div class="section">Avg working-set volume per workout</div>
      <div class="chart-container">
        ${lineChartSvg(chartData)}
      </div>
    ` : ''}

    ${completed.length > 0 ? `
      <div class="section">Recent Sets</div>
      <div class="form-section">
        ${completed.slice(-30).reverse().map((s) => `
          <div class="stat-row">
            <div class="stat-label" style="font-size: 13px; color: var(--text-secondary);">${formatDateShort(s.workout.startedAt)}</div>
            <div class="stat-value" style="color: var(--text);">${formatLbs(s.weight)} × ${s.reps}</div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="empty-state" style="padding: 32px 24px;">
        <p style="color: var(--text-secondary);">No completed sets yet.</p>
      </div>
    `}
  `;
}

function trashIcon() {
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
}

function errorState(err) {
  return `<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${esc(err.message || String(err))}</p></div>`;
}

// ----- Inline SVG line chart -----
export function lineChartSvg(data) {
  const W = 400, H = 220;
  const pad = { top: 20, right: 16, bottom: 26, left: 44 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  if (data.length < 2) {
    // Render the single point dead-center so the user sees their one data
    // point instead of an unhelpful "Need at least two data points" message.
    const x = pad.left + innerW / 2;
    const y = pad.top + innerH / 2;
    return `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <circle cx="${x}" cy="${y}" r="4" class="chart-point"/>
        <text x="${x}" y="${y - 10}" text-anchor="middle" class="chart-axis-label">${data.length === 1 ? `${Math.round(data[0].value)} lbs` : 'No working sets yet'}</text>
      </svg>
    `;
  }

  const xs = data.map((d) => +new Date(d.date));
  const ys = data.map((d) => d.value);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const minY = Math.min(...ys);
  const yRange = Math.max(maxY - minY, 1);
  const yPad = yRange * 0.15;
  const yMin = Math.max(0, minY - yPad);
  const yMax = maxY + yPad;

  const xScale = (x) => pad.left + ((x - minX) / Math.max(maxX - minX, 1)) * innerW;
  const yScale = (y) => pad.top + innerH - ((y - yMin) / (yMax - yMin)) * innerH;

  const linePath = data
    .map((d, i) => {
      const x = xScale(+new Date(d.date));
      const y = yScale(d.value);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const dots = data
    .map((d) => {
      const x = xScale(+new Date(d.date));
      const y = yScale(d.value);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" class="chart-point"/>`;
    })
    .join('');

  const ticks = 4;
  const fmt = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));
  const yLabels = Array.from({ length: ticks + 1 }, (_, i) => {
    const val = yMin + ((yMax - yMin) * i) / ticks;
    const y = yScale(val);
    return `<text x="${pad.left - 6}" y="${y + 3}" text-anchor="end" class="chart-axis-label">${fmt(val)}</text>`;
  }).join('');

  const grid = Array.from({ length: ticks + 1 }, (_, i) => {
    const y = pad.top + (innerH * i) / ticks;
    return `<line x1="${pad.left}" x2="${W - pad.right}" y1="${y}" y2="${y}" class="chart-axis-line"/>`;
  }).join('');

  return `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      ${grid}
      ${yLabels}
      <path d="${linePath}" class="chart-line"/>
      ${dots}
    </svg>
  `;
}
