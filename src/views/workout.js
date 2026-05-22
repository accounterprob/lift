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
} from '../db.js';
import {
  uuid, esc, formatDuration, todayWorkoutName, showSheet, emit, debounce, showToast,
} from '../utils.js';
import { CATEGORIES, EQUIPMENT, primaryMuscleFor, colorForMuscle } from '../seed.js';
import { downloadBackup } from '../backup.js';

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
  const last = finished[0]; // already sorted newest first
  const lastHint = last
    ? `<div class="last-workout-hint">Last workout: <strong>${esc(last.name)}</strong> · ${relativeDay(last.startedAt)}</div>`
    : '';

  ctx.container.innerHTML = `
    <div class="workout-start">
      <div class="icon">🏋️</div>
      <h2>No active workout</h2>
      <p>Start one to begin logging sets.</p>
      ${lastHint}
    </div>
    <div class="action-section">
      <button id="start-btn" class="btn-primary">Start Empty Workout</button>
    </div>
  `;
  ctx.container.querySelector('#start-btn').addEventListener('click', startNewWorkout);
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

function startNewWorkout() {
  openWorkoutTypePicker(async (name) => {
    const workout = {
      id: uuid(),
      name,
      startedAt: Date.now(),
      endedAt: null,
      notes: '',
    };
    await put('workouts', workout);
    emit('workout:changed');
  });
}

