// The goals' scorecard over a whole backup: for every working set, the goal
// the app would have shown just before it vs what was lifted (same weight,
// reps within 1), next to repeating last time. The app shows the same score
// for the last 20 workouts on each goal sheet.
// Usage: TZ=America/Chicago node tools/goal-replay.mjs <backup.json> [workouts]
import { readFileSync } from 'node:fs';
import { prepareHistory, calibrate, replayGoals } from '../src/goals.js';

const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const { params } = calibrate(prepareHistory(data));
const r = replayGoals({ ...data, params, count: Number(process.argv[3]) || Infinity });
const pct = (v) => `${Math.round(v * 100)}%`;
console.log(`${r.workouts} workouts, ${r.sets} working sets: goals ${pct(r.goal)}, repeating last time ${pct(r.last)}`);
