// Unit tests for the set-goal model (src/goals.js). Run with `npm test`.
// Histories are synthetic: each helper builds plain workout/set records the
// same shape the app stores in IndexedDB.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  prepareHistory, calibrate, goalsForWorkout, gapFactor, restFactor,
  capacity, DEFAULT_PARAMS, suggestExercises,
} from '../src/goals.js';
import { buildPrevSlotMaps } from '../src/db.js';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 9, 18, 17, 0, 0);

const EXERCISES = [
  { id: 'bench', name: 'Bench Press', equipment: 'Barbell' },
  { id: 'incline', name: 'Incline Bench Press', equipment: 'Dumbbell' },
  { id: 'pushdown', name: 'Tricep Pushdown', equipment: 'Cable' },
  { id: 'squat', name: 'Squat', equipment: 'Barbell' },
  { id: 'pullup', name: 'Pull-Up', equipment: 'Bodyweight' },
];

let seq = 0;
const id = (p) => `${p}-${++seq}`;

/** A finished workout at time t with the given exercise blocks. */
function workoutAt(t, blocks, name = 'Chest Day') {
  const w = { id: id('w'), name, startedAt: t, endedAt: t + 60 * 60 * 1000, notes: '' };
  const sets = [];
  let order = 0;
  for (const { exerciseId, sets: rows } of blocks) {
    for (const row of rows) {
      const [weight, reps, extra = {}] = row;
      sets.push({
        id: id('s'), workoutId: w.id, exerciseId, weight, reps,
        setType: 'working', completed: true, order: order++, createdAt: t, ...extra,
      });
    }
  }
  return { workout: w, sets };
}

function buildData(sessions) {
  const workouts = [];
  const sets = [];
  for (const s of sessions) {
    workouts.push(s.workout);
    sets.push(...s.sets);
  }
  return { workouts, sets };
}

/** Active workout with the given sets (defaults: working, not completed, autofill). */
function active(t, rows) {
  const w = { id: id('w'), name: 'Chest Day', startedAt: t, endedAt: null, notes: '' };
  const sets = rows.map((r, i) => ({
    id: id('s'), workoutId: w.id, exerciseId: r.exerciseId, weight: r.weight ?? 0, reps: r.reps ?? 0,
    setType: r.setType ?? 'working', completed: !!r.completed, order: i, createdAt: t,
    autofill: r.autofill ?? !r.completed, ...r.extra,
  }));
  return { workout: w, sets };
}

/** Goals for an active workout over a history, with calibration. */
function goalsFor(data, act, now = NOW, opts = {}) {
  const allSets = [...data.sets, ...act.sets];
  const allWorkouts = [...data.workouts, act.workout];
  const history = prepareHistory({ sets: allSets, workouts: allWorkouts, exercises: EXERCISES, excludeWorkoutId: act.workout.id });
  const params = opts.params ?? calibrate(history).params;
  const prevMaps = buildPrevSlotMaps(allSets, allWorkouts, act.workout.id);
  const prevFor = (s) => {
    const exSets = act.sets.filter((x) => x.exerciseId === s.exerciseId).sort((a, b) => a.order - b.order);
    const type = s.setType || 'working';
    let pos = 0;
    for (const x of exSets) { if ((x.setType || 'working') === type) pos += 1; if (x.id === s.id) break; }
    return prevMaps.get(s.exerciseId)?.get(`${type}#${pos}`) ?? null;
  };
  return goalsForWorkout({ history, params, workout: act.workout, sets: act.sets, prevFor, now });
}

/** Steady bench history: 3 × 155×10 every 3 days, ending `lastAgo` before NOW. */
function steadyBench({ sessions = 8, every = 3 * DAY, lastAgo = 3 * DAY, weight = 155, reps = 10, extra } = {}) {
  const out = [];
  for (let i = sessions - 1; i >= 0; i--) {
    const t = NOW - lastAgo - i * every;
    out.push(workoutAt(t, [{ exerciseId: 'bench', sets: [[weight, reps, extra], [weight, reps, extra], [weight, reps, extra]] }]));
  }
  return out;
}

const goalCap = (g) => capacity(g.weight > 0 ? g.weight : 1, g.reps, DEFAULT_PARAMS.targetRir);