function openWorkoutTypePicker(onPick) {
  const PRESETS = ['Chest Day', 'Leg Day', 'Back Day', 'Cardio Day'];
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
          ${PRESETS.map((p) => `
            <button class="list-row button" data-name="${esc(p)}">
              <div class="row-main"><div class="row-title" style="color: var(--accent);">${esc(p)}</div></div>
            </button>
          `).join('')}
        </div>
        <div class="section">Other</div>
        <div class="form-section">
          <div class="form-row">
            <input id="wt-custom" placeholder="e.g. Push Day, Cardio" style="text-align: left;" />
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
  `;

  // Live timer in the nav bar
  const updateTimer = () => {
    ctx.setTitle(formatDuration((Date.now() - workout.startedAt) / 1000));
  };
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);

  // Save name on input; recompute the goal whenever it changes
  const nameInput = ctx.container.querySelector('#wname');
  nameInput.addEventListener('input', debounce(async () => {
    workout.name = nameInput.value;
    await put('workouts', workout);
    await refreshGoal();
  }, 300));

  let goalVolume = 0;
  async function refreshGoal() {
    goalVolume = await getGoalVolume(workout.name, workout.id);
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
        prevByExercise.set(eid, await previousWorkoutSetsForExercise(eid, workout.id));
      })
    );
    renderSections();
    await refreshGoal();
    updateRunningStats();
  }

  function updateRunningStats() {
    const exMap = new Map(allExercises.map((e) => [e.id, e]));
    const byMuscle = new Map();
    let totalVolume = 0;
    for (const s of sets) {
      if (!s.completed) continue;
      const ex = exMap.get(s.exerciseId);
      if (!ex) continue;
      const vol = (s.weight || 0) * (s.reps || 0);
      if (vol <= 0) continue;
      totalVolume += vol;
      const muscle = primaryMuscleFor(ex);
      byMuscle.set(muscle, (byMuscle.get(muscle) ?? 0) + vol);
    }
    const sorted = [...byMuscle.entries()].sort((a, b) => b[1] - a[1]);

    // Progress bar with one colored segment per muscle. Each segment carries
    // its own muscle name + volume INSIDE (visible only when the segment is
    // wide enough; CSS hides overflow on narrow ones). Bar width is
    // normalized to max(goalVolume, totalVolume) so we hit 100% exactly when
    // the user matches their previous workout total.
    const progressEl = ctx.container.querySelector('#workout-progress');
    if (progressEl) {
      if (sorted.length === 0 && goalVolume === 0) {
        progressEl.innerHTML = '';
      } else {
        const denom = Math.max(goalVolume, totalVolume, 1);
        const segments = sorted.map(([muscle, vol]) => {
          const widthPct = (vol / denom) * 100;
          return `
            <div class="vol-segment" style="width: ${widthPct.toFixed(2)}%; background: ${colorForMuscle(muscle)};" title="${esc(muscle)}: ${formatVolume(vol)} lbs">
              <span class="seg-name">${esc(muscle)}</span>
              <span class="seg-vol">${formatVolume(vol)}</span>
            </div>
          `;
        }).join('');
        let label;
        if (goalVolume > 0) {
          const pct = Math.round((totalVolume / goalVolume) * 100);
          label = `<strong>${formatVolume(totalVolume)}</strong> / ${formatVolume(goalVolume)} lbs · <span class="vol-pct">${pct}%</span>`;
        } else if (totalVolume > 0) {
          label = `<strong>${formatVolume(totalVolume)} lbs</strong> · no previous ${esc(workout.name)} to compare`;
        } else {
          label = `Goal: ${formatVolume(goalVolume)} lbs`;
        }
        progressEl.innerHTML = `
          <div class="vol-bar">${segments}</div>
          <div class="vol-label">${label}</div>
        `;
      }
    }
  }

  /** Most-recent finished workout with the same name → its total completed volume. */
  async function getGoalVolume(name, excludeId) {
    if (!name) return 0;
    const all = await getAll('workouts');
    const candidates = all
      .filter((w) => w.id !== excludeId && w.endedAt && w.name === name)
      .sort((a, b) => b.startedAt - a.startedAt);
    if (candidates.length === 0) return 0;
    const recent = candidates[0];
    const recentSets = sets.filter(() => false); // typing helper
    const setsAll = await getAll('sets');
    const recentVolume = setsAll
      .filter((s) => s.workoutId === recent.id && s.completed)
      .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
    return recentVolume;
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
        const prev = prevByExercise.get(eid) ?? [];
        return renderExerciseSection(ex, exSets, prev);
      })
      .join('');

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
        await put('sets', set);
        if (set.completed) updateRunningStats();
      }, 200));

      repsInput.addEventListener('input', debounce(async () => {
        set.reps = parseInt(repsInput.value, 10) || 0;
        await put('sets', set);
        if (set.completed) updateRunningStats();
      }, 200));

      completeBtn.addEventListener('click', async () => {
        const wasCompleted = set.completed;
        set.completed = !set.completed;
        await put('sets', set);
        setRow.classList.toggle('completed', set.completed);
        completeBtn.innerHTML = checkIcon(set.completed);
        updateRunningStats();
        if (!wasCompleted && set.completed) {
          await maybeShowPRToast(set);
        }
      });

      // Tap set number to cycle Working → Warmup → Working
      const numBtn = setRow.querySelector('.set-number');
      if (numBtn) {
        numBtn.addEventListener('click', async () => {
          const current = set.setType || 'working';
          set.setType = current === 'warmup' ? 'working' : 'warmup';
          await put('sets', set);
          renderSections();  // re-render so set numbering updates correctly across the section
        });
      }
    }

    // Wire up add-set and exercise menu
    for (const addBtn of sectionsEl.querySelectorAll('.add-set-btn')) {
      addBtn.addEventListener('click', async () => {
        const eid = addBtn.dataset.exerciseId;
        await addSet(workout, sets, eid);
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
  }

  reload();

  return () => {
    if (timerInterval) clearInterval(timerInterval);
  };
}

function renderExerciseSection(exercise, sets, prevSets = []) {
  // Warmups get their own counter (W1, W2, W3); working sets get 1, 2, 3.
  // PREV matches by type AND position-within-type so W1 lines up with last
  // workout's W1, working-set 2 lines up with last workout's working-set 2, etc.
  let workingIndex = 0;
  let warmupIndex = 0;
  const setBlocks = sets.map((s) => {
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
    const prev = findPrevSetByTypeAndPosition(type, positionInType, prevSets);
    return renderSetRow(s, display, prev);
  }).join('');

  return `
    <div class="exercise-section">
      <div class="exercise-section-header">
        <div class="name">${esc(exercise?.name ?? 'Unknown exercise')}</div>
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
 * Walk through prevSets (already sorted by `order`) and find the n-th
 * set of the given type. positionInType is 1-indexed.
 */
function findPrevSetByTypeAndPosition(type, positionInType, prevSets) {
  let count = 0;
  for (const p of prevSets) {
    if ((p.setType || 'working') === type) {
      count += 1;
      if (count === positionInType) return p;
    }
  }
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
 * Attaches iOS-style swipe-left-to-reveal-delete behavior to a set row.
 * onDelete is called when the user taps the revealed Delete button.
 * Only one row stays open at a time — any other open row auto-closes.
 */
function attachSwipeToDelete(wrap, onDelete) {
  const row = wrap.querySelector('.set-row');
  const deleteBtn = wrap.querySelector('.set-swipe-delete');
  if (!row || !deleteBtn) return;

  const REVEAL_WIDTH = 88;  // px the row slides left to fully expose Delete
  const TRIGGER = 40;       // px past which we snap open instead of closed

  let startX = 0;
  let startY = 0;
  let currentDX = 0;
  let tracking = false;
  let horizontal = false;
  let isOpen = false;

  function setOffset(px, animate) {
    row.style.transition = animate ? 'transform 0.18s ease' : 'none';
    row.style.transform = `translateX(${px}px)`;
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
        el.classList.remove('swiped-open');
      }
    });
    isOpen = true;
    setOffset(-REVEAL_WIDTH, animate);
    wrap.classList.add('swiped-open');
  }

  row.addEventListener('touchstart', (e) => {
    if (e.target.matches('input, button')) return;  // let inputs/buttons own their gesture
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentDX = 0;
    tracking = true;
    horizontal = false;
  }, { passive: true });

  row.addEventListener('touchmove', (e) => {
    if (!tracking) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (!horizontal) {
      if (Math.abs(dy) > Math.abs(dx) + 4) {
        // Looks like a vertical scroll; bail
        tracking = false;
        return;
      }
      if (Math.abs(dx) > 6) horizontal = true;
    }
    if (!horizontal) return;
    const base = isOpen ? -REVEAL_WIDTH : 0;
    currentDX = Math.min(0, Math.max(-REVEAL_WIDTH, base + dx));
    setOffset(currentDX, false);
  }, { passive: true });

  function endSwipe() {
    if (!tracking) return;
    tracking = false;
    if (!horizontal) return;
    if (currentDX < -TRIGGER) open();
    else close();
  }
  row.addEventListener('touchend', endSwipe);
  row.addEventListener('touchcancel', endSwipe);

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onDelete();
  });
}

