// Set goals: what to reach for on each set of the active workout, in place of
// simply repeating last time's numbers.
//
// The model works on "capacity", an internal strength number (an Epley-style
// estimated max that also counts the reps left in the tank). It is never shown;
// every effect is turned back into lbs × reps before it reaches the screen.
//
// A set's goal is built as
//
//   baseline       recency-weighted capacity over recent sessions of this
//                  exercise, projected forward along its trend
//   × days off     per-day curve: a small lift after a few days' rest, a
//                  gradual detraining loss after ~10 days away
//   × recovery     residual load on the exercise's muscles from the last week
//                  of training (any exercise hitting them), fading by the hour
//   × this workout load already put on those muscles earlier today
//   × progression  one rep's worth, when every goal was hit last time
//   × today        how today's earlier sets and other lifts compare to plan
//   × set position the user's own typical drop from set 1 to set k
//
// Every past session is first divided by the same factors as they stood back
// then, so the baseline is "context-free". A context that never changes (say,
// incline always follows flat bench) cancels out; only differences from usual
// move the goal.
//
// Inputs the user adds while lifting:
//   completedAt  stamped when a set is checked off → rest between sets. Used
//                lightly (capped at a few percent) since logging can lag.
//   effort       optional one-tap rating (easy / solid / hard) → reps in
//                reserve, so "easy" sets raise the next goal.
//   goalWeight/goalReps  the goal as it stood when the set was checked off,
//                so the app knows which goals were hit.
//
// calibrate() fits the fatigue, recovery, detraining and recency settings to
// the user's own history by replaying it (predict each session from the ones
// before it, keep the settings that predicted best), shrunk toward the
// defaults until there's plenty of data.
//
// Everything here is pure except loadCalibration (appMeta cache).

import { performedSets, getAll, getMeta, setMeta } from './db.js';
import { muscleShares } from './seed.js';

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Bump when the model changes so cached calibrations are recomputed.
const MODEL_VERSION = 2;

/** One-tap effort ratings → reps in reserve (RIR). */
export const EFFORTS = {
  easy:  { label: 'Easy',  hint: '3+ left',  rir: 3.5 },
  solid: { label: 'Solid', hint: '1–2 left', rir: 1.5 },
  hard:  { label: 'Hard',  hint: '0–1 left', rir: 0.5 },
};
const UNRATED_RIR = EFFORTS.solid.rir;
// How much a set loads its muscles for the fatigue model, by effort.
const EFFORT_LOAD = { easy: 0.7, solid: 1, hard: 1.2 };

export const DEFAULT_PARAMS = {
  fatigue: 0.012,        // capacity lost per hard set of residual muscle load
  recoveryHours: 30,     // time constant for that load to fade
  detrain: 1,            // scale on the long-layoff curve
  halfLife: 3,           // sessions; recency weighting of the baseline
  position: [1, 0.985, 0.97, 0.955, 0.94, 0.925],  // capacity by working-set number
  targetRir: UNRATED_RIR,  // effort goals aim for
  typicalRestSec: 120,
};

// Days since the exercise was last done → capacity multiplier, one knot per
// day for the first two weeks, interpolated by the hour. Short-term soreness
// is the recovery factor's job; this is adaptation (a little stronger after a
// few days off) and detraining (weaker after ~10 days away).
const GAP_CURVE = [
  [0, 1], [1, 1], [2, 1], [3, 1.004], [4, 1.008], [5, 1.01], [6, 1.01],
  [7, 1.008], [8, 1.005], [9, 1.002], [10, 1], [11, 0.997], [12, 0.994],
  [13, 0.991], [14, 0.988], [21, 0.965], [28, 0.945], [35, 0.93], [42, 0.915],
  [56, 0.89], [84, 0.86],
];

// Warm-up reps as a share of the working reps, by the warm-up's share of the
// working weight: full reps when light, tapering to a single near the top.
const WARMUP_REPS = [[0, 1], [0.5, 1], [0.65, 0.65], [0.8, 0.4], [0.9, 0.2], [1, 0.12]];

/** Standard ramp (share of the working weight) for n warm-ups. */
function defaultRamp(n) {
  const table = { 1: [0.6], 2: [0.5, 0.75], 3: [0.45, 0.65, 0.85], 4: [0.4, 0.55, 0.7, 0.85] };
  if (table[n]) return table[n];
  return Array.from({ length: n }, (_, i) => 0.35 + (0.55 * i) / (n - 1));
}

const FATIGUE_WINDOW_MS = 7 * DAY_MS;
const BASELINE_SESSIONS = 8;
const BASELINE_WINDOW_MS = 180 * DAY_MS;

// ---------- Small math helpers ----------

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rirOf = (set) => EFFORTS[set.effort]?.rir ?? UNRATED_RIR;

/** Capacity of a set: load × (1 + (reps + reps in reserve) / 30). */
export function capacity(load, reps, rir) {
  return load * (1 + (reps + rir) / 30);
}

/** Reps achievable at `load` leaving `rir` in reserve, for a given capacity. */
function repsAt(cap, load, rir) {
  return 30 * (cap / load - 1) - rir;
}

