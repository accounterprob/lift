import { getFinishedWorkouts, getAll } from '../db.js';
import { esc, formatVolume, formatDateShort, formatLbs } from '../utils.js';
import { openBackupSheet } from '../backup.js';

export function renderProgressTab(ctx) {
  let mounted = true;
  renderProgress(ctx).catch((err) => {
    if (mounted) ctx.container.innerHTML = `<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${esc(err.message || String(err))}</p></div>`;
  });
  return () => { mounted = false; };
}

async function renderProgress(ctx) {
  ctx.setTitle('Progress');
  ctx.setBack(null);
  ctx.setAction({
    html: shareIcon(),
    onClick: () => openBackupSheet(),
  });

  const [workouts, allSets, allExercises] = await Promise.all([
    getFinishedWorkouts(),
    getAll('sets'),
    getAll('exercises'),
  ]);

  if (workouts.length === 0) {
    ctx.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📈</div>
        <h2>No data yet</h2>
        <p>Finish a workout and your stats and trends will show up here.</p>
      </div>
    `;
    return;
  }

  const exMap = new Map(allExercises.map((e) => [e.id, e]));
  const setsByWorkout = new Map();
  for (const s of allSets) {
    if (!setsByWorkout.has(s.workoutId)) setsByWorkout.set(s.workoutId, []);
    setsByWorkout.get(s.workoutId).push(s);
  }

  let totalVolume = 0;
  let totalSets = 0;
  const volumePoints = [];
  const exerciseCounts = new Map(); // id -> { name, count }
  const bestByExercise = new Map(); // id -> { weight, reps, e1, date, name }

  const now = Date.now();
  const eightWeeks = 56 * 24 * 60 * 60 * 1000;
  const cutoff = now - eightWeeks;

  for (const w of workouts) {
    const sets = setsByWorkout.get(w.id) || [];
    const completed = sets.filter((s) => s.completed);
    const vol = completed.reduce((s, x) => s + x.weight * x.reps, 0);
    totalVolume += vol;
    totalSets += completed.length;

    if (w.startedAt >= cutoff) {
      volumePoints.push({ date: w.startedAt, value: vol });
    }

    for (const s of completed) {
      const ex = exMap.get(s.exerciseId);
      if (!ex) continue;
      const ec = exerciseCounts.get(s.exerciseId) || { name: ex.name, count: 0 };
      ec.count += 1;
      exerciseCounts.set(s.exerciseId, ec);

      if (s.weight > 0 && s.reps > 0) {
        const cur = bestByExercise.get(s.exerciseId);
        // Track heaviest weight ever lifted on this exercise; tie-break by reps.
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
    .slice(0, 5);

  const prs = Array.from(bestByExercise.values()).sort((a, b) => b.weight - a.weight);

  const weekStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // Sunday-start
    return d.getTime();
  })();
  const workoutsThisWeek = workouts.filter((w) => w.startedAt >= weekStart).length;

  ctx.container.innerHTML = `
    <div class="section">Totals</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Workouts</div><div class="stat-value">${workouts.length}</div></div>
      <div class="stat-row"><div class="stat-label">Total Volume</div><div class="stat-value">${Math.round(totalVolume).toLocaleString()} lbs</div></div>
      <div class="stat-row"><div class="stat-label">Total Sets</div><div class="stat-value">${totalSets}</div></div>
      <div class="stat-row"><div class="stat-label">This Week</div><div class="stat-value">${workoutsThisWeek} workout${workoutsThisWeek === 1 ? '' : 's'}</div></div>
    </div>

    ${volumePoints.length > 0 ? `
      <div class="section">Volume — last 8 weeks</div>
      <div class="chart-container">${barChartSvg(volumePoints)}</div>
    ` : ''}

    ${topExercises.length > 0 ? `
      <div class="section">Most-Trained Exercises</div>
      <div class="form-section">
        ${topExercises.map(([, e]) => `
          <div class="stat-row">
            <div class="stat-label">${esc(e.name)}</div>
            <div class="stat-value">${e.count} set${e.count === 1 ? '' : 's'}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${prs.length > 0 ? `
      <div class="section">Personal Records (heaviest set)</div>
      <div class="form-section">
        ${prs.map((pr) => `
          <div class="stat-row" style="align-items: flex-start;">
            <div class="stat-label">
              <div>${esc(pr.name)}</div>
              <div style="font-size: 12px; color: var(--text-tertiary);">${formatDateShort(pr.date)}</div>
            </div>
            <div class="stat-value" style="text-align: right;">
              <div style="font-weight: 600; color: var(--text);">${formatLbs(pr.weight)} lbs</div>
              <div style="font-size: 12px; color: var(--text-tertiary);">${pr.reps} rep${pr.reps === 1 ? '' : 's'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function shareIcon() {
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>`;
}

function barChartSvg(data) {
  const W = 400, H = 220;
  const pad = { top: 16, right: 12, bottom: 24, left: 44 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  if (data.length === 0) {
    return `<svg viewBox="0 0 ${W} ${H}"></svg>`;
  }

  const maxY = Math.max(...data.map((d) => d.value), 1);
  const yScale = (y) => pad.top + innerH - (y / maxY) * innerH;
  const barWidth = Math.max(2, Math.min(28, innerW / data.length - 4));
  const spacing = innerW / data.length;

  const ticks = 4;
  const yLabels = Array.from({ length: ticks + 1 }, (_, i) => {
    const val = (maxY * i) / ticks;
    const y = yScale(val);
    return `<text x="${pad.left - 6}" y="${y + 3}" text-anchor="end" class="chart-axis-label">${formatVolumeShort(val)}</text>`;
  }).join('');

  const grid = Array.from({ length: ticks + 1 }, (_, i) => {
    const y = pad.top + (innerH * i) / ticks;
    return `<line x1="${pad.left}" x2="${W - pad.right}" y1="${y}" y2="${y}" class="chart-axis-line"/>`;
  }).join('');

  const sortedData = [...data].sort((a, b) => a.date - b.date);
  const bars = sortedData
    .map((d, i) => {
      const x = pad.left + spacing * i + (spacing - barWidth) / 2;
      const y = yScale(d.value);
      const h = pad.top + innerH - y;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${h.toFixed(1)}" rx="2" class="chart-bar"/>`;
    })
    .join('');

  return `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      ${grid}
      ${yLabels}
      ${bars}
    </svg>
  `;
}

function formatVolumeShort(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}
