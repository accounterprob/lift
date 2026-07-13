---
name: verify
description: Build/launch/drive recipe for verifying Lift (offline-first PWA, no build step) end-to-end in a headless browser.
---

# Verifying Lift

No build step, no deps. Serve the repo root and drive it with Playwright.

## Launch

```bash
python3 -m http.server 8814 --bind 127.0.0.1 &   # from the repo root
```

Playwright (install the npm package in a scratch dir; browsers are preinstalled
in Claude sandboxes — pass the executable explicitly, `npx playwright install`
will not work):

```js
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  hasTouch: true, isMobile: true,          // iPhone-ish
});
```

Each `newContext()` gets fresh IndexedDB + service worker state, so scenarios
don't bleed into each other. Use `page.emulateMedia({ colorScheme: 'dark' })`
to check dark mode without reseeding.

## Seeding data

The app seeds its ~70-exercise library on first load (wait for
`.workout-start`). Then write workouts/sets straight into IndexedDB from
`page.evaluate` and `page.reload()`:

- DB `lift` v1, stores `exercises` / `workouts` / `sets` (keyPath `id`).
- Workout: `{ id, name, startedAt, endedAt, notes }` — `endedAt: null` = active
  workout; names like `Chest Day` / `Leg Day` / `Back/Bi Day` drive the
  rotation (see `src/days.js` normalizeDayName).
- Set: `{ id, workoutId, exerciseId, weight, reps, setType: 'working', completed: true, order, createdAt }`.
- Look up `exerciseId`s from the seeded library by name — a startup migration
  strips equipment suffixes from names ("Bench Press (Barbell)" → "Bench
  Press" + equipment field), so match loosely.

`scratchpad/verify.js` from session work has a full working `seedData()` +
scenario script shape if you need a reference to rebuild one.

## Flows worth driving

- Workout tab start screen: `Today: <day>` hint, `<html data-day>` + `--accent`
  follow the rotation (last finished day / active workout name).
- Start flow: `#start-btn` → day picker sheet (waits ~450ms for slide-up
  animation before screenshots) → pick a day → theme flips immediately.
- Active workout: `#add-exercise-btn` → search + click rows → `#picker-add`;
  click `.complete-btn`s → `.vol-muscle` bars (assert `--mcolor`/`--mtext`).
- Progress tab: `[data-tab="progress"]` → `.chart-legend` items, `.chart-line`
  strokes, scrub via `page.mouse` drag over `.chart-container`, period via
  setting `.chart-range` value + dispatching `input`.

## Gotchas

- `confirm()` dialogs guard Finish/Discard — hook `page.on('dialog')`.
- The nav title is a live timer during an active workout.
- Text between muscle-bar labels and fills: `on-fill` class only applies past
  55% fill; below that the label uses theme text color.
