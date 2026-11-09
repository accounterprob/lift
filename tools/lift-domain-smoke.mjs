import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  performedSets,
  buildPrevSlotMaps,
} from '../src/db.js';
import {
  normalizeDayName,
  nextInRotation,
  classifyWorkoutDays,
  textOnColor,
} from '../src/days.js';
import {
  primaryMuscleFor,
  displayName,
} from '../src/seed.js';
import {
  formatDuration,
  formatDurationShort,
  formatWeight,
  esc,
} from '../src/utils.js';

const mixedSets = [
  { id: 'done', workoutId: 'live', completed: true },
  { id: 'open', workoutId: 'live', completed: false },
  { id: 'old1', workoutId: 'imported' },
  { id: 'old2', workoutId: 'imported' },
];
assert.deepEqual(performedSets(mixedSets).map(({ id }) => id), ['done', 'old1', 'old2']);

const slotMaps = buildPrevSlotMaps([
  { id: 'latest-w1', workoutId: 'latest', exerciseId: 'bench', weight: 105, reps: 8, setType: 'working', order: 0 },
  { id: 'latest-w2', workoutId: 'latest', exerciseId: 'bench', weight: 100, reps: 8, setType: 'working', order: 1 },
  { id: 'older-w1', workoutId: 'older', exerciseId: 'bench', weight: 95, reps: 10, setType: 'working', order: 0 },
  { id: 'older-w2', workoutId: 'older', exerciseId: 'bench', weight: 90, reps: 10, setType: 'working', order: 1 },
  { id: 'older-w3', workoutId: 'older', exerciseId: 'bench', weight: 85, reps: 10, setType: 'working', order: 2 },
  { id: 'older-warmup', workoutId: 'older', exerciseId: 'bench', weight: 45, reps: 12, setType: 'warmup', order: 3 },
], [
  { id: 'latest', startedAt: 200 },
  { id: 'older', startedAt: 100 },
]);
assert.equal(slotMaps.get('bench').get('working#1').id, 'latest-w1');
assert.equal(slotMaps.get('bench').get('working#3').id, 'older-w3');
assert.equal(slotMaps.get('bench').get('warmup#1').id, 'older-warmup');

assert.equal(normalizeDayName('Push Day'), 'Chest Day');
assert.equal(normalizeDayName('Pull Day'), 'Back/Bi Day');
assert.equal(normalizeDayName('Leg Curl'), null);
assert.equal(nextInRotation('Back/Bi Day'), 'Chest Day');

const classified = classifyWorkoutDays([
  { id: 'custom-leg', name: 'Saturday Session', startedAt: 100 },
  { id: 'core', name: 'Core', startedAt: 86_400_200 },
], new Map([
  ['custom-leg', [{ exerciseId: 'squat', weight: 100, reps: 5 }]],
  ['core', [{ exerciseId: 'plank', weight: 1, reps: 1 }]],
]), new Map([
  ['squat', { name: 'Back Squat', category: 'Legs' }],
  ['plank', { name: 'Plank', category: 'Core' }],
]));
assert.equal(classified.get('custom-leg'), 'Leg Day');
assert.equal(classified.get('core'), 'Back/Bi Day');

assert.equal(primaryMuscleFor({ name: 'Romanian Deadlift', category: 'Back' }), 'Hamstrings');
assert.equal(primaryMuscleFor({ name: 'Face Pull', category: 'Back' }), 'Posterior Deltoid');
assert.equal(primaryMuscleFor({ name: 'Anything', muscle: 'Triceps' }), 'Triceps');
assert.equal(displayName({ name: 'Bench Press', equipment: 'Barbell' }), 'Bench Press (Barbell)');
assert.equal(textOnColor('#fde68a'), '#1c1c1e');
assert.equal(textOnColor('#1e40af'), '#ffffff');

assert.equal(formatDuration(3661), '1:01:01');
assert.equal(formatDurationShort(3661), '1h 1m');
assert.equal(formatWeight(22.5), '22.5');
assert.equal(esc('<script>"x"</script>'), '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');

const repo = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/\/$/, '');
const manifest = JSON.parse(readFileSync(`${repo}/manifest.webmanifest`, 'utf8'));
assert.equal(manifest.name, 'Lift');
assert.equal(manifest.display, 'standalone');
assert.ok(manifest.icons.length >= 1);
for (const icon of manifest.icons) assert.ok(existsSync(`${repo}/${icon.src.replace(/^\.\//, '')}`));

const serviceWorker = readFileSync(`${repo}/service-worker.js`, 'utf8');
const assetBlock = serviceWorker.match(/const ASSETS = \[([\s\S]*?)\];/)?.[1] ?? '';
const assets = [...assetBlock.matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
assert.ok(assets.length >= 5);
for (const asset of assets) {
  const path = asset === './' ? `${repo}/index.html` : `${repo}/${asset.replace(/^\.\//, '')}`;
  assert.ok(existsSync(path), `Missing service-worker asset: ${asset}`);
}

const index = readFileSync(`${repo}/index.html`, 'utf8');
assert.equal((index.match(/class="tab"/g) ?? []).length, 3);
assert.doesNotMatch(index, /data-tab="data"/);

console.log('Lift domain smoke tests passed.');
