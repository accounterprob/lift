import {
  getActiveWorkout,
  getWorkoutSets,
  getExerciseSets,
  getAll,
  getFinishedWorkouts,
  put,
  del,
  deleteWorkoutAndSets,
  lastCompletedSetForExercise,
  previousWorkoutSetsForExercise,
  previousSetsByPositionForExercise,
} from '../db.js';
import {
  uuid, esc, formatDuration, formatWeight, showSheet, emit, debounce, showToast,
} from '../utils.js';
import { MUSCLES, sortMuscles, EQUIPMENT, primaryMuscleFor, colorForMuscle, loggingHintFor } from '../seed.js';
import { downloadBackup } from '../backup.js';
import { openExerciseDetailSheet } from './exercises.js';

export function renderWorkoutTab(ctx) {
  let mounted = true;
  let teardown = null;

  ctx.container.innerHTML = '';

  getActiveWorkout()
    .then((workout) => {
      if (!mounted) return;
      if (!workout) {
        renderStart(ctx);
      } else {
        teardown = renderActive(ctx, workout);
      }
    })
    .catch((err) => {
      if (!mounted) return;
      ctx.container.innerHTML = `<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${esc(err.message)}</p></div>`;
    });

  return () => {
    mounted = false;
    if (typeof teardown === 'function') teardown();
  };
}

async function renderStart(ctx) {
  ctx.setTitle('Workout');
  const finished = await getFinishedWorkouts();
  const last = finished[0]; // sorted newest first
  const lastRotation = lastRotationWorkout(finished);
  const todayName = lastRotation ? nextInRotation(lastRotation.normalized) : ROTATION[0];

  // If the last rotation workout was already done today, the recommendation
  // is for the NEXT session ("Tomorrow"), not today.
  const doneToday = lastRotation && relativeDay(lastRotation.startedAt) === 'today';
  const hintLabel = doneToday ? 'Tomorrow' : 'Today';

  const lastHint = last
    ? `<div class="last-workout-hint">Last: <strong>${esc(last.name)}</strong> · ${relativeDay(last.startedAt)}</div>`
    : '';
  const todayHint = `<div class="next-workout-hint">${hintLabel}: <strong>${esc(todayName)}</strong></div>`;

  ctx.container.innerHTML = `
    <div class="workout-start">
      <div class="icon">🏋️</div>
      <h2>No active workout</h2>
      <p>Start one to begin logging sets.</p>
      ${lastHint}
      ${todayHint}
    </div>
    <div class="action-section">
      <button id="start-btn" class="btn-primary">Start Empty Workout</button>
    </div>
  `;
  ctx.container.querySelector('#start-btn').addEventListener('click', () => startNewWorkout(todayName, hintLabel));
}

// PPL rotation: Chest → Legs → Back/Bi → Chest → ...
const ROTATION = ['Chest Day', 'Leg Day', 'Back/Bi Day'];

/**
 * Maps any workout name (current or historical) to its rotation slot, or
 * null if it doesn't fit the cycle (e.g. custom names).
 */
function normalizeDayName(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (lower.includes('chest')) return 'Chest Day';
  if (lower.includes('leg') && !lower.includes('curl') && !lower.includes('extension')) return 'Leg Day';
  if (lower.includes('back')) return 'Back/Bi Day';  // matches "Back Day" + "Back/Bi Day"
  if (lower.includes('pull')) return 'Back/Bi Day';  // legacy "Pull Day"
  if (lower.includes('push')) return 'Chest Day';    // legacy "Push Day"
  return null;
}

function lastRotationWorkout(finishedWorkouts) {
  for (const w of finishedWorkouts) {
    const norm = normalizeDayName(w.name);
    if (norm) return { name: w.name, normalized: norm, startedAt: w.startedAt };
  }
  return null;
}

function nextInRotation(currentNormalized) {
  const idx = ROTATION.indexOf(currentNormalized);
  if (idx === -1) return ROTATION[0];
  return ROTATION[(idx + 1) % ROTATION.length];
}