test('gap curve: per-day, a small lift after a few days off, a loss after weeks away', () => {
  const p = DEFAULT_PARAMS;
  assert.equal(gapFactor(1, p), 1);
  assert.ok(gapFactor(5, p) > gapFactor(2, p));
  assert.ok(gapFactor(4, p) !== gapFactor(3, p), 'distinct 24-hour steps');
  assert.ok(gapFactor(21, p) < gapFactor(10, p));
  assert.ok(gapFactor(60, p) < gapFactor(28, p));
  assert.ok(gapFactor(365, p) >= 0.85);
});

test('rest factor stays within a few percent and ignores implausible gaps', () => {
  const p = DEFAULT_PARAMS;
  assert.equal(restFactor(null, p), 1);
  assert.equal(restFactor(5, p), 1, 'batch check-offs are not rests');
  assert.ok(restFactor(45, p) < 1 && restFactor(45, p) >= 0.94);
  assert.ok(restFactor(300, p) > 1 && restFactor(300, p) <= 1.02);
});

test('steady straight sets: goal steps the weight up once at the same reps', () => {
  const data = buildData(steadyBench());
  const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10 }, { exerciseId: 'bench', weight: 155, reps: 10 }]);
  const goals = goalsFor(data, act);
  const g1 = goals.get(act.sets[0].id);
  assert.equal(g1.kind, 'model');
  assert.equal(g1.weight, 160);
  assert.equal(g1.reps, 10);
  assert.ok(g1.reasons.some((r) => r.label === 'Progression' && r.lbs === 5));
  assert.deepEqual(g1.last && [g1.last.weight, g1.last.reps], [155, 10]);
  const g2 = goals.get(act.sets[1].id);
  assert.ok(goalCap(g2) <= goalCap(g1));
});

test('a long layoff lowers the goal; no progression push after weeks away', () => {
  const normal = goalsFor(buildData(steadyBench()), active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10 }]));
  const layoffData = buildData(steadyBench({ lastAgo: 35 * DAY }));
  const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10 }]);
  const layoff = goalsFor(layoffData, act).get(act.sets[0].id);
  const base = [...normal.values()][0];
  assert.ok(goalCap(layoff) < goalCap(base));
  assert.ok(layoff.reps <= 9, `expected ≤ 9 reps after 5 weeks off, got ${layoff.reps}`);
  assert.ok(!layoff.reasons.some((r) => r.label === 'Progression'));
});

test('day-level gap: 2 vs 5 days since last time give different goals', () => {
  const at = (days) => {
    const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10 }]);
    return goalsFor(buildData(steadyBench({ lastAgo: days * DAY, every: 4 * DAY })), act).get(act.sets[0].id);
  };
  const two = at(2);
  const five = at(5);
  const gapReason = (g) => g.reasons.find((r) => r.label === 'Days since you did this');
  assert.match(gapReason(two).detail, /^2 days \(48 h\)/);
  assert.match(gapReason(five).detail, /^5 days \(120 h\)/);
  assert.ok(gapReason(five).reps > gapReason(two).reps);
});

test('chest hammered yesterday lowers today\'s bench goal', () => {
  const sessions = steadyBench({ lastAgo: 4 * DAY });
  const control = goalsFor(buildData(sessions), active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10 }]));
  const yesterday = workoutAt(NOW - 20 * HOUR, [{ exerciseId: 'incline', sets: Array(8).fill([60, 10]) }]);
  const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10 }]);
  const tired = goalsFor(buildData([...sessions, yesterday]), act, NOW, { params: DEFAULT_PARAMS }).get(act.sets[0].id);
  assert.ok(goalCap(tired) < goalCap([...control.values()][0]));
  const recovery = tired.reasons.find((r) => r.label === 'Muscle recovery');
  // Timed from the last set of that workout, ~56 min after it started.
  assert.match(recovery.detail, /Last worked 19 h ago \(8 sets\) · still recovering/);
  assert.ok(recovery.reps < -0.5);
});