function median(nums) {
  if (nums.length === 0) return null;
  const a = [...nums].sort((x, y) => x - y);
  const mid = a.length >> 1;
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function interpolate(curve, x) {
  if (x <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [x1, y1] = curve[i];
    if (x <= x1) {
      const [x0, y0] = curve[i - 1];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
  }
  return curve[curve.length - 1][1];
}

// ---------- Model factors ----------

export function gapFactor(days, params) {
  if (days == null) return 1;
  const base = interpolate(GAP_CURVE, days);
  return base < 1 ? 1 - params.detrain * (1 - base) : base;
}

/** Residual load (in hard sets) from [hoursAgo, weight] events. */
function residualLoad(events, params) {
  let load = 0;
  for (const [hours, weight] of events) load += weight * Math.exp(-hours / params.recoveryHours);
  return load;
}

function fatigueFactor(events, params) {
  return Math.max(0.75, 1 - params.fatigue * residualLoad(events, params));
}

/** Short rests depress the next set, long ones help a little. Capped hard. */
export function restFactor(sec, params) {
  if (sec == null || sec < 20 || sec > 900) return 1;
  return clamp(1 + 0.05 * Math.log2(sec / params.typicalRestSec), 0.94, 1.02);
}

export function positionFactor(k, params) {
  const p = params.position;
  if (k <= p.length) return p[k - 1];
  return Math.max(0.85, p[p.length - 1] - 0.01 * (k - p.length));
}

// ---------- Muscles ----------

/**
 * How much a set of `other` loads the muscles `target` uses, scaled so a set
 * of the same movement counts as 1 (a pushdown counts as ~⅓ of a bench set
 * for bench, all of one for itself).
 */
function overlap(target, other) {
  let num = 0;
  let self = 0;
  for (const [m, w] of target) {
    num += w * (other.get(m) ?? 0);
    self += w * w;
  }
  return self > 0 ? Math.min(1, num / self) : 0;
}

// ---------- History ----------

function isWarmup(set) {
  return (set.setType || 'working') === 'warmup';
}

/**
 * Index the performed history (everything but the active workout) for the
 * model: per-exercise sessions of working sets with their capacities, rests,
 * and gaps, plus a time-sorted list of every working set for the fatigue
 * model. Sessions' context factors are computed lazily and memoized.
 */
export function prepareHistory({ sets, workouts, exercises, excludeWorkoutId = null }) {
  const exMap = new Map(exercises.map((e) => [e.id, e]));
  const workoutById = new Map(workouts.map((w) => [w.id, w]));
  const sharesCache = new Map();
  const sharesOf = (exerciseId) => {
    let s = sharesCache.get(exerciseId);
    if (!s) sharesCache.set(exerciseId, (s = muscleShares(exMap.get(exerciseId))));
    return s;
  };

  // workoutId → exerciseId → sets (performed, sane numbers)
  const grouped = new Map();
  let setCount = 0;
  let checksum = 0;
  for (const s of performedSets(sets)) {
    if (s.workoutId === excludeWorkoutId) continue;
    if (!workoutById.has(s.workoutId) || !exMap.has(s.exerciseId)) continue;
    if (!(s.reps > 0) || s.reps > 50 || !((s.weight || 0) >= 0)) continue;
    let byEx = grouped.get(s.workoutId);
    if (!byEx) grouped.set(s.workoutId, (byEx = new Map()));
    let arr = byEx.get(s.exerciseId);
    if (!arr) byEx.set(s.exerciseId, (arr = []));
    arr.push(s);
    setCount += 1;
    checksum = (checksum * 31 + Math.round((s.weight || 0) * 4) * 101 + s.reps * 7
      + (s.effort ? s.effort.length : 0) + (s.completedAt ? 3 : 0)) % 2147483647;
  }

  const sessionsByExercise = new Map();
  const events = [];
  let restSamples = [];
  let lastTime = 0;

  for (const [workoutId, byEx] of grouped) {
    const workout = workoutById.get(workoutId);
    const start = workout.startedAt ?? 0;
    // Estimated time of each set: its check-off time when recorded, else
    // spread evenly across the workout's duration in logged order.
    const all = [...byEx.values()].flat().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const span = workout.endedAt > start ? workout.endedAt - start : all.length * 150 * 1000;
    const timeOf = new Map(all.map((s, i) => [
      s.id, s.completedAt || start + ((i + 0.5) / all.length) * span,
    ]));
    lastTime = Math.max(lastTime, start);

    for (const [exerciseId, exSets] of byEx) {
      exSets.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const typeless = exSets.every((s) => s.setType == null);
      const maxWeight = exSets.reduce((m, s) => Math.max(m, s.weight || 0), 0);
      const shares = sharesOf(exerciseId);
      const working = [];
      let prevCompletedAt = null;
      for (const s of exSets) {
        const isWorking = typeless
          ? (maxWeight === 0 || (s.weight || 0) >= 0.8 * maxWeight)
          : !isWarmup(s);
        // Rest before this set: from the previous set of the same exercise.
        const rest = s.completedAt && prevCompletedAt ? (s.completedAt - prevCompletedAt) / 1000 : null;
        prevCompletedAt = s.completedAt || null;
        if (!isWorking) continue;
        const t = timeOf.get(s.id);
        const effortLoad = EFFORT_LOAD[s.effort] ?? 1;
        events.push({ t, workoutId, exerciseId, shares, load: effortLoad });
        working.push({ set: s, t, rest });
        if (working.length > 1 && rest != null && rest >= 20 && rest <= 900) restSamples.push(rest);
      }
      if (working.length === 0) continue;
      // Weighted vs bodyweight sessions are modeled separately.
      const weighted = working.filter((e) => (e.set.weight || 0) > 0);
      const mode = weighted.length > 0 ? 'load' : 'bw';
      const entries = (mode === 'load' ? weighted : working).map((e, i) => {
        const load = mode === 'load' ? e.set.weight : 1;
        const rir = rirOf(e.set);
        return { ...e, k: i + 1, load, rir, cap: capacity(load, e.set.reps, rir) };
      });
      let list = sessionsByExercise.get(exerciseId);
      if (!list) sessionsByExercise.set(exerciseId, (list = []));
      list.push({ workoutId, exerciseId, mode, t: entries[0].t, entries, gapDays: null });
    }
  }

  for (const list of sessionsByExercise.values()) {
    list.sort((a, b) => a.t - b.t);
    for (let i = 1; i < list.length; i++) list[i].gapDays = (list[i].t - list[i - 1].t) / DAY_MS;
  }
  events.sort((a, b) => a.t - b.t);
  if (restSamples.length > 400) restSamples = restSamples.slice(-400);

  return {
    sharesOf, sessionsByExercise, events, restSamples,
    signature: `${MODEL_VERSION}:${setCount}:${lastTime}:${checksum}`,
  };
}

/** Index of the first event at or after time t (events sorted by t). */
function firstEventAtOrAfter(events, t) {
  let lo = 0;
  let hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid].t < t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Fatigue events for an exercise at time `t`, split into earlier sessions
 * (`days`) and earlier in the same workout (`today`): [hoursAgo, weight]
 * pairs, weight = overlap with the exercise's muscles × the set's effort load.
 * The exercise's own sets in the same workout are excluded (set position
 * covers those).
 */
function fatigueEventsAt(history, exerciseId, workoutId, t) {
  const target = history.sharesOf(exerciseId);
  const days = [];
  const today = [];
  const from = firstEventAtOrAfter(history.events, t - FATIGUE_WINDOW_MS);
  for (let i = from; i < history.events.length; i++) {
    const ev = history.events[i];
    if (ev.t >= t) break;
    const sameWorkout = ev.workoutId === workoutId;
    if (sameWorkout && ev.exerciseId === exerciseId) continue;
    const w = overlap(target, ev.shares) * ev.load;
    if (w <= 0) continue;
    (sameWorkout ? today : days).push([(t - ev.t) / HOUR_MS, w]);
  }
  return { days, today };
}

function sessionFatigue(history, session) {
  if (!session.fatigue) session.fatigue = fatigueEventsAt(history, session.exerciseId, session.workoutId, session.t);
  return session.fatigue;
}

/** Context multiplier a past session ran under (days off × recovery × earlier today). */
function sessionContext(history, session, params) {
  const f = sessionFatigue(history, session);
  return {
    gap: gapFactor(session.gapDays, params),
    days: fatigueFactor(f.days, params),
    today: fatigueFactor(f.today, params),
  };
}
const ctxProduct = (c) => c.gap * c.days * c.today;

/** Context-free capacity of one past working set. */
function normalizedEntry(entry, ctx, params) {
  const rest = entry.k > 1 ? restFactor(entry.rest, params) : 1;
  return entry.cap / (ctxProduct(ctx) * positionFactor(entry.k, params) * rest);
}

/** A session's context-free capacity: median over its working sets. */
function sessionValue(history, session, params) {
  const ctx = sessionContext(history, session, params);
  return median(session.entries.map((e) => normalizedEntry(e, ctx, params)));
}

/**
 * Recency-weighted level of past session values, projected to time `t`
 * along their trend. Points are chronological { t, value }.
 */
function baselineAt(points, t, params) {
  const n = points.length;
  const last = points[n - 1];
  const ws = points.map((_, i) => Math.pow(0.5, (n - 1 - i) / params.halfLife));
  const sw = ws.reduce((a, b) => a + b, 0);
  const xs = points.map((p) => p.t / DAY_MS);
  const ys = points.map((p) => Math.log(p.value));
  const mx = xs.reduce((a, x, i) => a + ws[i] * x, 0) / sw;
  const my = ys.reduce((a, y, i) => a + ws[i] * y, 0) / sw;
  let slope = 0;
  if (n >= 3) {
    let sxy = 0;
    let sxx = 0;
    for (let i = 0; i < n; i++) {
      sxy += ws[i] * (xs[i] - mx) * (ys[i] - my);
      sxx += ws[i] * (xs[i] - mx) ** 2;
    }
    if (sxx > 0) slope = clamp(sxy / sxx, -0.002, 0.0025) * (n / (n + 3));
  }
  const level = my + slope * (last.t / DAY_MS - mx);
  const horizon = clamp((t - last.t) / DAY_MS, 0, 14);
  return { value: Math.exp(level + slope * horizon), slope, n };
}

/** The sessions a baseline at time t draws on: the last few, recent ones preferred. */
function baselineSessions(sessions, t) {
  const prior = sessions.filter((s) => s.t < t);
  const recent = prior.filter((s) => s.t >= t - BASELINE_WINDOW_MS).slice(-BASELINE_SESSIONS);
  return recent.length > 0 ? recent : prior.slice(-3);
}

// ---------- Calibration ----------

function huber(e, delta = 0.04) {
  const a = Math.abs(e);
  return a <= delta ? 0.5 * e * e : delta * (a - 0.5 * delta);
}

/** Personal set-position profile: set k's capacity relative to set 1. */
function positionProfile(history, params) {
  const ratios = [[], [], [], [], [], []];
  for (const list of history.sessionsByExercise.values()) {
    for (const session of list) {
      const first = session.entries[0];
      for (const e of session.entries.slice(1, 6)) {
        ratios[e.k - 1].push(e.cap / (first.cap * restFactor(e.rest, params)));
      }
    }
  }
  return DEFAULT_PARAMS.position.map((def, i) => {
    if (i === 0) return 1;
    const n = ratios[i].length;
    if (n === 0) return def;
    return clamp((n * median(ratios[i]) + 8 * def) / (n + 8), 0.8, 1.03);
  });
}

/** Reps in reserve that goals aim for, from the user's own ratings. */
function targetRirFrom(history) {
  const rated = [];
  for (const list of history.sessionsByExercise.values()) {
    for (const s of list) for (const e of s.entries) if (e.set.effort) rated.push(e);
  }
  if (rated.length < 5) return DEFAULT_PARAMS.targetRir;
  const recent = rated.sort((a, b) => a.t - b.t).slice(-60).map((e) => e.rir);
  return clamp(median(recent), EFFORTS.hard.rir, EFFORTS.solid.rir);
}

/** Every past session with enough history before it to be predicted. */
function calibrationCases(history) {
  const cases = [];
  for (const list of history.sessionsByExercise.values()) {
    for (const mode of ['load', 'bw']) {
      const sessions = list.filter((s) => s.mode === mode);
      for (let i = 2; i < sessions.length; i++) cases.push({ sessions, i });
    }
  }
  cases.sort((a, b) => a.sessions[a.i].t - b.sessions[b.i].t);
  return cases.slice(-2500);
}

/** Predicted vs actual capacity of each case's first working set. */
function replay(history, cases, params) {
  const values = new Map();  // session → context-free value under params
  const valueOf = (s) => {
    let v = values.get(s);
    if (v === undefined) values.set(s, (v = sessionValue(history, s, params)));
    return v;
  };
  return cases.map(({ sessions, i }) => {
    const session = sessions[i];
    const prior = baselineSessions(sessions.slice(0, i), session.t);
    const base = baselineAt(prior.map((s) => ({ t: s.t, value: valueOf(s) })), session.t, params);
    const pred = base.value * ctxProduct(sessionContext(history, session, params));
    const first = session.entries[0];
    return { pred, actual: first.cap, load: first.load, naive: sessions[i - 1].entries[0].cap };
  });
}

function replayLoss(results) {
  let loss = 0;
  for (const r of results) loss += huber(Math.log(r.actual / r.pred));
  return loss / Math.max(1, results.length);
}

/** Share of results whose prediction landed within one rep. */
function withinOneRep(results, key) {
  if (results.length === 0) return null;
  const hits = results.filter((r) => (30 * Math.abs(r[key] - r.actual)) / r.load <= 1).length;
  return hits / results.length;
}

const TUNED = {
  fatigue: [0, 0.006, 0.012, 0.018, 0.026, 0.036],
  recoveryHours: [18, 30, 45, 66],
  detrain: [0.5, 1, 1.5],
  halfLife: [0.75, 1.5, 3, 5],
};

/**
 * Fit the model to the user's history. Returns { params, stats }: params is
 * DEFAULT_PARAMS adjusted toward what best predicted their past sessions
 * (shrunk toward the defaults when history is thin); stats says how well it
 * did against simply repeating last time.
 */
export function calibrate(history) {
  const params = { ...DEFAULT_PARAMS };
  if (history.restSamples.length >= 10) {
    params.typicalRestSec = clamp(median(history.restSamples), 45, 300);
  }
  params.targetRir = targetRirFrom(history);
  params.position = positionProfile(history, params);

  const cases = calibrationCases(history);
  let sessions = 0;
  for (const list of history.sessionsByExercise.values()) sessions += list.length;
  if (cases.length < 10) {
    return { params, stats: { sessions, cases: cases.length, model: null, naive: null, restSamples: history.restSamples.length } };
  }

  let best = { ...params };
  let bestLoss = replayLoss(replay(history, cases, best));
  for (let pass = 0; pass < 2; pass++) {
    for (const [key, grid] of Object.entries(TUNED)) {
      for (const v of grid) {
        if (v === best[key]) continue;
        const trial = { ...best, [key]: v };
        const loss = replayLoss(replay(history, cases, trial));
        if (loss < bestLoss - 1e-9) { best = trial; bestLoss = loss; }
      }
    }
  }

  // Trust the fit in proportion to how much history backs it.
  const trust = cases.length / (cases.length + 60);
  for (const key of Object.keys(TUNED)) {
    params[key] = DEFAULT_PARAMS[key] + (best[key] - DEFAULT_PARAMS[key]) * trust;
  }
  const results = replay(history, cases, params);
  return {
    params,
    stats: {
      sessions,
      cases: cases.length,
      model: withinOneRep(results, 'pred'),
      naive: withinOneRep(results, 'naive'),
      restSamples: history.restSamples.length,
    },
  };
}

const CALIBRATION_KEY = 'goal-calibration';
let calibrationMemo = null;

/**
 * Calibration for this history, from memory, the appMeta cache, or a fresh
 * fit (stored for next time). Recomputed only when the history changes.
 */
export async function loadCalibration(history) {
  if (calibrationMemo?.signature === history.signature) return calibrationMemo;
  try {
    const stored = await getMeta(CALIBRATION_KEY);
    if (stored?.signature === history.signature) return (calibrationMemo = stored);
  } catch { /* fall through to a fresh fit */ }
  calibrationMemo = { signature: history.signature, ...calibrate(history) };
  setMeta(CALIBRATION_KEY, calibrationMemo).catch(() => { /* recomputed next time */ });
  return calibrationMemo;
}

/**
 * Fit the calibration ahead of time — called after a workout is finished, so
 * the next one opens without waiting on it. With no workout active, the
 * history (and so its signature) is exactly what the next workout will see.
 */
export async function warmCalibration() {
  const [sets, workouts, exercises] = await Promise.all([getAll('sets'), getAll('workouts'), getAll('exercises')]);
  if (workouts.some((w) => !w.endedAt)) return;
  await loadCalibration(prepareHistory({ sets, workouts, exercises }));
}

// ---------- Goals for the active workout ----------

/** Smallest weight jump the user actually makes on this exercise. */
function weightStep(sessions) {
  const distinct = [...new Set(sessions.flatMap((s) => s.entries.map((e) => e.load)))]
    .sort((a, b) => a - b);
  const counts = new Map();
  for (let i = 1; i < distinct.length; i++) {
    const d = Math.round((distinct[i] - distinct[i - 1]) * 100) / 100;
    if (d > 0 && d <= 20) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const common = [...counts].filter(([, n]) => n >= 2).map(([d]) => d).sort((a, b) => a - b);
  return clamp(common[0] ?? 5, 2.5, 10);
}

/** The rep range this exercise is usually trained in. */
function repRange(sessions, fallbackReps) {
  const reps = sessions.slice(-8).flatMap((s) => s.entries.map((e) => e.set.reps));
  const typical = Math.round(median(reps) ?? fallbackReps ?? 8);
  return { typical, low: Math.max(1, typical - 3), high: typical + 1 };
}

/** Rep change a capacity factor amounts to around a goal (for explanations). */
function repsEffect(factor, reps, rir) {
  return (30 + reps + rir) * Math.log(factor);
}

/** Which recent workouts hit these muscles, for the recovery explanation. */
function lastMuscleHit(history, exerciseId, t) {
  const target = history.sharesOf(exerciseId);
  const byWorkout = new Map();
  const from = firstEventAtOrAfter(history.events, t - FATIGUE_WINDOW_MS);
  for (let i = from; i < history.events.length && history.events[i].t < t; i++) {
    const ev = history.events[i];
    const w = overlap(target, ev.shares);
    if (w <= 0) continue;
    const cur = byWorkout.get(ev.workoutId) ?? { t: ev.t, sets: 0 };
    cur.t = Math.max(cur.t, ev.t);
    cur.sets += w;
    byWorkout.set(ev.workoutId, cur);
  }
  let last = null;
  for (const [workoutId, v] of byWorkout) {
    if (v.sets >= 1 && (!last || v.t > last.t)) last = { workoutId, ...v };
  }
  return last;
}

/**
 * Goals for every set of the active workout. Returns Map setId → goal:
 *   { kind: 'model', weight, reps, k, reasons, last }   a working set
 *   { kind: 'warmup', weight, reps, target, pct, personal, last }
 *                                                        ramps to the next working set
 * Sets with nothing to go on (a brand-new exercise, nothing logged yet) and
 * completed sets are absent; completed sets feed the others as context.
 *
 * `prevFor(set)` returns the set PREV used to show for this slot (or null);
 * `now` is the moment goals are for. Sets flagged `autofill` are assumed to
 * take their goal, so the next set's weight follows it.
 */
export function goalsForWorkout({ history, params, workout, sets, prevFor, now }) {
  const p = params;
  const ordered = [...sets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const workoutStart = workout.startedAt ?? now;

  // This workout's finished working sets (not in history yet), with times.
  const todayDone = [];
  ordered.forEach((s, i) => {
    if (!s.completed || isWarmup(s) || !(s.reps > 0)) return;
    todayDone.push({ set: s, t: Math.min(now, s.completedAt || workoutStart + i * 150 * 1000) });
  });

  // Day readiness: each finished set against the goal it was given.
  const readiness = [];
  for (const { set } of todayDone) {
    if (!(set.goalReps > 0) || (set.weight > 0) !== (set.goalWeight > 0)) continue;
    const actual = capacity(set.weight > 0 ? set.weight : 1, set.reps, rirOf(set));
    const planned = capacity(set.goalWeight > 0 ? set.goalWeight : 1, set.goalReps, p.targetRir);
    readiness.push({ exerciseId: set.exerciseId, log: Math.log(actual / planned) });
  }

  const byExercise = new Map();
  for (const s of ordered) {
    if (!byExercise.has(s.exerciseId)) byExercise.set(s.exerciseId, []);
    byExercise.get(s.exerciseId).push(s);
  }

  const goals = new Map();
  for (const [exerciseId, exSets] of byExercise) {
    const sessionsAll = history.sessionsByExercise.get(exerciseId) ?? [];
    const observations = [];  // finished working sets today: { k, set, mode, cap, rest }
    let k = 0;
    let prevWeight = null;    // today's previous working set, as it will stand
    let prevReps = 0;
    let prevCompletedAt = null;

    for (const s of exSets) {
      const rest = s.completed && s.completedAt && prevCompletedAt ? (s.completedAt - prevCompletedAt) / 1000 : null;
      if (s.completed) prevCompletedAt = s.completedAt || null;

      if (isWarmup(s)) continue;  // planned below, off the working goals
      k += 1;

      if (s.completed) {
        if (s.reps > 0) {
          const mode = s.weight > 0 ? 'load' : 'bw';
          observations.push({ k, set: s, mode, cap: capacity(mode === 'load' ? s.weight : 1, s.reps, rirOf(s)), rest });
        }
        prevWeight = s.weight || 0;
        prevReps = s.reps || 0;
        continue;
      }

      const goal = goalForSet(exerciseId, sessionsAll, observations, s, k, prevWeight, prevReps);
      if (goal) goals.set(s.id, goal);
      const takesGoal = goal && s.autofill;
      prevWeight = takesGoal ? goal.weight : (s.weight || 0);
      prevReps = takesGoal ? goal.reps : (s.reps || 0);
    }

    // Warm-ups: each run of them ramps toward the working set right after it.
    let run = [];
    for (const s of exSets) {
      if (isWarmup(s)) { run.push(s); continue; }
      if (run.length > 0) planWarmups(run, s, sessionsAll);
      run = [];
    }
    for (const s of run) repeatLastWarmup(s);  // trailing: nothing to ramp to
  }
  return goals;

  /** A warm-up with nothing to ramp toward repeats last time's. */
  function repeatLastWarmup(s) {
    if (s.completed) return;
    const prev = prevFor(s);
    if (prev && prev.weight > 0 && prev.reps > 0) {
      goals.set(s.id, { kind: 'warmup', weight: prev.weight, reps: prev.reps, target: null });
    }
  }

  /**
   * Warm-up goals ramping to `working`.
   * Weights follow the user's own ramp from last time (each warm-up's share of
   * that day's first working weight) scaled to today's, else a standard ramp,
   * on the plate steps they use. Reps taper as the weight climbs, so warm-ups
   * prime the lift without spending what the working sets need.
   */
  function planWarmups(run, working, sessionsAll) {
    // What the working set will be: its numbers once logged or typed in by
    // hand, else its goal.
    const wGoal = goals.get(working.id);
    const own = (working.completed || !working.autofill) && working.weight > 0;
    const top = own ? working.weight : (wGoal?.weight ?? working.weight);
    const topReps = (own ? working.reps : wGoal?.reps) || working.reps || wGoal?.reps || 8;
    if (!(top > 0)) { run.forEach(repeatLastWarmup); return; }

    const loadSessions = sessionsAll.filter((x) => x.mode === 'load');
    const step = loadSessions.length > 0 ? weightStep(loadSessions) : 5;
    const ramp = defaultRamp(run.length);
    let floor = 0;  // keep the ramp climbing
    run.forEach((s, j) => {
      if (s.completed) { floor = Math.max(floor, s.weight || 0); return; }
      const prev = prevFor(s);
      const prevTop = prev && prev.weight > 0
        ? sessionsAll.find((x) => x.workoutId === prev.workoutId && x.mode === 'load')?.entries[0].load
        : null;
      const personal = prevTop > prev?.weight ? prev.weight / prevTop : null;
      const pct = clamp(personal ?? ramp[j], 0.1, 0.92);

      // On the grid of reachable weights below the working weight. A very
      // light opener (the empty bar, say) stays as it was.
      let weight = personal != null && personal < 0.3 ? prev.weight
        : top - Math.round((top * (1 - pct)) / step) * step;
      if (weight <= floor) weight = floor + step;
      weight = Math.min(weight, top - step);
      if (!(weight > 0)) weight = Math.min(top, step);
      weight = Math.round(weight * 100) / 100;

      let reps = Math.max(1, Math.round(topReps * interpolate(WARMUP_REPS, weight / top)));
      if (prev?.reps > 0 && personal != null) reps = Math.min(reps, Math.max(prev.reps, 1));
      floor = weight;
      goals.set(s.id, {
        kind: 'warmup', weight, reps,
        target: { weight: top, reps: topReps, k: workingIndex(working) },
        pct: weight / top,
        personal: personal != null,
        last: prev && prev.weight > 0 ? { weight: prev.weight, reps: prev.reps } : null,
      });
    });
  }

  function workingIndex(set) {
    return ordered.filter((x) => x.exerciseId === set.exerciseId && !isWarmup(x)).indexOf(set) + 1;
  }

  function goalForSet(exerciseId, sessionsAll, observations, set, k, prevWeight, prevReps) {
    // Anchor weight: today's previous working set, else this slot last time,
    // else the last weight used on this exercise. 0 = bodyweight.
    const prevSlot = prevFor(set);
    const lastAny = sessionsAll[sessionsAll.length - 1];
    let anchor = null;
    if (prevWeight > 0) anchor = prevWeight;
    else if (prevSlot && prevSlot.weight > 0) anchor = prevSlot.weight;
    else if (prevWeight === 0 && prevReps > 0) anchor = 0;
    else if (lastAny) anchor = lastAny.mode === 'load' ? lastEntryAt(lastAny, k).entry.load : 0;
    if (anchor == null) return null;

    const mode = anchor > 0 ? 'load' : 'bw';
    const loadOf = (w) => (mode === 'load' ? w : 1);
    const sessions = sessionsAll.filter((x) => x.mode === mode);
    const obs = observations.filter((o) => o.mode === mode);
    if (sessions.length === 0 && obs.length === 0) return null;

    // --- Prediction from history ---
    let predFresh = null;
    let f = null;  // the factors behind it, for the explanation
    if (sessions.length > 0) {
      const points = baselineSessions(sessions, now).map((s) => ({ t: s.t, value: sessionValue(history, s, p) }));
      const base = baselineAt(points, now, p);
      const gapDays = (now - lastAny.t) / DAY_MS;
      const fat = fatigueEventsAt(history, exerciseId, workout.id, now);
      const shares = history.sharesOf(exerciseId);
      for (const { set: done, t } of todayDone) {
        if (done.exerciseId === exerciseId) continue;
        const w = overlap(shares, history.sharesOf(done.exerciseId)) * (EFFORT_LOAD[done.effort] ?? 1);
        if (w > 0) fat.today.push([(now - t) / HOUR_MS, w]);
      }
      const ctxNow = {
        gap: gapFactor(gapDays, p),
        days: fatigueFactor(fat.days, p),
        today: fatigueFactor(fat.today, p),
      };

      // Progression: every goal hit last time (and none felt all-out) → reach
      // for about one rep more than last time.
      const last = sessions[sessions.length - 1];
      const lastValue = sessionValue(history, last, p);
      const oneRep = 1 / (30 + repRange(sessions).typical + p.targetRir);
      let push = 1;
      let hitDetail = null;
      if (gapDays <= 14 && !last.entries.some((e) => e.set.effort === 'hard')) {
        const graded = last.entries.filter((e) => e.set.goalReps > 0 && (mode === 'bw' || e.set.goalWeight > 0));
        if (graded.length > 0) {
          if (graded.every((e) => e.cap >= 0.995 * capacity(loadOf(e.set.goalWeight), e.set.goalReps, p.targetRir))) {
            hitDetail = 'You hit every goal last time';
          }
        } else if (sessions.length >= 2 && lastValue >= 0.995 * sessionValue(history, sessions[sessions.length - 2], p)) {
          hitDetail = 'Last time matched or beat the session before';
        }
        if (hitDetail) push = clamp((lastValue * (1 + oneRep)) / base.value, 1, 1 + oneRep);
      }

      // Readiness: how today's other lifts are going against their goals —
      // a partial carry-over, larger from lifts that share these muscles (a
      // tough set of pulldowns says more about rows than about squats), and
      // trusted more as more sets come in.
      const others = readiness.filter((r) => r.exerciseId !== exerciseId);
      let carried = 0;
      let sharedMuscles = false;
      for (const r of others) {
        const o = overlap(shares, history.sharesOf(r.exerciseId));
        if (o >= 0.5) sharedMuscles = true;
        carried += (0.3 + 0.5 * o) * r.log;
      }
      const mean = carried / Math.max(1, others.length);
      const ready = Math.exp(clamp(mean * (others.length / (others.length + 1)), -0.04, 0.03));

      predFresh = base.value * ctxProduct(ctxNow) * push * ready;

      // Explain relative to what PREV would have shown.
      const ref = findEntry(sessions, prevSlot) ?? lastEntryAt(last, k);
      const ctxRef = sessionContext(history, ref.session, p);
      f = {
        ref, base, gapDays, fat, push, ready, hitDetail, sharedMuscles,
        recent: base.value / normalizedEntry(ref.entry, ctxRef, p),
        gap: ctxNow.gap / ctxRef.gap,
        days: ctxNow.days / ctxRef.days,
        today: ctxNow.today / ctxRef.today,
        rest: ref.entry.k > 1 ? 1 / restFactor(ref.entry.rest, p) : 1,
        position: positionFactor(k, p) / positionFactor(ref.entry.k, p),
      };
    }

    // --- Blend in today's finished sets of this exercise ---
    let fresh = predFresh;
    if (obs.length > 0) {
      const W_PRED = 1;
      const W_OBS = 2;  // today's own sets say more than history does
      let sum = predFresh ? W_PRED * Math.log(predFresh) : 0;
      let weight = predFresh ? W_PRED : 0;
      for (const o of obs) {
        const rest = o.k > 1 ? restFactor(o.rest, p) : 1;
        sum += W_OBS * Math.log(o.cap / (positionFactor(o.k, p) * rest));
        weight += W_OBS;
      }
      fresh = Math.exp(sum / weight);
    }
    const target = fresh * positionFactor(k, p);

    // --- To lbs × reps: hold the anchor weight, step it when the reps would
    // leave the exercise's usual range (double progression) ---
    const rir = p.targetRir;
    const range = repRange(sessions, obs[obs.length - 1]?.set.reps);
    let weight = anchor;
    let reps = repsAt(target, loadOf(weight), rir);
    if (mode === 'load') {
      const step = weightStep(sessions.length > 0 ? sessions : [{ entries: obs.map((o) => ({ load: o.set.weight })) }]);
      // Past the range, add weight as long as that lands nearer the usual reps.
      const off = (r) => Math.abs(r - range.typical);
      for (let i = 0; i < 10 && reps > range.high + 0.5; i++) {
        const next = repsAt(target, weight + step, rir);
        if (off(next) > off(reps)) break;
        weight += step;
        reps = next;
      }
      for (let i = 0; i < 10 && reps < range.low - 0.5 && weight - step > 0; i++) {
        weight -= step;
        reps = repsAt(target, weight, rir);
      }
      weight = Math.round(weight * 100) / 100;
    }
    reps = Math.max(1, Math.round(reps));

    // --- Explanation: each effect as the reps it's worth at this goal ---
    const effect = (factor) => repsEffect(factor, reps, rir);
    const reasons = [];
    if (f) {
      const recent = effect(f.recent);
      const rising = f.base.n >= 3 && f.base.slope > 0.0005;
      const falling = f.base.n >= 3 && f.base.slope < -0.0005;
      const trend = recent >= 0.25 ? (rising ? `Trending up across your last ${f.base.n} sessions` : 'Last time was a bit below your recent average')
        : recent <= -0.25 ? (falling ? `Trending down across your last ${f.base.n} sessions` : 'Last time was a bit above your recent average')
        : `Last time was in line with your recent sessions${rising ? ', which are trending up' : falling ? ', which are trending down' : ''}`;
      reasons.push({ label: 'Recent sessions', detail: trend, reps: recent });

      const refGap = f.ref.session.gapDays;
      reasons.push({
        label: 'Days since you did this',
        detail: `${formatDays(f.gapDays)} (${Math.round(f.gapDays * 24)} h)`
          + (refGap != null ? ` · last time it was ${formatDays(refGap).toLowerCase()}` : ''),
        reps: effect(f.gap),
        always: true,
      });

      const hit = lastMuscleHit(history, exerciseId, now);
      const sets = hit ? Math.round(hit.sets) : 0;
      // "Still recovering" is absolute; the effect beside it is vs last time.
      const stillTired = effect(fatigueFactor(f.fat.days, p)) <= -0.3;
      const sameAsLast = Math.abs(effect(f.days)) < 0.25;
      reasons.push({
        label: 'Muscle recovery',
        detail: hit
          ? `Last worked ${Math.round((now - hit.t) / HOUR_MS)} h ago (${sets} set${sets === 1 ? '' : 's'})`
            + (!stillTired ? ' · recovered' : sameAsLast ? ' · about as recovered as last time' : ' · still recovering')
          : 'Fully recovered — not worked in the past week',
        reps: effect(f.days),
        always: true,
      });

      const todaySets = Math.round(f.fat.today.reduce((a, [, w]) => a + w, 0));
      const refSets = Math.round(sessionFatigue(history, f.ref.session).today.reduce((a, [, w]) => a + w, 0));
      if (todaySets > 0 || refSets > 0) {
        reasons.push({
          label: 'Earlier this workout',
          detail: `${todaySets} set${todaySets === 1 ? '' : 's'} already hit these muscles (last time: ${refSets})`,
          reps: effect(f.today),
          always: todaySets > 0,
        });
      }
      if (k !== f.ref.entry.k) {
        reasons.push({
          label: `Set ${k}`,
          detail: k > f.ref.entry.k ? `Your usual drop-off from set ${f.ref.entry.k}` : `Compared with set ${f.ref.entry.k} last time`,
          reps: effect(f.position),
        });
      }
      if (f.rest !== 1) {
        reasons.push({
          label: 'Rest last time',
          detail: `${formatRest(f.ref.entry.rest)} before that set (you usually take ${formatRest(p.typicalRestSec)})`,
          reps: effect(f.rest),
        });
      }
      const felt = EFFORTS[f.ref.entry.set.effort];
      if (felt) {
        reasons.push({
          label: 'How it felt last time',
          detail: `${felt.label} (${felt.hint}) · goals aim for ${rir <= 1 ? '0–1' : '1–2'} left`,
          reps: f.ref.entry.rir - rir,
        });
      }
      if (f.push > 1) {
        reasons.push({ label: 'Progression', detail: `${f.hitDetail} — reaching for one more rep`, reps: effect(f.push) });
      }
      if (f.ready !== 1) {
        reasons.push({
          label: 'Today so far',
          detail: (f.ready > 1 ? 'Beating your goals on other lifts today' : 'Coming in under your goals on other lifts today')
            + (f.sharedMuscles ? ', including ones that work these muscles' : ''),
          reps: effect(f.ready),
        });
      }
    }
    if (obs.length > 0) {
      const lastObs = obs[obs.length - 1];
      const felt = EFFORTS[lastObs.set.effort];
      const done = `Set ${lastObs.k}: ${formatSet(lastObs.set.weight, lastObs.set.reps)}${felt ? ` (${felt.label})` : ''}`;
      const label = obs.length > 1 ? 'Earlier sets today' : 'Earlier set today';
      if (predFresh) {
        const blend = fresh / predFresh;
        const how = blend > 1.005 ? 'stronger than expected' : blend < 0.995 ? 'tougher than expected' : 'right on plan';
        reasons.push({ label, detail: `${done} — ${how}`, reps: effect(blend) });
      } else {
        reasons.push({ label, detail: `${done} — no history yet, so goals follow today's sets`, reps: 0 });
      }
    }

    if (mode === 'load' && weight !== anchor) {
      reasons.push({
        label: 'Weight',
        detail: `${weight > anchor ? 'Up' : 'Down'} from ${formatNum(anchor)} to keep reps in your usual ${range.low}–${range.high}`,
        reps: null,
        lbs: weight - anchor,
        always: true,
      });
    }

    return {
      kind: 'model',
      weight: mode === 'load' ? weight : 0,
      reps,
      k,
      reasons,
      last: f ? { weight: f.ref.entry.set.weight || 0, reps: f.ref.entry.set.reps, t: f.ref.session.t } : null,
    };
  }
}

/** The history entry for a set PREV pointed at, with its session. */
function findEntry(sessions, set) {
  if (!set) return null;
  for (let i = sessions.length - 1; i >= 0; i--) {
    const entry = sessions[i].entries.find((e) => e.set.id === set.id);
    if (entry) return { entry, session: sessions[i] };
  }
  return null;
}

function lastEntryAt(session, k) {
  return { entry: session.entries[Math.min(k, session.entries.length) - 1], session };
}

// ---------- Formatting for explanations ----------

/** Whole 24-hour periods, counted from the rounded hours shown beside it. */
function formatDays(days) {
  const d = Math.floor(Math.round(days * 24) / 24);
  if (d < 1) return 'Under a day';
  return `${d} day${d === 1 ? '' : 's'}`;
}

export function formatRest(sec) {
  if (sec == null) return '—';
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const formatNum = (n) => String(Math.round(n * 10) / 10);

function formatSet(weight, reps) {
  return weight > 0 ? `${formatNum(weight)} × ${reps}` : `${reps} reps`;
}

/** Whether a finished set met the goal it was given (heavier-for-fewer counts). */
export function goalMet(set) {
  if (!(set.goalReps > 0)) return null;
  if (!(set.goalWeight > 0)) return set.reps >= set.goalReps;
  return capacity(set.weight || 0, set.reps || 0, 0) >= capacity(set.goalWeight, set.goalReps, 0) - 1e-9;
}