function relativeDay(ts) {
  const now = new Date();
  const then = new Date(ts);
  const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((stripTime(now) - stripTime(then)) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return 'a week ago';
  return `${Math.round(diffDays / 7)} weeks ago`;
}

function startNewWorkout(recommendedName, badgeLabel = 'Today') {
  openWorkoutTypePicker(recommendedName, async (name) => {
    const workout = {
      id: uuid(),
      name,
      startedAt: Date.now(),
      endedAt: null,
      notes: '',
    };
    await put('workouts', workout);
    emit('workout:changed');
  }, badgeLabel);
}

function openWorkoutTypePicker(recommendedName, onPick, badgeLabel = 'Today') {
  const PRESETS = ['Chest Day', 'Leg Day', 'Back/Bi Day'];
  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="wt-cancel">Cancel</button>
        <div class="title">New Workout</div>
        <span style="width: 60px;"></span>
      </div>
      <div class="sheet-content">
        <div class="section">Pick a type</div>
        <div class="form-section">
          ${PRESETS.map((p) => {
            const isRecommended = p === recommendedName;
            const tag = isRecommended ? ` <span class="badge">${esc(badgeLabel)}</span>` : '';
            return `
              <button class="list-row button" data-name="${esc(p)}">
                <div class="row-main"><div class="row-title" style="color: var(--accent);">${esc(p)}${tag}</div></div>
              </button>
            `;
          }).join('')}
        </div>
        <div class="section">Other</div>
        <div class="form-section">
          <div class="form-row">
            <input id="wt-custom" placeholder="e.g. Push Day, Arms" style="text-align: left;" />
          </div>
        </div>
        <div class="action-section">
          <button class="btn-primary" id="wt-go" disabled>Start with custom name</button>
        </div>
      </div>
    `,
    onMount(sheet) {
      sheet.querySelector('#wt-cancel').addEventListener('click', () => dismiss());

      for (const btn of sheet.querySelectorAll('.list-row.button[data-name]')) {
        btn.addEventListener('click', () => {
          const name = btn.dataset.name;
          dismiss();
          onPick(name);
        });
      }

      const input = sheet.querySelector('#wt-custom');
      const goBtn = sheet.querySelector('#wt-go');
      input.addEventListener('input', () => {
        goBtn.disabled = input.value.trim().length === 0;
      });
      goBtn.addEventListener('click', () => {
        const name = input.value.trim();
        if (!name) return;
        dismiss();
        onPick(name);
      });

      setTimeout(() => input.focus(), 50);
    },
  });
}

function renderActive(ctx, workout) {
  let allExercises = [];
  let sets = [];
  let prevByExercise = new Map();
  let timerInterval = null;

  ctx.container.innerHTML = `
    <div class="active-workout">
      <div class="workout-header">
        <input class="workout-name-input" id="wname" value="${esc(workout.name)}" placeholder="Workout name" />
      </div>
      <div class="workout-progress" id="workout-progress"></div>
      <div id="exercise-sections"></div>
      <div class="action-section">
        <button id="add-exercise-btn" class="btn-secondary">+ Add Exercise</button>
      </div>
      <div class="action-section">
        <button id="finish-btn" class="btn-primary green">Finish Workout</button>
        <button id="discard-btn" class="btn-secondary" style="color: var(--red);">Discard Workout</button>
      </div>
    </div>
    <button id="calc-fab" class="calc-fab" aria-label="Calculator">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <line x1="8" y1="6" x2="16" y2="6"/>
        <line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/>
        <line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="18"/>
        <line x1="8" y1="18" x2="12" y2="18"/>
      </svg>
    </button>
  `;

  ctx.container.querySelector('#calc-fab').addEventListener('click', openCalculator);

  // Live timer in the nav bar
  const updateTimer = () => {
    ctx.setTitle(formatDuration((Date.now() - workout.startedAt) / 1000));
  };
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);

  // Save name on input
  const nameInput = ctx.container.querySelector('#wname');
  nameInput.addEventListener('input', debounce(async () => {
    workout.name = nameInput.value;
    await put('workouts', workout);
  }, 300));

  // All-time best single-workout volume per muscle, across the whole history.
  let muscleRecords = new Map();
  async function refreshRecords() {
    muscleRecords = await getMuscleRecords(workout.id);
    updateRunningStats();
  }

  // Buttons
  ctx.container.querySelector('#add-exercise-btn').addEventListener('click', async () => {
    const allSets = await getAll('sets');
    const counts = new Map();
    for (const s of allSets) {
      counts.set(s.exerciseId, (counts.get(s.exerciseId) ?? 0) + 1);
    }
    openExercisePicker(allExercises, counts, async (selectedIds) => {
      await addExercisesToWorkout(workout, sets, selectedIds);
      await reload();
    });
  });

  ctx.container.querySelector('#finish-btn').addEventListener('click', async () => {
    if (!confirm('Finish this workout?')) return;
    await finishWorkout(workout, sets);
    try {
      const { filename } = await downloadBackup();
      showToast(`Saved · backup: ${filename}`);
    } catch (err) {
      showToast(`Saved · backup failed: ${err.message}`);
    }
    emit('workout:changed');
  });

  ctx.container.querySelector('#discard-btn').addEventListener('click', async () => {
    if (!confirm('Discard this workout? This cannot be undone.')) return;
    await deleteWorkoutAndSets(workout.id);
    emit('workout:changed');
  });

  async function reload() {
    sets = await getWorkoutSets(workout.id);
    allExercises = await getAll('exercises');
    const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
    prevByExercise = new Map();
    await Promise.all(
      exerciseIds.map(async (eid) => {
        prevByExercise.set(eid, await previousSetsByPositionForExercise(eid, workout.id));
      })
    );
    renderSections();
    await refreshRecords();
  }

  function updateRunningStats() {
    const exMap = new Map(allExercises.map((e) => [e.id, e]));
    // Muscles in this workout in order of first appearance (from every set,
    // completed or not, so a section appears the moment an exercise is added),
    // plus each muscle's completed volume so far.
    const muscles = [];
    const currentByMuscle = new Map();
    for (const s of sets) {
      const ex = exMap.get(s.exerciseId);
      if (!ex) continue;
      const muscle = primaryMuscleFor(ex);
      if (!muscles.includes(muscle)) muscles.push(muscle);
      if (!s.completed) continue;
      const vol = (s.weight || 0) * (s.reps || 0);
      if (vol <= 0) continue;
      currentByMuscle.set(muscle, (currentByMuscle.get(muscle) ?? 0) + vol);
    }
    const totalVolume = [...currentByMuscle.values()].reduce((a, b) => a + b, 0);

    // One bar per muscle, stacked vertically. A bar's length is proportional
    // to the all-time best single-workout volume for that muscle (or today's
    // volume once it exceeds the record), relative to the biggest record in
    // this workout. The colored fill inside each bar is today's progress
    // toward that muscle's record.
    const progressEl = ctx.container.querySelector('#workout-progress');
    if (!progressEl) return;
    if (muscles.length === 0) {
      progressEl.innerHTML = '';
      return;
    }
    let shares = muscles.map((muscle) => {
      const record = muscleRecords.get(muscle) ?? 0;
      const cur = currentByMuscle.get(muscle) ?? 0;
      return { muscle, record, cur, span: Math.max(record, cur) };
    });
    // Muscles with no record yet still get a visible bar.
    const maxSpan = Math.max(...shares.map((x) => x.span));
    const minSpan = maxSpan > 0 ? maxSpan * 0.12 : 1;
    shares = shares.map((x) => ({ ...x, span: Math.max(x.span, minSpan) }));
    const barMax = Math.max(...shares.map((x) => x.span));

    const bars = shares.map(({ muscle, record, cur, span }) => {
      const widthPct = (span / barMax) * 100;
      const fillPct = cur > 0 ? Math.min(100, (cur / span) * 100) : 0;
      let stat;
      if (record > 0) {
        const pct = Math.round((cur / record) * 100);
        stat = cur > record ? `${pct}% 🔥` : `${pct}%`;
      } else {
        stat = cur > 0 ? 'new 🔥' : 'new';
      }
      const volText = record > 0
        ? `${formatVolume(cur)} / ${formatVolume(record)} · ${stat}`
        : `${formatVolume(cur)} · ${stat}`;
      return `
        <div class="vol-muscle" style="width: ${widthPct.toFixed(2)}%; --mcolor: ${colorForMuscle(muscle)};" title="${esc(muscle)}: ${formatVolume(cur)} / record ${formatVolume(record)} lbs">
          <div class="vol-fill" style="width: ${fillPct.toFixed(2)}%;"></div>
          <div class="vol-info${fillPct > 55 ? ' on-fill' : ''}">
            <span class="seg-name">${esc(muscle)}</span>
            <span class="seg-vol">${volText}</span>
          </div>
        </div>
      `;
    }).join('');

    const label = `<strong>${formatVolume(totalVolume)} lbs</strong> total`;

    progressEl.innerHTML = `
      <div class="vol-bars">${bars}</div>
      <div class="vol-label">${label}</div>
    `;
    // Auto-shrink each section's name/volume until the full text fits.
    requestAnimationFrame(() => {
      for (const seg of progressEl.querySelectorAll('.vol-muscle')) {
        fitSegmentLabel(seg);
      }
    });
  }

  function fitSegmentLabel(segEl) {
    const nameEl = segEl.querySelector('.seg-name');
    const volEl = segEl.querySelector('.seg-vol');
    const innerW = segEl.clientWidth - 4; // small padding allowance
    if (innerW <= 0) return;

    // Volume first: shrink 10px → 6px until it fits.
    if (volEl) {
      let volSize = 10;
      volEl.style.fontSize = `${volSize}px`;
      while (volEl.scrollWidth > innerW && volSize > 6) {
        volSize -= 0.5;
        volEl.style.fontSize = `${volSize}px`;
      }
    }

    if (!nameEl) return;

    // Name: shrink 11px → 5px until it fits. Never hide — even at 5px the
    // user wants to see the muscle name. (5px is borderline-readable on
    // a 3x retina display but still better than nothing.)
    nameEl.style.display = '';
    let nameSize = 11;
    nameEl.style.fontSize = `${nameSize}px`;
    while (nameEl.scrollWidth > innerW && nameSize > 5) {
      nameSize -= 0.5;
      nameEl.style.fontSize = `${nameSize}px`;
    }
  }

  /**
   * All-time best single-workout volume for each muscle, across the entire
   * history regardless of day name, excluding the active workout. In-app
   * workouts mark sets completed; imported HEVY history doesn't — if a past
   * workout has no completed sets at all, every logged set counts as done,
   * otherwise only the completed ones (so leftover prefilled-but-unchecked
   * sets don't inflate totals). Returns Map muscle → volume.
   */
  async function getMuscleRecords(excludeId) {
    const [setsAll, exercises] = await Promise.all([
      getAll('sets'),
      getAll('exercises'),
    ]);
    const exMap = new Map(exercises.map((e) => [e.id, e]));
    const setsByWorkout = new Map();
    for (const s of setsAll) {
      if (s.workoutId === excludeId) continue;
      if (!setsByWorkout.has(s.workoutId)) setsByWorkout.set(s.workoutId, []);
      setsByWorkout.get(s.workoutId).push(s);
    }
    const records = new Map();
    for (const wsets of setsByWorkout.values()) {
      const hasCompleted = wsets.some((s) => s.completed);
      const counted = hasCompleted ? wsets.filter((s) => s.completed) : wsets;
      const byMuscle = new Map();
      for (const s of counted) {
        const ex = exMap.get(s.exerciseId);
        if (!ex) continue;
        const vol = (s.weight || 0) * (s.reps || 0);
        if (vol <= 0) continue;
        const muscle = primaryMuscleFor(ex);
        byMuscle.set(muscle, (byMuscle.get(muscle) ?? 0) + vol);
      }
      for (const [muscle, vol] of byMuscle) {
        if (vol > (records.get(muscle) ?? 0)) records.set(muscle, vol);
      }
    }
    return records;
  }

  async function maybeShowPRToast(set) {
    if (!set.completed) return;
    if ((set.setType || 'working') === 'warmup') return;
    if (!(set.weight > 0) || !(set.reps > 0)) return;

    const exercise = allExercises.find((e) => e.id === set.exerciseId);
    if (!exercise) return;

    const all = await getExerciseSets(set.exerciseId);
    const prior = all.filter((s) =>
      s.id !== set.id &&
      s.completed &&
      (s.setType || 'working') !== 'warmup' &&
      s.weight > 0 && s.reps > 0
    );
    if (prior.length === 0) return;  // First time doing this exercise — don't claim a PR

    const maxWeight = prior.reduce((m, s) => Math.max(m, s.weight), 0);
    const prs = [];
    if (set.weight > maxWeight) prs.push(`Heaviest ${formatWeight(set.weight)} lbs`);
    // Rep PR at this exact weight: did we ever do more reps at this weight or heavier?
    const repsAtOrAbove = prior
      .filter((s) => s.weight >= set.weight)
      .reduce((m, s) => Math.max(m, s.reps), 0);
    if (set.reps > repsAtOrAbove && set.weight > 0) {
      prs.push(`${set.reps} reps @ ${formatWeight(set.weight)} lbs`);
    }

    if (prs.length > 0) {
      showToast(`🏆 ${exercise.name} PR · ${prs.join(' · ')}`, 4500);
    }
  }

  function formatVolume(v) {
    if (v >= 10000) return `${(v / 1000).toFixed(1)}k`;
    return Math.round(v).toLocaleString();
  }

  function renderSections() {
    const exMap = new Map(allExercises.map((e) => [e.id, e]));
    const exerciseIds = [];
    const setsByExercise = new Map();
    for (const s of sets) {
      if (!setsByExercise.has(s.exerciseId)) {
        setsByExercise.set(s.exerciseId, []);
        exerciseIds.push(s.exerciseId);
      }
      setsByExercise.get(s.exerciseId).push(s);
    }
    for (const [, arr] of setsByExercise) arr.sort((a, b) => a.order - b.order);

    const sectionsEl = ctx.container.querySelector('#exercise-sections');
    if (exerciseIds.length === 0) {
      sectionsEl.innerHTML = `
        <div class="empty-state" style="padding: 40px 24px; min-height: auto;">
          <p style="color: var(--text-secondary);">Add an exercise to start logging sets.</p>
        </div>`;
      return;
    }

    sectionsEl.innerHTML = exerciseIds
      .map((eid) => {
        const ex = exMap.get(eid);
        const exSets = setsByExercise.get(eid);
        const prev = prevByExercise.get(eid) ?? new Map();
        return renderExerciseSection(ex, exSets, prev);
      })
      .join('');

    // A set is "owned" once the user types in it or completes it — clear any
    // auto-bump bookkeeping so it won't be reverted out from under them.
    function clearBumpMarker(s) {
      delete s.bumpedBy;
      delete s.preBumpWeight;
      delete s.preBumpReps;
    }
    // The previous-workout value (what PREV shows) for a set's slot — the target
    // an auto-bump should revert to. Null when the set has no history.
    function prevTargetFor(s) {
      const exSets = sets
        .filter((x) => x.exerciseId === s.exerciseId)
        .sort((a, b) => a.order - b.order);
      const type = s.setType || 'working';
      let typePos = 0;
      let overallPos = 0;
      for (const x of exSets) {
        overallPos += 1;
        if ((x.setType || 'working') === type) typePos += 1;
        if (x.id === s.id) break;
      }
      const prev = findPrevSetByTypeAndPosition(type, typePos, prevByExercise.get(s.exerciseId), overallPos);
      return prev && prev.weight > 0 && prev.reps > 0 ? { weight: prev.weight, reps: prev.reps } : null;
    }
    // Re-evaluate the bumps a trigger set causes: undo its old ones, then re-apply
    // from its current value (if still completed). Reflects changes in the
    // succeeding rows' inputs in place so a field being typed in keeps focus.
    async function resyncBumps(trigger) {
      await revertBumpsFrom(trigger.id, sets);
      if (trigger.completed) await bumpSucceedingSets(trigger, sets, prevTargetFor);
      for (const s of sets) {
        if (s.exerciseId !== trigger.exerciseId) continue;
        const row = sectionsEl.querySelector(`.set-row[data-set-id="${s.id}"]`);
        if (!row) continue;
        const w = row.querySelector('.weight-input');
        const r = row.querySelector('.reps-input');
        if (w && document.activeElement !== w) w.value = s.weight > 0 ? String(s.weight) : '';
        if (r && document.activeElement !== r) r.value = s.reps > 0 ? String(s.reps) : '';
      }
    }

    // Wire up per-set events
    for (const wrap of sectionsEl.querySelectorAll('.set-row-wrap')) {
      const setRow = wrap.querySelector('.set-row');
      const setId = setRow.dataset.setId;
      const set = sets.find((s) => s.id === setId);
      if (!set) continue;

      const weightInput = setRow.querySelector('.weight-input');
      const repsInput = setRow.querySelector('.reps-input');
      const completeBtn = setRow.querySelector('.complete-btn');

      // Swipe left to reveal delete; tap delete to remove the set
      attachSwipeToDelete(wrap, async () => {
        await del('sets', set.id);
        await reload();
      });

      weightInput.addEventListener('input', debounce(async () => {
        set.weight = parseFloat(weightInput.value) || 0;
        clearBumpMarker(set);          // user now owns this value
        await put('sets', set);
        await resyncBumps(set);        // revert old bumps, re-apply from the new value
        if (set.completed) updateRunningStats();
      }, 200));

      repsInput.addEventListener('input', debounce(async () => {
        set.reps = parseInt(repsInput.value, 10) || 0;
        clearBumpMarker(set);
        await put('sets', set);
        await resyncBumps(set);
        if (set.completed) updateRunningStats();
      }, 200));

      completeBtn.addEventListener('click', async () => {
        const wasCompleted = set.completed;
        set.completed = !set.completed;
        if (set.completed) clearBumpMarker(set);  // a logged set owns its value
        await put('sets', set);
        setRow.classList.toggle('completed', set.completed);
        completeBtn.innerHTML = checkIcon(set.completed);
        updateRunningStats();
        if (!wasCompleted && set.completed) {
          const bumped = await bumpSucceedingSets(set, sets, prevTargetFor);
          if (bumped) renderSections();
          await maybeShowPRToast(set);
        } else if (wasCompleted && !set.completed) {
          // Unchecked: put back any sets this one bumped up.
          const reverted = await revertBumpsFrom(set.id, sets);
          if (reverted) renderSections();
        }
      });

      // Tap set number to cycle Working → Warmup → Working
      const numBtn = setRow.querySelector('.set-number');
      if (numBtn) {
        numBtn.addEventListener('click', async () => {
          const current = set.setType || 'working';
          const newType = current === 'warmup' ? 'working' : 'warmup';
          set.setType = newType;
          // Re-suggest this set's numbers from the matching slot's history (the
          // same value PREV shows), so a set flipped to/from warmup adopts that
          // slot's previous weight/reps instead of keeping the other type's.
          // Skip if it's already completed (don't rewrite logged work).
          if (!set.completed) {
            const exSets = sets
              .filter((s) => s.exerciseId === set.exerciseId)
              .sort((a, b) => a.order - b.order);
            let typePos = 0;
            let overallPos = 0;
            for (const s of exSets) {
              overallPos += 1;
              if ((s.setType || 'working') === newType) typePos += 1;
              if (s.id === set.id) break;
            }
            const prev = findPrevSetByTypeAndPosition(
              newType, typePos, prevByExercise.get(set.exerciseId), overallPos
            );
            if (prev && prev.weight > 0 && prev.reps > 0) {
              set.weight = prev.weight;
              set.reps = prev.reps;
            }
          }
          await put('sets', set);
          renderSections();  // re-render so set numbering updates correctly across the section
        });
      }
    }

    // Wire up add-set and exercise menu
    for (const addBtn of sectionsEl.querySelectorAll('.add-set-btn')) {
      addBtn.addEventListener('click', async () => {
        const eid = addBtn.dataset.exerciseId;
        await addSet(workout, sets, eid, prevByExercise.get(eid) ?? new Map());
        await reload();
      });
    }

    for (const menuBtn of sectionsEl.querySelectorAll('.exercise-menu')) {
      menuBtn.addEventListener('click', async () => {
        const eid = menuBtn.dataset.exerciseId;
        if (!confirm('Remove this exercise from the workout?')) return;
        for (const s of sets.filter((s) => s.exerciseId === eid)) {
          await del('sets', s.id);
        }
        await reload();
      });
    }

    // Tap the exercise name → open its history/stats/chart in a sheet.
    for (const nameBtn of sectionsEl.querySelectorAll('.exercise-name-btn')) {
      nameBtn.addEventListener('click', () => {
        openExerciseDetailSheet(nameBtn.dataset.exerciseId);
      });
    }
  }

  reload();

  return () => {
    if (timerInterval) clearInterval(timerInterval);
  };
}

function renderExerciseSection(exercise, sets, prevSets = new Map()) {
  // Warmups get their own counter (W1, W2, W3); working sets get 1, 2, 3.
  // PREV matches by type AND position-within-type so W1 lines up with last
  // workout's W1, working-set 2 lines up with last workout's working-set 2, etc.
  // Each slot can come from a different past workout (see prevSets above).
  let workingIndex = 0;
  let warmupIndex = 0;
  const setBlocks = sets.map((s, i) => {
    const type = s.setType || 'working';
    let display;
    let positionInType;
    if (type === 'warmup') {
      warmupIndex += 1;
      positionInType = warmupIndex;
      display = `W${warmupIndex}`;
    } else {
      workingIndex += 1;
      positionInType = workingIndex;
      display = String(workingIndex);
    }
    const prev = findPrevSetByTypeAndPosition(type, positionInType, prevSets, i + 1);
    return renderSetRow(s, display, prev);
  }).join('');

  const hint = exercise ? loggingHintFor(exercise) : '';
  return `
    <div class="exercise-section">
      <div class="exercise-section-header">
        <div class="exercise-title">
          <button class="name exercise-name-btn" data-exercise-id="${exercise?.id}">${esc(exercise?.name ?? 'Unknown exercise')} <span class="name-chevron">›</span></button>
          ${hint ? `<div class="logging-hint">${esc(hint)}</div>` : ''}
        </div>
        <button class="menu exercise-menu" data-exercise-id="${exercise?.id}" aria-label="Remove">×</button>
      </div>
      <div class="set-table-header">
        <div class="col-set">SET</div>
        <div>PREV</div>
        <div>LBS</div>
        <div>REPS</div>
        <div></div>
      </div>
      ${setBlocks}
      <button class="add-set-btn" data-exercise-id="${exercise?.id}">+ Add Set</button>
    </div>
  `;
}

/**
 * Look up the previous set for a given slot. `prevMap` is keyed
 * `${type}#${position}` (1-indexed) and already encodes the per-slot fallback to
 * older workouts (see previousSetsByPositionForExercise). When no typed history
 * has the slot and `overallPosition` (1-indexed row within the exercise) is
 * given, falls back to the same raw position in typeless history — imported
 * HEVY workouts whose warmups weren't flagged. Returns null only when the slot
 * is genuinely new.
 */
function findPrevSetByTypeAndPosition(type, positionInType, prevMap, overallPosition = null) {
  if (!prevMap || typeof prevMap.get !== 'function') return null;
  const typed = prevMap.get(`${type}#${positionInType}`);
  if (typed) return typed;
  if (overallPosition != null) return prevMap.get(`any#${overallPosition}`) ?? null;
  return null;
}

function renderSetRow(set, displayLabel, prevSet) {
  const type = set.setType || 'working';
  const prevText = prevSet && prevSet.weight > 0 && prevSet.reps > 0
    ? `${formatWeight(prevSet.weight)} × ${prevSet.reps}`
    : '—';
  return `
    <div class="set-row-wrap" data-set-id="${set.id}">
      <button class="set-swipe-delete" data-set-id="${set.id}" aria-label="Delete set">Delete</button>
      <div class="set-row type-${type}${set.completed ? ' completed' : ''}" data-set-id="${set.id}">
        <button class="set-number" aria-label="Tap to toggle warmup">${displayLabel}</button>
        <div class="prev" aria-label="Previous">${prevText}</div>
        <input class="weight-input" type="number" inputmode="decimal" step="0.5"
               placeholder="0" value="${set.weight > 0 ? set.weight : ''}" />
        <input class="reps-input" type="number" inputmode="numeric" step="1"
               placeholder="0" value="${set.reps > 0 ? set.reps : ''}" />
        <button class="complete-btn" aria-label="Toggle complete">${checkIcon(set.completed)}</button>
      </div>
    </div>
  `;
}

/**
 * Attaches iOS-style swipe-left-to-delete behavior to a set row. A short swipe
 * snaps open to reveal the Delete button (tap to confirm); a full swipe past
 * the commit threshold deletes immediately on release. onDelete runs the delete.
 * Only one row stays open at a time — any other open row auto-closes.
 */
function attachSwipeToDelete(wrap, onDelete) {
  const row = wrap.querySelector('.set-row');
  const deleteBtn = wrap.querySelector('.set-swipe-delete');
  if (!row || !deleteBtn) return;

  const REVEAL_WIDTH = 88;  // px the row rests open at, exposing Delete

  let rowWidth = 0;
  let startX = 0;
  let startY = 0;
  let currentDX = 0;
  let tracking = false;
  let horizontal = false;
  let isOpen = false;
  let startedOnControl = false;

  // Distance past which a release auto-deletes (about half the row).
  const commitPoint = () => Math.max(140, rowWidth * 0.5);

  function setOffset(px, animate) {
    row.style.transition = animate ? 'transform 0.18s ease' : 'none';
    row.style.transform = `translateX(${px}px)`;
    // Grow the red panel to stay flush behind the row as it slides further
    // than the resting reveal width.
    deleteBtn.style.width = `${Math.max(REVEAL_WIDTH, -px)}px`;
    wrap.classList.toggle('will-delete', px <= -commitPoint());
  }
  function close(animate = true) {
    isOpen = false;
    setOffset(0, animate);
    wrap.classList.remove('swiped-open');
  }
  function open(animate = true) {
    // Close any other open row first
    document.querySelectorAll('.set-row-wrap.swiped-open').forEach((el) => {
      if (el !== wrap) {
        const r = el.querySelector('.set-row');
        if (r) { r.style.transition = 'transform 0.18s ease'; r.style.transform = 'translateX(0)'; }
        const d = el.querySelector('.set-swipe-delete');
        if (d) d.style.width = '';
        el.classList.remove('swiped-open', 'will-delete');
      }
    });
    isOpen = true;
    setOffset(-REVEAL_WIDTH, animate);
    wrap.classList.add('swiped-open');
  }
  function commitDelete() {
    // Slide the row fully off-screen, then delete.
    row.style.transition = 'transform 0.16s ease-out';
    row.style.transform = `translateX(${-rowWidth}px)`;
    deleteBtn.style.width = `${rowWidth}px`;
    setTimeout(onDelete, 150);
  }

  // Start tracking anywhere on the row — including over the inputs and buttons —
  // so the whole row is a swipe zone, not just the gaps between controls. We
  // only take the gesture over once it's clearly horizontal, so a plain tap
  // still focuses an input or fires a button.
  row.addEventListener('touchstart', (e) => {
    rowWidth = wrap.clientWidth || row.clientWidth;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentDX = isOpen ? -REVEAL_WIDTH : 0;
    tracking = true;
    horizontal = false;
    startedOnControl = !!e.target.closest('input, button, select, textarea');
  }, { passive: true });

  row.addEventListener('touchmove', (e) => {
    if (!tracking) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (!horizontal) {
      if (Math.abs(dy) > Math.abs(dx) + 4) {
        // Looks like a vertical scroll; bail and let the page scroll.
        tracking = false;
        return;
      }
      if (Math.abs(dx) > 8) {
        horizontal = true;
        // Hand the gesture off from any focused input so we don't drag a caret
        // or select text while swiping.
        if (startedOnControl && document.activeElement?.blur) document.activeElement.blur();
      }
    }
    if (!horizontal) return;
    // Now that we own a horizontal swipe, stop the input/page from reacting.
    if (e.cancelable) e.preventDefault();
    const base = isOpen ? -REVEAL_WIDTH : 0;
    // Allow dragging all the way across the row, not just to the reveal width.
    currentDX = Math.min(0, Math.max(-rowWidth, base + dx));
    setOffset(currentDX, false);
  }, { passive: false });

  function endSwipe() {
    if (!tracking) return;
    tracking = false;
    if (!horizontal) return;
    if (currentDX <= -commitPoint()) commitDelete();
    else if (currentDX < -REVEAL_WIDTH / 2) open();
    else close();
  }
  row.addEventListener('touchend', endSwipe);
  row.addEventListener('touchcancel', endSwipe);

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onDelete();
  });
}