test('sets already done for the same muscles this workout lower the goal', () => {
  const data = buildData(steadyBench());
  const fresh = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10 }]);
  const freshGoal = goalsFor(data, fresh, NOW, { params: DEFAULT_PARAMS }).get(fresh.sets[0].id);
  const rows = [
    ...Array(4).fill(0).map((_, i) => ({ exerciseId: 'incline', weight: 60, reps: 10, completed: true, extra: { completedAt: NOW - (20 - i * 3) * 60 * 1000 } })),
    { exerciseId: 'bench', weight: 155, reps: 10 },
  ];
  const act = active(NOW - 30 * 60 * 1000, rows);
  const g = goalsFor(data, act, NOW, { params: DEFAULT_PARAMS }).get(act.sets[4].id);
  assert.ok(goalCap(g) < goalCap(freshGoal));
  assert.ok(g.reasons.some((r) => r.label === 'Earlier this workout' && r.reps < 0));
});

test('beating set 1 raises the rest of today\'s goals; falling short lowers them', () => {
  const data = buildData(steadyBench());
  const plan = (first) => {
    const act = active(NOW - 10 * 60 * 1000, [
      { exerciseId: 'bench', weight: first[0], reps: first[1], completed: true, extra: { completedAt: NOW - 3 * 60 * 1000 } },
      { exerciseId: 'bench', weight: 155, reps: 10 },
    ]);
    return goalsFor(data, act).get(act.sets[1].id);
  };
  const strong = plan([165, 10]);
  const onPlan = plan([155, 11]);
  const weak = plan([155, 7]);
  assert.ok(goalCap(strong) > goalCap(onPlan));
  assert.ok(goalCap(weak) < goalCap(onPlan));
  assert.equal(strong.weight, 165, 'holds the weight just lifted');
  assert.ok(strong.reasons.some((r) => /stronger than expected/.test(r.detail)));
});

test('an Easy rating on set 1 raises set 2 over an unrated set 1', () => {
  const data = buildData(steadyBench());
  const plan = (effort) => {
    const act = active(NOW, [
      { exerciseId: 'bench', weight: 155, reps: 10, completed: true, extra: { completedAt: NOW - 2 * 60 * 1000, ...(effort ? { effort } : {}) } },
      { exerciseId: 'bench', weight: 155, reps: 10 },
    ]);
    return goalsFor(data, act).get(act.sets[1].id);
  };
  assert.ok(goalCap(plan('easy')) > goalCap(plan(null)));
  assert.ok(goalCap(plan('hard')) < goalCap(plan(null)));
});

test('reps past the usual range step the weight up (double progression)', () => {
  // History climbing in reps at 155 → today's goal should move to a heavier weight.
  const sessions = [];
  const reps = [10, 10, 11, 11, 12, 12, 13];
  reps.forEach((r, i) => {
    sessions.push(workoutAt(NOW - (reps.length - i) * 3 * DAY, [{ exerciseId: 'bench', sets: [[155, r], [155, r], [155, r]] }]));
  });
  const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 13 }]);
  const g = goalsFor(buildData(sessions), act).get(act.sets[0].id);
  assert.ok(g.weight > 155, `expected a heavier weight, got ${g.weight} × ${g.reps}`);
  assert.ok(g.reps <= 14);
});

test('an autofilled set\'s goal weight carries into the next set\'s anchor', () => {
  const sessions = [];
  const reps = [10, 11, 12, 13, 13, 13];
  reps.forEach((r, i) => {
    sessions.push(workoutAt(NOW - (reps.length - i) * 3 * DAY, [{ exerciseId: 'bench', sets: [[155, r], [155, r]] }]));
  });
  const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 13 }, { exerciseId: 'bench', weight: 155, reps: 13 }]);
  const goals = goalsFor(buildData(sessions), act);
  assert.equal(goals.get(act.sets[1].id).weight, goals.get(act.sets[0].id).weight);
});

test('bodyweight exercises get rep goals at zero weight', () => {
  const sessions = [];
  for (let i = 6; i >= 1; i--) {
    sessions.push(workoutAt(NOW - i * 3 * DAY, [{ exerciseId: 'pullup', sets: [[0, 10], [0, 9], [0, 8]] }], 'Back/Bi Day'));
  }
  const act = active(NOW, [{ exerciseId: 'pullup' }, { exerciseId: 'pullup' }]);
  const goals = goalsFor(buildData(sessions), act);
  const g1 = goals.get(act.sets[0].id);
  assert.equal(g1.weight, 0);
  assert.ok(g1.reps >= 9 && g1.reps <= 12, `got ${g1.reps}`);
  assert.ok(goals.get(act.sets[1].id).reps <= g1.reps, 'personal drop-off from set 1 to set 2');
});