function formatWeight(w) {
  if (w == null) return '0';
  if (w % 1 === 0) return String(w);
  return String(Math.round(w * 10) / 10);
}

function checkIcon(completed) {
  if (completed) {
    return `<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
}

async function addExercisesToWorkout(workout, existingSets, exerciseIds) {
  const baseOrder = existingSets.reduce((m, s) => Math.max(m, s.order), -1) + 1;
  let order = baseOrder;
  for (const exerciseId of exerciseIds) {
    const last = await lastCompletedSetForExercise(exerciseId, workout.id);
    const set = {
      id: uuid(),
      workoutId: workout.id,
      exerciseId,
      weight: last?.weight ?? 0,
      reps: last?.reps ?? 0,
      completed: false,
      order: order++,
      createdAt: Date.now(),
    };
    await put('sets', set);
  }
}

async function addSet(workout, existingSets, exerciseId) {
  const setsForEx = existingSets.filter((s) => s.exerciseId === exerciseId);
  const last = setsForEx[setsForEx.length - 1];
  const set = {
    id: uuid(),
    workoutId: workout.id,
    exerciseId,
    weight: last?.weight ?? 0,
    reps: last?.reps ?? 0,
    completed: false,
    order: (last?.order ?? -1) + 1,
    createdAt: Date.now(),
  };
  await put('sets', set);
}

async function finishWorkout(workout, sets) {
  for (const s of sets) {
    if (!s.completed && (s.weight || 0) === 0 && (s.reps || 0) === 0) {
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
        const cats = ['All', ...new Set(allExercises.map((e) => e.category))];
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
          .filter((e) => !category || e.category === category)
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
                    <div class="row-subtitle">${esc(e.equipment)} · ${esc(e.category)}</div>
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
        <div class="section">Category</div>
        <div class="form-section">
          <div class="form-row">
            <label for="ce-cat">Category</label>
            <select id="ce-cat">${CATEGORIES.map((c) => `<option>${c}</option>`).join('')}</select>
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

export { openAddCustomExercise };
