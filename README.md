# Lift

A private, offline workout tracker for iPhone, built as a web app (PWA) and
hosted free on GitHub Pages: https://accounterprob.github.io/lift/. No
accounts, servers or subscriptions. Data lives in the phone's browser storage
(IndexedDB); backups are plain JSON files.

## What it does

- Log workouts: exercises, weight × reps per set, warm-ups, iso-lateral sides
  (1A/1B), a pause button that keeps paused time out of the duration.
- **Goals:** every open set shows a GOAL, prefilled into its inputs. Tap it to
  see why. Details below.
- Optional effort rating per set (Easy / Solid / Hard); rest between sets is
  read from check-off times.
- Add Exercise suggests what this rotation day usually still needs.
- History, per-exercise detail with an estimated-1RM chart, Progress tab with
  totals, strength trend per training day, top exercises and PRs.
- Accent color follows today's rotation day (Chest pink, Legs gold, Back/Bi
  blue).

## How goals work

**Weight** comes from a model of your history, in [`src/goals.js`](src/goals.js):
recent sessions of the exercise and their trend, adjusted for days since you
last did it, muscle recovery from the past week, sets that already hit those
muscles today, your usual drop from set to set, and how today's sets are going.
Weight steps up one notch when you hit every goal last time and nothing felt
Hard, never more than one step above last time. The model tunes itself to your
history on the device.

**Reps** are your own: today's previous set of that exercise, else that set
last time. Your reps barely change with the weight, so the model's rep count
missed far more often (replay of 1,091 past sets, 2026-11-09: reps within 1
went from 65% to 88%; weight and reps both right from 48% to 63%).

Type a different number and that set is yours; goals never overwrite it, and
the sets after it re-plan. The goal sheet shows an honest scorecard: replaying
your last 20 workouts, how often the goal matched what you lifted, next to just
repeating last time. `node tools/goal-replay.mjs <backup.json>` runs it over a
whole backup.

## Backups and sync

**Finish Workout** downloads a backup (`lift-backup-YYYYMMDD-HHMMSS.json`).
Safari's download folder on the iPhone points at this project's `backups/`
folder in iCloud, so each one reaches the Mac. Progress → share icon has
**Download Backup**, **Restore from Backup** (replaces everything; **Undo Last
Restore** puts the old data back) and opens older encrypted backups with their
password. Backups and `lift-hevy-import.json` are personal data: gitignored,
never committed.

## Working on it

```bash
npm install          # once
npm test             # unit tests (tests/)
npm run build        # src/ + styles.css → dist/, regenerates service-worker.js and version.json
node tools/lift-domain-smoke.mjs && node tools/lift-domain-stress.mjs
```

Edit `src/`, `styles.css`, `index.html` and `service-worker.template.js`;
never the generated `dist/`, `service-worker.js` or `version.json`. To ship:
build, commit the source together with the generated files, `git push origin
main`. The installed app checks for a new version on every launch and reloads
itself once it arrives; the build number shows under the tab bar.

## Files

```
index.html, manifest.webmanifest, icons/   app shell and install metadata
src/main.js        startup, tabs, app height on iOS
src/db.js          IndexedDB access, shared data rules, one-time cleanups
src/goals.js       goal model, calibration, replay scorecard, suggestions
src/backup.js      backup/restore (+ validate.js checks, crypto.js for old encrypted files)
src/seed.js        starter exercises, muscle mapping, iso-lateral detection
src/days.js        rotation days and their colors
src/views/         workout.js (active workout), exercises.js, progress.js
tests/             node --test unit tests
tools/             smoke/stress checks, backup audit, goal replay
```