test('a brand-new exercise has no goal until a set is done, then follows it', () => {
  const data = buildData(steadyBench());
  const empty = active(NOW, [{ exerciseId: 'squat' }]);
  assert.equal(goalsFor(data, empty).size, 0);
  const act = active(NOW, [
    { exerciseId: 'squat', weight: 185, reps: 8, completed: true, extra: { completedAt: NOW - 60 * 1000 } },
    { exerciseId: 'squat', weight: 0, reps: 0 },
  ]);
  const g = goalsFor(data, act).get(act.sets[1].id);
  assert.equal(g.weight, 185);
  assert.ok(g.reps >= 7 && g.reps <= 8);
});

test('warmups ramp to today\'s working goal on the user\'s own steps, reps tapering', () => {
  const s = workoutAt(NOW - 3 * DAY, [{ exerciseId: 'bench', sets: [[95, 12, { setType: 'warmup' }], [155, 10], [155, 10]] }]);
  const act = active(NOW, [{ exerciseId: 'bench', setType: 'warmup' }, { exerciseId: 'bench', weight: 155, reps: 10 }]);
  const goals = goalsFor(buildData([s]), act);
  const w = goals.get(act.sets[0].id);
  const work = goals.get(act.sets[1].id);
  assert.equal(work.kind, 'model');
  assert.equal(w.kind, 'warmup');
  assert.ok(w.personal);
  assert.equal(w.target.weight, work.weight);
  // Same share of the working weight as last time (95 / 155), on 5 lb steps.
  assert.ok(Math.abs(w.weight - work.weight * 95 / 155) <= 5);
  assert.ok(w.reps < 12 && w.reps >= 5);
});

test('a heavier working set pulls the warmups up with it', () => {
  const s = workoutAt(NOW - 3 * DAY, [{ exerciseId: 'bench', sets: [[95, 8, { setType: 'warmup' }], [135, 5, { setType: 'warmup' }], [155, 10], [155, 10]] }]);
  const plan = (weight) => {
    const act = active(NOW, [
      { exerciseId: 'bench', setType: 'warmup' }, { exerciseId: 'bench', setType: 'warmup' },
      { exerciseId: 'bench', weight, reps: 10, autofill: false },
    ]);
    const goals = goalsFor(buildData([...steadyBench(), s]), act);
    return act.sets.slice(0, 2).map((x) => goals.get(x.id));
  };
  const [b1, b2] = plan(155);
  const [h1, h2] = plan(185);
  assert.deepEqual([b1.weight, b2.weight], [95, 135]);  // same day as last time → same warm-ups
  assert.ok(h1.weight > b1.weight && h2.weight > b2.weight && h2.weight < 185);
  assert.ok(h2.reps <= h1.reps);
});

test('warmups with no history use a standard ramp below the typed working weight', () => {
  const act = active(NOW, [
    { exerciseId: 'squat', setType: 'warmup' }, { exerciseId: 'squat', setType: 'warmup' }, { exerciseId: 'squat', setType: 'warmup' },
    { exerciseId: 'squat', weight: 225, reps: 5, autofill: false },
  ]);
  const goals = goalsFor(buildData([]), act);
  const ws = act.sets.slice(0, 3).map((x) => goals.get(x.id));
  assert.deepEqual(ws.map((g) => g.weight), [100, 145, 190]);
  assert.ok(ws.every((g) => !g.personal && g.target.weight === 225));
  assert.ok(ws[0].reps >= ws[1].reps && ws[1].reps >= ws[2].reps && ws[2].reps >= 1);
});

test('a trailing warmup with no working set after it repeats last time', () => {
  const s = workoutAt(NOW - 3 * DAY, [{ exerciseId: 'bench', sets: [[95, 12, { setType: 'warmup' }], [155, 10]] }]);
  const act = active(NOW, [{ exerciseId: 'bench', setType: 'warmup' }]);
  const goals = goalsFor(buildData([s]), act);
  assert.deepEqual(goals.get(act.sets[0].id), { kind: 'warmup', weight: 95, reps: 12, target: null });
});

