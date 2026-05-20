import {
  getActiveWorkout,
  getWorkoutSets,
  getExerciseSets,
  getAll,
  put,
  del,
  deleteWorkoutAndSets,
  lastCompletedSetForExercise,
  previousWorkoutSetsForExercise,
} from '../db.js';
import {
  uuid, esc, formatDuration, todayWorkoutName, showSheet, emit, debounce, showToast,
} from '../utils.js';
import { CATEGORIES, EQUIPMENT } from '../seed.js';
import { downloadBackup, autoBackupSilent } from '../backup.js';

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

function renderStart(ctx) {
  ctx.setTitle('Workout');
  ctx.container.innerHTML = `
    <div class="workout-start">
      <div class="icon">🏋️</div>
      <h2>No active workout</h2>
      <p>Start one to begin logging sets.</p>
    </div>
    <div class="action-section">
      <button id="start-btn" class="btn-primary">Start Empty Workout</button>
    </div>
  `;
  ctx.container.querySelector('#start-btn').addEventListener('click', startNewWorkout);
}

async function startNewWorkout() {
  const workout = {
    id: uuid(),
    name: todayWorkoutName(),
    startedAt: Date.now(),
    endedAt: null,
    notes: '',
  };
  await put('workouts', workout);
  emit('workout:changed');
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
      <div class="workout-hint">Tap a set number to mark it as a warmup.</div>
      <div class="muscle-split" id="muscle-split"></div>
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

  // Save name on input
  const nameInput = ctx.container.querySelector('#wname');
  nameInput.addEventListener('input', debounce(async () => {
    workout.name = nameInput.value;
    await put('workouts', workout);
  }, 250));

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
    if (!confirm('Finish this workout? Empty sets will be removed.')) return;
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
    updateMuscleSplit();
  }

  function updateMuscleSplit() {
    const exMap = new Map(allExercises.map((e) => [e.id, e]));
    const byCategory = new Map();
    for (const s of sets) {
      if (!s.completed) continue;
      if ((s.setType || 'working') === 'warmup') continue;
      const ex = exMap.get(s.exerciseId);
      if (!ex) continue;
      const vol = (s.weight || 0) * (s.reps || 0);
      if (vol <= 0) continue;
      byCategory.set(ex.category, (byCategory.get(ex.category) ?? 0) + vol);
    }
    const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
    const el = ctx.container.querySelector('#muscle-split');
    if (!el) return;
    if (sorted.length === 0) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = sorted
      .map(([cat, vol]) =>
        `<div class="muscle-split-pill"><strong>${esc(cat)}</strong> ${formatVolume(vol)}</div>`
      )
      .join('');
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

    const epley = (w, r) => r <= 1 ? w : w * (1 + r / 30);
    const maxWeight = prior.reduce((m, s) => Math.max(m, s.weight), 0);
    const maxE1RM = prior.reduce((m, s) => Math.max(m, epley(s.weight, s.reps)), 0);
    const e1rm = epley(set.weight, set.reps);

    const prs = [];
    if (set.weight > maxWeight) prs.push(`Heaviest ${formatWeight(set.weight)} lbs`);
    if (e1rm > maxE1RM + 0.01) prs.push(`1RM ${Math.round(e1rm)} lbs`);

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
    for (const setRow of sectionsEl.querySelectorAll('.set-row')) {
      const setId = setRow.dataset.setId;
      const set = sets.find((s) => s.id === setId);
      if (!set) continue;

      const weightInput = setRow.querySelector('.weight-input');
      const repsInput = setRow.querySelector('.reps-input');
      const completeBtn = setRow.querySelector('.complete-btn');

      weightInput.addEventListener('input', debounce(async () => {
        set.weight = parseFloat(weightInput.value) || 0;
        await put('sets', set);
        if (set.completed) updateMuscleSplit();
      }, 200));

      repsInput.addEventListener('input', debounce(async () => {
        set.reps = parseInt(repsInput.value, 10) || 0;
        await put('sets', set);
        if (set.completed) updateMuscleSplit();
      }, 200));

      completeBtn.addEventListener('click', async () => {
        const wasCompleted = set.completed;
        set.completed = !set.completed;
        await put('sets', set);
        setRow.classList.toggle('completed', set.completed);
        completeBtn.innerHTML = checkIcon(set.completed);
        updateMuscleSplit();
        if (!wasCompleted && set.completed) {
          await maybeShowPRToast(set);
          // Silently snapshot the full DB to iCloud Drive after every completed set.
          // This is the "don't lose progress mid-workout" safety net.
          autoBackupSilent();
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
  // Working-set numbering excludes warmups; PREV matches by raw index.
  let workingIndex = 0;
  const setBlocks = sets.map((s, i) => {
    const type = s.setType || 'working';
    const display = type === 'warmup' ? 'W' : String(++workingIndex);
    return renderSetRow(s, display, prevSets[i]);
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

function renderSetRow(set, displayLabel, prevSet) {
  const type = set.setType || 'working';
  const prevText = prevSet && prevSet.weight > 0 && prevSet.reps > 0
    ? `${formatWeight(prevSet.weight)} × ${prevSet.reps}`
    : '—';
  return `
    <div class="set-row type-${type}${set.completed ? ' completed' : ''}" data-set-id="${set.id}">
      <button class="set-number" aria-label="Tap to toggle warmup">${displayLabel}</button>
      <div class="prev" aria-label="Previous">${prevText}</div>
      <input class="weight-input" type="number" inputmode="decimal" step="0.5"
             placeholder="0" value="${set.weight > 0 ? set.weight : ''}" />
      <input class="reps-input" type="number" inputmode="numeric" step="1"
             placeholder="0" value="${set.reps > 0 ? set.reps : ''}" />
      <button class="complete-btn" aria-label="Toggle complete">${checkIcon(set.completed)}</button>
    </div>
  `;
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
        <div class="section">Notes</div>
        <div class="form-section">
          <div class="form-row">
            <textarea id="ce-notes" placeholder="Optional"></textarea>
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
          notes: sheet.querySelector('#ce-notes').value,
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