function checkIcon(completed) {
  if (completed) {
    return `<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
}

async function addExercisesToWorkout(workout, existingSets, exerciseIds) {
  let order = existingSets.reduce((m, s) => Math.max(m, s.order), -1) + 1;
  for (const exerciseId of exerciseIds) {
    // Recreate last workout's set structure for this exercise, prefilling each
    // set with its own previous weight/reps (and warmup/working type). So if
    // last time you did W1 95×12, W2 135×12, then 3 working sets at 155×10,
    // those 5 sets come pre-populated and you just tweak + check them off.
    // Rows that were never actually performed (weight or reps still 0) are
    // skipped, so they don't propagate from workout to workout.
    const prevSets = (await previousWorkoutSetsForExercise(exerciseId, workout.id))
      .filter((prev) => (prev.weight || 0) > 0 && (prev.reps || 0) > 0);
    if (prevSets.length > 0) {
      for (const prev of prevSets) {
        const set = {
          id: uuid(),
          workoutId: workout.id,
          exerciseId,
          weight: prev.weight ?? 0,
          reps: prev.reps ?? 0,
          setType: prev.setType || 'working',
          completed: false,
          order: order++,
          createdAt: Date.now(),
        };
        await put('sets', set);
      }
    } else {
      const set = {
        id: uuid(),
        workoutId: workout.id,
        exerciseId,
        weight: 0,
        reps: 0,
        completed: false,
        order: order++,
        createdAt: Date.now(),
      };
      await put('sets', set);
    }
  }
}

/**
 * When a set is marked complete, pull any later sets of the same exercise that
 * are lighter up to match the just-completed set — across set types, so a
 * heavier warmup can lift a lighter following set too. Later sets that already
 * meet or exceed the completed volume keep their previous-workout target, and
 * already-logged (completed) later sets are never rewritten. Each bumped set
 * remembers its pre-bump weight/reps and which set bumped it, so the change can
 * be undone (see revertBumpsFrom). Returns true if any set was changed.
 */
async function bumpSucceedingSets(completedSet, allSets, prevTargetFor) {
  const completedVol = (completedSet.weight || 0) * (completedSet.reps || 0);
  if (completedVol <= 0) return false;
  let changed = false;
  for (const s of allSets) {
    if (s.exerciseId !== completedSet.exerciseId) continue;
    if (s.id === completedSet.id) continue;
    if ((s.order ?? 0) <= (completedSet.order ?? 0)) continue;
    if (s.completed) continue;
    if ((s.weight || 0) * (s.reps || 0) < completedVol) {
      if (s.bumpedBy == null) {
        // Revert target is the previous-workout value for this slot (what PREV
        // shows) so unchecking restores the original, not an interim bump.
        // Fall back to the current value when there's no history.
        const orig = prevTargetFor?.(s);
        s.preBumpWeight = orig ? orig.weight : s.weight;
        s.preBumpReps = orig ? orig.reps : s.reps;
      }
      s.bumpedBy = completedSet.id;
      s.weight = completedSet.weight;
      s.reps = completedSet.reps;
      await put('sets', s);
      changed = true;
    }
  }
  return changed;
}

/**
 * Undo the auto-bumps caused by a given trigger set (when it's unchecked or its
 * weight/reps change). Restores each still-unedited, uncompleted set to its
 * remembered pre-bump weight/reps and clears the bookkeeping. Returns true if
 * any set was changed.
 */
async function revertBumpsFrom(triggerId, allSets) {
  let changed = false;
  for (const s of allSets) {
    if (s.bumpedBy !== triggerId) continue;
    if (!s.completed) {
      if (s.preBumpWeight != null) s.weight = s.preBumpWeight;
      if (s.preBumpReps != null) s.reps = s.preBumpReps;
    }
    delete s.bumpedBy;
    delete s.preBumpWeight;
    delete s.preBumpReps;
    await put('sets', s);
    changed = true;
  }
  return changed;
}

async function addSet(workout, existingSets, exerciseId, prevSets = new Map()) {
  const setsForEx = existingSets.filter((s) => s.exerciseId === exerciseId);
  const last = setsForEx[setsForEx.length - 1];

  // The new set is a working set appended at the end of this exercise.
  const vol = (s) => (s?.weight || 0) * (s?.reps || 0);
  const workingSets = setsForEx.filter((s) => (s.setType || 'working') !== 'warmup');
  const newPosition = workingSets.length + 1;
  const prevForNew = findPrevSetByTypeAndPosition('working', newPosition, prevSets, setsForEx.length + 1);

  // Heaviest working set entered so far this workout (by volume).
  const bestSoFar = workingSets
    .filter((s) => s.weight > 0 && s.reps > 0)
    .reduce((best, s) => (!best || vol(s) > vol(best) ? s : best), null);

  // Have we already beaten the previous workout at any matching set position?
  const beatenPrevious = workingSets.some((s, i) => {
    const prev = findPrevSetByTypeAndPosition('working', i + 1, prevSets);
    return prev && prev.weight > 0 && prev.reps > 0 && vol(s) > vol(prev);
  });

  // Progressive overload: when there's no previous-workout history for this next
  // set, or we've already exceeded the previous volume, carry the heaviest set
  // of the workout forward instead of just repeating the last (possibly lighter)
  // set. Otherwise keep the default "repeat last set" behavior.
  let weight = last?.weight ?? 0;
  let reps = last?.reps ?? 0;
  if (bestSoFar && (!prevForNew || beatenPrevious)) {
    weight = bestSoFar.weight;
    reps = bestSoFar.reps;
  }

  const set = {
    id: uuid(),
    workoutId: workout.id,
    exerciseId,
    weight,
    reps,
    completed: false,
    order: (last?.order ?? -1) + 1,
    createdAt: Date.now(),
  };
  await put('sets', set);
}

async function finishWorkout(workout, sets) {
  for (const s of sets) {
    // Drop unperformed rows: anything not checked off that's missing a weight
    // or a rep count (e.g. a prefilled 155×0). They'd otherwise be recreated by
    // prefill in every future workout and mask real history in the PREV column.
    if (!s.completed && ((s.weight || 0) === 0 || (s.reps || 0) === 0)) {
      await del('sets', s.id);
    }
  }
  workout.endedAt = Date.now();
  await put('workouts', workout);
}

// ----------------- Exercise picker sheet -----------------

function openExercisePicker(allExercises, setCountByExercise, onConfirm) {
  let selected = new Set();
  let search = '';
  let category = null;

  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="picker-cancel">Cancel</button>
        <div class="title">Add Exercises</div>
        <button class="btn-text primary" id="picker-add" disabled>Add</button>
      </div>
      <div class="search-bar">
        <input class="search-input" id="picker-search" placeholder="Search exercises" />
      </div>
      <div class="chip-row" id="picker-chips"></div>
      <div class="sheet-content">
        <div class="list" id="picker-list"></div>
        <div class="action-section">
          <button class="btn-secondary" id="picker-custom">+ Create Custom Exercise</button>
        </div>
      </div>
    `,
    onMount(sheet) {
      const listEl = sheet.querySelector('#picker-list');
      const addBtn = sheet.querySelector('#picker-add');
      const cancelBtn = sheet.querySelector('#picker-cancel');
      const customBtn = sheet.querySelector('#picker-custom');
      const searchInput = sheet.querySelector('#picker-search');
      const chipRow = sheet.querySelector('#picker-chips');

      function renderChips() {
        const muscles = sortMuscles(new Set(allExercises.map((e) => primaryMuscleFor(e))));
        const cats = ['All', ...muscles];
        chipRow.innerHTML = cats
          .map((c) => {
            const isActive = (c === 'All' && !category) || c === category;
            return `<button class="chip${isActive ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`;
          })
          .join('');
        for (const chip of chipRow.querySelectorAll('.chip')) {
          chip.addEventListener('click', () => {
            const c = chip.dataset.cat;
            category = c === 'All' ? null : c;
            renderChips();
            renderList();
          });
        }
      }

      function renderList() {
        const filtered = allExercises
          .filter((e) => !category || primaryMuscleFor(e) === category)
          .filter((e) =>
            !search || e.name.toLowerCase().includes(search.toLowerCase())
          )
          .sort((a, b) => {
            // Exercises with prior sets bubble to the top; then alphabetical.
            const ca = setCountByExercise.get(a.id) ?? 0;
            const cb = setCountByExercise.get(b.id) ?? 0;
            if (ca !== cb) return cb - ca;
            return a.name.localeCompare(b.name);
          });

        listEl.innerHTML = filtered.length === 0
          ? `<div class="list-row"><div class="row-main" style="color:var(--text-secondary)">No matches</div></div>`
          : filtered.map((e) => {
              const count = setCountByExercise.get(e.id) ?? 0;
              const countLabel = count > 0
                ? ` <span class="exercise-count">${count} ${count === 1 ? 'set' : 'sets'}</span>`
                : '';
              return `
                <button class="list-row" data-id="${e.id}">
                  <div class="row-main">
                    <div class="row-title">${esc(e.name)}${e.isCustom ? ' <span class="badge">Custom</span>' : ''}${countLabel}</div>
                    <div class="row-subtitle">${esc(e.equipment)} · ${esc(primaryMuscleFor(e))}</div>
                  </div>
                  <div class="row-trailing">${selected.has(e.id) ? checkmarkBlue() : ''}</div>
                </button>
              `;
            }).join('');

        for (const row of listEl.querySelectorAll('.list-row[data-id]')) {
          row.addEventListener('click', () => {
            const id = row.dataset.id;
            if (selected.has(id)) selected.delete(id);
            else selected.add(id);
            addBtn.disabled = selected.size === 0;
            addBtn.textContent = selected.size === 0 ? 'Add' : `Add (${selected.size})`;
            renderList();
          });
        }
      }

      searchInput.addEventListener('input', () => {
        search = searchInput.value;
        renderList();
      });

      cancelBtn.addEventListener('click', () => dismiss());
      addBtn.addEventListener('click', () => {
        onConfirm(Array.from(selected));
        dismiss();
      });

      customBtn.addEventListener('click', () => {
        openAddCustomExercise(async (newExercise) => {
          allExercises.push(newExercise);
          selected.add(newExercise.id);
          renderChips();
          renderList();
          addBtn.disabled = false;
          addBtn.textContent = `Add (${selected.size})`;
        });
      });

      renderChips();
      renderList();
    },
  });
}