test('hitting every recorded goal last time triggers progression; missing one does not', () => {
  const run = (lastReps) => {
    const sessions = steadyBench({ sessions: 5 });
    const last = workoutAt(NOW - 3 * DAY, [{
      exerciseId: 'bench',
      sets: [[155, 11, { goalWeight: 155, goalReps: 11 }], [155, lastReps, { goalWeight: 155, goalReps: 11 }]],
    }]);
    const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 11 }]);
    return goalsFor(buildData([...sessions, last]), act).get(act.sets[0].id);
  };
  assert.ok(run(11).reasons.some((r) => r.label === 'Progression'));
  assert.ok(!run(9).reasons.some((r) => r.label === 'Progression'));
});

test('other lifts beating their goals today nudge this one up', () => {
  const data = buildData(steadyBench());
  const plan = (pushdownReps) => {
    const act = active(NOW - 20 * 60 * 1000, [
      { exerciseId: 'squat', weight: 225, reps: pushdownReps, completed: true, extra: { goalWeight: 225, goalReps: 8, completedAt: NOW - 10 * 60 * 1000 } },
      { exerciseId: 'bench', weight: 155, reps: 10 },
    ]);
    return goalsFor(data, act, NOW, { params: DEFAULT_PARAMS }).get(act.sets[1].id);
  };
  const strong = plan(11);
  const weak = plan(5);
  assert.ok(goalCap(strong) >= goalCap(weak));
  assert.ok(strong.reasons.some((r) => r.label === 'Today so far' && r.reps > 0));
  assert.ok(weak.reasons.some((r) => r.label === 'Today so far' && r.reps < 0));
});

test('rest between sets is read from check-off times', () => {
  const sessions = steadyBench({ sessions: 4, lastAgo: 6 * DAY });
  const last = workoutAt(NOW - 3 * DAY, [{
    exerciseId: 'bench',
    sets: [[155, 10, { completedAt: NOW - 3 * DAY }], [155, 9, { completedAt: NOW - 3 * DAY + 45 * 1000 }]],
  }]);
  const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10 }, { exerciseId: 'bench', weight: 155, reps: 10 }]);
  const g2 = goalsFor(buildData([...sessions, last]), act, NOW, { params: DEFAULT_PARAMS }).get(act.sets[1].id);
  const rest = g2.reasons.find((r) => r.label === 'Rest last time');
  assert.ok(rest, 'explains the short rest');
  assert.match(rest.detail, /^0:45 before that set/);
  assert.ok(rest.reps > 0, 'a normal rest today should beat a 45 s rest');
});

/**
 * Synthetic lifter whose true performance follows a known fatigue effect:
 * bench on Mondays fresh, and some weeks bench again Wednesday after a heavy
 * chest day Tuesday. Calibration should find a stronger-than-default fatigue
 * effect and predict better than "same as last time".
 */
test('calibration learns a strong fatigue effect from history', () => {
  let rand = 7;
  const noise = () => { rand = (rand * 16807) % 2147483647; return (rand / 2147483647 - 0.5) * 0.02; };
  const sessions = [];
  let truth = 220;  // true fresh capacity
  for (let week = 40; week >= 1; week--) {
    const mon = NOW - week * 7 * DAY;
    truth *= 1.003;
    const repsAt = (factor) => Math.max(3, Math.round(30 * (truth * factor * (1 + noise()) / 155 - 1) - 1.5));
    sessions.push(workoutAt(mon, [{ exerciseId: 'bench', sets: [[155, repsAt(1)], [155, repsAt(0.985)]] }]));
    if (week % 2 === 0) {
      sessions.push(workoutAt(mon + DAY, [{ exerciseId: 'incline', sets: Array(10).fill([60, 10]) }]));
      sessions.push(workoutAt(mon + 2 * DAY, [{ exerciseId: 'bench', sets: [[155, repsAt(0.9)], [155, repsAt(0.885)]] }]));
    }
  }
  const data = buildData(sessions);
  const history = prepareHistory({ sets: data.sets, workouts: data.workouts, exercises: EXERCISES });
  const { params, stats } = calibrate(history);
  assert.ok(params.fatigue > DEFAULT_PARAMS.fatigue, `fatigue ${params.fatigue}`);
  assert.ok(stats.model > stats.naive, `model ${stats.model} vs naive ${stats.naive}`);
});

test('calibration on a big history stays fast', () => {
  const sessions = [];
  const ids = ['bench', 'incline', 'pushdown', 'squat'];
  for (let d = 730; d >= 1; d -= 2) {
    sessions.push(workoutAt(NOW - d * DAY, ids.map((exerciseId) => ({ exerciseId, sets: Array(4).fill([100 + (d % 7), 10]) }))));
  }
  const data = buildData(sessions);
  const t0 = performance.now();
  const history = prepareHistory({ sets: data.sets, workouts: data.workouts, exercises: EXERCISES });
  calibrate(history);
  const ms = performance.now() - t0;
  assert.ok(ms < 1500, `took ${Math.round(ms)} ms`);
});

test('no step up when last time was rated Hard, and never more than one step', () => {
  const hard = steadyBench().map((s, i, all) => (i === all.length - 1
    ? { ...s, sets: s.sets.map((x) => ({ ...x, effort: 'hard' })) } : s));
  const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10 }]);
  const g = goalsFor(buildData(hard), act).get(act.sets[0].id);
  assert.ok(g.weight <= 155, `expected no step after Hard, got ${g.weight}`);

  // Much stronger lately (reps far above the range) still moves one step at most.
  const strong = steadyBench().map((s, i, all) => (i === all.length - 1
    ? { ...s, sets: s.sets.map((x) => ({ ...x, reps: 20 })) } : s));
  const act2 = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 20 }]);
  const g2 = goalsFor(buildData(strong), act2).get(act2.sets[0].id);
  assert.ok(g2.weight <= 160, `expected at most one step, got ${g2.weight}`);
});

test('suggestions skip exercises already in the workout and favor untrained muscles', () => {
  const data = buildData([
    workoutAt(NOW - 3 * DAY, [{ exerciseId: 'bench', sets: [[155, 10], [155, 10], [155, 10]] }]),
    workoutAt(NOW - 2 * DAY, [{ exerciseId: 'squat', sets: [[225, 5], [225, 5]] }], 'Leg Day'),
    workoutAt(NOW - 20 * DAY, [{ exerciseId: 'pushdown', sets: [[50, 12]] }]),
  ]);
  const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10 }]);
  const history = prepareHistory({ sets: [...data.sets, ...act.sets], workouts: [...data.workouts, act.workout], exercises: EXERCISES, excludeWorkoutId: act.workout.id });
  const out = suggestExercises({ history, params: DEFAULT_PARAMS, exercises: EXERCISES, sets: act.sets, now: NOW });
  const ids = out.map((x) => x.exercise.id);
  assert.ok(!ids.includes('bench'));
  assert.ok(!ids.includes('pullup'), 'never-done exercises are not suggested');
  assert.ok(ids.includes('pushdown'));
});

test('per-workout suggestions: the usual sets of this day type, minus today', () => {
  const past = [
    workoutAt(NOW - 6 * DAY, [{ exerciseId: 'bench', sets: [[155, 10], [155, 10], [155, 10]] }, { exerciseId: 'pushdown', sets: [[50, 12], [50, 12], [50, 12]] }]),
    workoutAt(NOW - 3 * DAY, [{ exerciseId: 'bench', sets: [[155, 10], [155, 10], [155, 10]] }, { exerciseId: 'pushdown', sets: [[50, 12], [50, 12], [50, 12]] }]),
  ];
  const data = buildData(past);
  const act = active(NOW, [{ exerciseId: 'bench', weight: 155, reps: 10, completed: true }]);
  const history = prepareHistory({ sets: [...data.sets, ...act.sets], workouts: [...data.workouts, act.workout], exercises: EXERCISES, excludeWorkoutId: act.workout.id });
  const out = suggestExercises({
    history, params: DEFAULT_PARAMS, exercises: EXERCISES, sets: act.sets, now: NOW,
    pastWorkoutIds: past.map((p) => p.workout.id),
  });
  const pushdown = out.find((x) => x.exercise.id === 'pushdown');
  assert.ok(pushdown, 'pushdown is suggested');
  assert.equal(pushdown.usual, 5);  // 3 pushdowns + half credit from 3 bench sets
  assert.equal(pushdown.done, 1);   // half credit from today's bench set, rounded
});