function checkmarkBlue() {
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="var(--green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
}

// ----------------- Add custom exercise sheet -----------------

function openAddCustomExercise(onCreated) {
  const dismiss = showSheet({
    html: `
      <div class="sheet-header">
        <button class="btn-text" id="ce-cancel">Cancel</button>
        <div class="title">New Exercise</div>
        <button class="btn-text primary" id="ce-save" disabled>Save</button>
      </div>
      <div class="sheet-content">
        <div class="section">Name</div>
        <div class="form-section">
          <div class="form-row">
            <input id="ce-name" placeholder="e.g. Cable Lateral Raise" style="text-align: left;" />
          </div>
        </div>
        <div class="section">Muscle</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Muscle</label>
            <select id="ce-cat">${MUSCLES.map((c) => `<option>${c}</option>`).join('')}</select>
          </div>
        </div>
        <div class="section">Equipment</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-eq">Equipment</label>
            <select id="ce-eq">${EQUIPMENT.map((e) => `<option>${e}</option>`).join('')}</select>
          </div>
        </div>
      </div>
    `,
    onMount(sheet) {
      const nameInput = sheet.querySelector('#ce-name');
      const saveBtn = sheet.querySelector('#ce-save');

      nameInput.addEventListener('input', () => {
        saveBtn.disabled = nameInput.value.trim().length === 0;
      });

      sheet.querySelector('#ce-cancel').addEventListener('click', () => dismiss());
      saveBtn.addEventListener('click', async () => {
        const newExercise = {
          id: uuid(),
          name: nameInput.value.trim(),
          category: sheet.querySelector('#ce-cat').value,
          equipment: sheet.querySelector('#ce-eq').value,
          notes: '',
          isCustom: true,
          createdAt: Date.now(),
        };
        await put('exercises', newExercise);
        dismiss();
        onCreated?.(newExercise);
        emit('data:changed');
      });

      setTimeout(() => nameInput.focus(), 50);
    },
  });
}

// ----------------- Quick calculator -----------------

function openCalculator() {
  const KEYS = [
    ['AC', 'clear', 'fn'], ['±', 'sign', 'fn'], ['⌫', 'back', 'fn'], ['÷', 'op', 'op'],
    ['7', 'digit'], ['8', 'digit'], ['9', 'digit'], ['×', 'op', 'op'],
    ['4', 'digit'], ['5', 'digit'], ['6', 'digit'], ['−', 'op', 'op'],
    ['1', 'digit'], ['2', 'digit'], ['3', 'digit'], ['+', 'op', 'op'],
    ['0', 'digit', 'zero'], ['.', 'dot'], ['=', 'equals', 'op'],
  ];
  const buttons = KEYS.map(([label, action, cls]) =>
    `<button class="calc-key${cls ? ` calc-${cls}` : ''}" data-action="${action}" data-key="${esc(label)}">${esc(label)}</button>`
  ).join('');

  showSheet({
    html: `
      <div class="sheet-header">
        <span style="width: 60px;"></span>
        <div class="title">Calculator</div>
        <button class="btn-text primary" id="calc-done">Done</button>
      </div>
      <div class="sheet-content">
        <div class="calc-screen">
          <div class="calc-expr" id="calc-expr"></div>
          <div class="calc-result" id="calc-result">0</div>
        </div>
        <div class="calc-grid">${buttons}</div>
      </div>
    `,
    onMount(sheet, dismiss) {
      const exprEl = sheet.querySelector('#calc-expr');
      const resultEl = sheet.querySelector('#calc-result');
      const OPS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => b === 0 ? NaN : a / b };
      const isOp = (t) => t === '+' || t === '−' || t === '×' || t === '÷';

      const fmt = (n) => {
        if (!isFinite(n)) return 'Error';
        let s = parseFloat(n.toFixed(8)).toString();
        if (s.replace('-', '').replace('.', '').length > 12) s = n.toPrecision(10).replace(/\.?0+$/, '');
        return s;
      };

      // The whole equation is kept as a token list so it stays visible exactly
      // as typed (e.g. "45 × 3 + 2"), instead of collapsing to intermediates.
      let tokens = ['0'];
      let justEval = false;  // a result is showing; next digit starts fresh
      let error = false;
      let prevEq = '';       // the just-evaluated equation, shown above the result
      const last = () => tokens[tokens.length - 1];

      function render() {
        exprEl.textContent = error ? '' : prevEq;
        resultEl.textContent = error ? 'Error' : tokens.join(' ');
        const pending = !error && isOp(last()) ? last() : null;
        for (const k of sheet.querySelectorAll('.calc-op')) {
          k.classList.toggle('selected', k.dataset.key === pending);
        }
      }

      function inputDigit(d) {
        if (error) { tokens = ['0']; error = false; }
        if (justEval) { tokens = [d]; justEval = false; return render(); }
        if (isOp(last())) tokens.push(d);
        else tokens[tokens.length - 1] = last() === '0' ? d : last() + d;
        render();
      }
      function inputDot() {
        if (error) { tokens = ['0']; error = false; }
        if (justEval) { tokens = ['0.']; justEval = false; return render(); }
        if (isOp(last())) tokens.push('0.');
        else if (!last().includes('.')) tokens[tokens.length - 1] = last() + '.';
        render();
      }
      function inputOp(sym) {
        if (error) return;
        justEval = false;
        if (isOp(last())) tokens[tokens.length - 1] = sym;  // swap operator
        else tokens.push(sym);
        render();
      }
      function clearAll() { tokens = ['0']; justEval = false; error = false; render(); }
      function toggleSign() {
        if (error || isOp(last())) return;
        const v = last();
        tokens[tokens.length - 1] = v.startsWith('-') ? v.slice(1) : (v === '0' ? '0' : '-' + v);
        render();
      }
      function backspace() {
        if (error) return clearAll();
        justEval = false;
        if (isOp(last())) { tokens.pop(); return render(); }
        const trimmed = last().slice(0, -1);
        if (trimmed === '' || trimmed === '-') {
          if (tokens.length > 1) tokens.pop();  // drop the number, keep the operator before it
          else tokens = ['0'];
        } else {
          tokens[tokens.length - 1] = trimmed;
        }
        render();
      }
      function equals() {
        if (error) return;
        const t = tokens.slice();
        if (isOp(t[t.length - 1])) t.pop();  // ignore a dangling operator
        if (t.length < 3) return;            // nothing to evaluate yet
        let result = parseFloat(t[0]);
        for (let i = 1; i < t.length; i += 2) {
          result = OPS[t[i]](result, parseFloat(t[i + 1]));
          if (!isFinite(result)) { error = true; return render(); }
        }
        prevEq = `${t.join(' ')} =`;  // keep the equation visible above the result
        tokens = [fmt(result)];
        justEval = true;
        render();
      }

      function activate(btn) {
        const { action, key } = btn.dataset;
        // Any fresh input clears the previous equation shown above the result.
        if (action !== 'equals') prevEq = '';
        if (action === 'digit') inputDigit(key);
        else if (action === 'dot') inputDot();
        else if (action === 'clear') clearAll();
        else if (action === 'sign') toggleSign();
        else if (action === 'back') backspace();
        else if (action === 'op') inputOp(key);
        else if (action === 'equals') equals();
      }

      // Act on pointerup, not click: click drops fast/rapid taps on mobile
      // (double-tap-zoom heuristics), which made keys feel stuck. Touch pointers
      // get implicit capture, so pointerup lands on the key that got pointerdown.
      let downBtn = null;
      for (const btn of sheet.querySelectorAll('.calc-key')) {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          downBtn = btn;
          btn.classList.add('pressed');
        });
        btn.addEventListener('pointerup', (e) => {
          e.preventDefault();
          btn.classList.remove('pressed');
          if (downBtn === btn) activate(btn);
          downBtn = null;
        });
        btn.addEventListener('pointercancel', () => { btn.classList.remove('pressed'); downBtn = null; });
        btn.addEventListener('pointerleave', () => btn.classList.remove('pressed'));
      }

      sheet.querySelector('#calc-done').addEventListener('click', () => dismiss());
    },
  });
}

export { openAddCustomExercise };
