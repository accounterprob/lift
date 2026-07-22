# Lift — Workout Tracker PWA

A self-contained, offline-first workout tracker that runs as a Progressive Web App. No accounts, no servers, no subscriptions, no app store. Your data lives in your browser's IndexedDB on each device; sync is by exporting a JSON file to iCloud Drive and importing it on the other end.

**Features**
- Start an empty workout, add exercises, log weight × reps per set, finish.
- ~70 seeded common exercises + ability to add your own custom exercises.
- History tab with all past workouts.
- Per-exercise detail with recent sets and an estimated-1RM line chart.
- Progress tab with totals, a volume trend chart with one line per training day (Chest / Legs / Back/Bi), top exercises, and PRs.
- The app accent color follows today's rotation day (Chest pink, Legs gold, Back/Bi blue), and each muscle group's volume-bar color is a shade of its day's color.
- JSON Export/Import via the Files picker — point at iCloud Drive for cross-device sync.
- iOS-style design with dark mode auto-detect.
- Works fully offline once installed (service worker caches everything).

---

## Quick start — test it on your Mac (5 minutes)

You need any HTTP server. The simplest is Python (already installed on macOS as `python3`).

```bash
cd ~/Desktop/lift-pwa
python3 -m http.server 8080
```

Then open <http://localhost:8080> in any browser (Chrome, Safari, Edge, Firefox — all fine).

To stop the server, press `Ctrl+C` in the terminal.

> If you see `Address already in use`, pick a different port: `python3 -m http.server 8081`.

---

## Install on your iPhone

You can't `Add to Home Screen` from `localhost` on the iPhone — Safari on iPhone can't reach your Mac's localhost. You have two options:

### Option A — Same-WiFi LAN test (no GitHub needed)

This is good for a quick test before publishing.

1. Start the server on your Mac (see "Quick start" above).
2. Get your Mac's LAN IP: `ifconfig | grep "inet " | grep -v 127.0.0.1` (look for `192.168.x.x` or `10.x.x.x`).
3. On your iPhone (same WiFi), open Safari and go to `http://YOUR_MAC_IP:8080`.
4. Tap the **Share** button (square with up-arrow) → **Add to Home Screen** → **Add**.
5. Tap the Lift icon on your home screen — it launches full-screen, no Safari chrome.

Caveat: this only works while your Mac is running and on the same WiFi. The icon stays, the app data persists on the phone, but the *app itself* won't load if your Mac isn't reachable. For a permanent install, use Option B.

### Option B — Host on GitHub Pages (permanent, free)

1. Create a new public repo on github.com — call it `lift` (or anything).
2. In Terminal:
   ```bash
   cd ~/Desktop/lift-pwa
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/lift.git
   git push -u origin main
   ```
3. On github.com, open your `lift` repo → **Settings** → **Pages** → set **Source** to **Deploy from branch**, branch **main**, folder **/ (root)** → **Save**.
4. After ~1 minute the URL will appear at the top of that Pages settings page, e.g. `https://YOUR_USERNAME.github.io/lift/`.
5. On your iPhone Safari, open that URL.
6. Share button → **Add to Home Screen** → **Add**.

Updates: any time you `git push` to that repo, the live URL updates within ~1 minute. The PWA on your phone will pick up the new version on its next launch.

> **Why HTTPS matters:** service workers (the thing that makes the app installable and offline-capable) require HTTPS. GitHub Pages serves HTTPS for free. `http://` URLs only work for service workers if the host is `localhost`.

---

## How sync works

The app auto-exports a fresh JSON backup every time you tap **Finish Workout**. That file lands in your Safari Downloads location — set that to **iCloud Drive** (one-time setup) and from then on, every finished workout is automatically on your Mac within seconds.

**One-time Safari setup (iPhone):**
- Files app → tap the **…** in the iCloud Drive section header → **New Folder** → name it `Lift`.
- Settings → Apps → Safari → Downloads → tap **Other…** → **iCloud Drive** → **Lift** → Done.

After that, the flow on iPhone is:
1. Open Lift, log your workout.
2. Tap **Finish Workout** — confirms in iOS, downloads a JSON named like `lift-backup-2026-05-19.json` straight into `iCloud Drive/Lift`.
3. Workout's history shows up on your phone immediately; the JSON file is on your Mac within seconds via iCloud sync.

**Viewing on Mac:**
- Open Finder → iCloud Drive → Lift → there's a JSON file per finished workout day.
- Double-click to view in any text editor. The file is plain JSON, human-readable.
- *Or*, if you want it formatted: open the Lift PWA URL in Safari/Chrome on your Mac → Progress → Share icon → **Restore from Backup** → pick the latest JSON. The workouts render in the same UI as the phone (read-only viewing — don't log new workouts on Mac, since each Finish overwrites your local copy with downloaded backup again).

**Manual backup any time:** Progress tab → Share icon → **Download Backup**. Useful if you want a snapshot mid-workout or before testing the Restore flow.

**Restoring after a wipe:** Reinstall the PWA → open it → it'll have no data → Progress → Restore from Backup → pick the most recent JSON from `iCloud Drive/Lift`. Done.

### Keeping the backup folder tidy

Every backup is a **full snapshot** of the entire database, so older ones are pure redundancy — only the newest few matter. The app itself can't delete files (browsers don't allow it), but a tiny Mac-side job can trim the folder for you. `tools/prune-backups.sh` keeps the newest 3 backups (edit the `KEEP=` line for a different number) and touches nothing but `lift-backup-*.json` files; it finds the folder in `~/Desktop/Lift` or `iCloud Drive/Lift` automatically.

If an older cleanup job (e.g. an age-based one) is already installed, remove it first so two agents don't fight over the folder:

```bash
launchctl list | grep -i lift          # find any old agent's label
ls ~/Library/LaunchAgents | grep -i lift
launchctl unload ~/Library/LaunchAgents/<old-plist-name>.plist
rm ~/Library/LaunchAgents/<old-plist-name>.plist
```

Then install with one command in Terminal on the Mac — it fetches the prune script, writes the agent with your real home folder baked in, loads it, and trims the folder immediately:

```bash
curl -fsSL https://accounterprob.github.io/lift/tools/install-prune-agent.sh | bash
```

(From a clone of this repo, `bash tools/install-prune-agent.sh` does the same using the local files. The manual steps it automates: copy `tools/prune-backups.sh` to `~/Scripts/`, `chmod +x` it, write `tools/com.lift.prune-backups.plist` to `~/Library/LaunchAgents/` with `__HOME__` replaced by your home folder — launchd can't expand `~` in WatchPaths — and `launchctl load` it.)

The agent is event-driven: it fires the moment the Lift folder changes — i.e. right after a new backup syncs down from the phone — plus once at login to catch anything it slept through. There is no daily schedule. Run `bash ~/Scripts/prune-backups.sh` any time to trim immediately. To undo: `launchctl unload ~/Library/LaunchAgents/com.lift.prune-backups.plist` and delete the two files.

> Why can't the app do this itself? iOS gives web apps no access to the Files app / iCloud Drive — Lift can hand a backup *down* as a download, but can never list or delete what's in the folder. Any cleanup has to run on the Mac.

---

## File layout

```
lift-pwa/
├── index.html              — app shell; loads the built dist/ bundle
├── manifest.webmanifest    — PWA install metadata
├── build.mjs               — build script: bundles src/ → dist/, regenerates the SW
├── package.json            — dev tooling (esbuild); `npm run build`
├── service-worker.template.js — SOURCE for the service worker (edit this)
├── service-worker.js       — GENERATED by the build (cache list + version)
├── styles.css              — iOS-style design system (auto dark mode)
├── dist/                   — GENERATED, committed so Pages serves it
│   ├── app.js              — the whole app, bundled + minified
│   └── app.css             — styles.css, minified
├── tools/
│   ├── install-prune-agent.sh — one-command installer for the backup pruner
│   ├── prune-backups.sh    — Mac-side trim of the backup folder to the newest few
│   └── com.lift.prune-backups.plist — LaunchAgent template that runs it on folder changes
├── icons/
│   └── icon.svg            — app icon (neutral dumbbell, light/dark aware)
└── src/                    — EDITABLE source, bundled into dist/app.js
    ├── main.js             — bootstrap, tab routing, nav-bar coordination
    ├── state.js            — minimal shared state
    ├── db.js               — IndexedDB wrapper (exercises, workouts, sets)
    ├── seed.js             — ~70 starter exercises + muscle classification
    ├── days.js             — PPL rotation, day colors, muscle-day mapping, theming
    ├── migrations.js       — one-time data cleanups (run once per device)
    ├── backup.js           — JSON export/import via Files picker
    ├── charts.js           — the interactive time-series chart
    ├── utils.js            — uuid, formatters, sheet helper, event bus
    └── views/
        ├── workout.js      — Start screen + active workout
        ├── exercises.js    — Library + per-exercise detail w/ chart
        └── progress.js     — Totals, volume chart, history, PRs
```

**Build step.** Edit anything in `src/`, `styles.css`, `index.html`, or `service-worker.template.js`, then run the build to regenerate `dist/` and `service-worker.js`:

```bash
npm install     # one-time, installs esbuild
npm run build   # after every change to src/, styles.css, or the SW template
```

The build bundles + minifies all of `src/` into `dist/app.js`, minifies `styles.css` into `dist/app.css`, and rewrites `service-worker.js` with a fresh content-hash cache version and precache list (so adding a new `src/` file needs no manual service-worker edit). Commit the regenerated `dist/` and `service-worker.js` along with your source change — GitHub Pages serves them directly. `node_modules/` is not committed.

> The service worker aggressively caches. After rebuilding, hard-refresh: ⌘⇧R in Chrome, or DevTools → Application → Service Workers → **Unregister** → reload. Once installed on iPhone, force-quit the app (swipe up from app switcher) to pick up a new version.

---

## Customization tips

**Rename.** In `manifest.webmanifest` change `"name"` and `"short_name"`. In `index.html` change `<title>` and the `apple-mobile-web-app-title` meta, then `npm run build` (the cache version is regenerated automatically from content, so there's no `CACHE_VERSION` to bump by hand anymore).

**App icon.** Replace `icons/icon.svg` with your own SVG. To use a PNG instead, add it to `icons/`, then in `index.html` change `apple-touch-icon` to point at it (e.g. `<link rel="apple-touch-icon" href="./icons/icon-180.png">`). For best iOS results, supply a 180×180 PNG with **no transparency**.

**Accent color.** In `styles.css`, change `--accent: #007aff;` (used for tab highlight, buttons, charts). Also change `theme-color` in `index.html` and `theme_color` in the manifest.

**Switch to kilograms.** Search for `lbs` in `src/` and replace with `kg`. The stored values are just numbers — there's no unit conversion happening, so existing data will be interpreted in whatever unit you choose.

**Add more starter exercises.** In `src/seed.js`, add rows to the `SEEDS` array as `['Name', 'Category', 'Equipment']`. They'll be inserted on next launch (duplicates by name are skipped).

---

## Troubleshooting

**"Service worker registration failed."**
You're loading the page from a `file://` URL, or from an `http://` URL that isn't `localhost`. Service workers require `https://` (or `localhost`). Serve via `python3 -m http.server` for local testing, GitHub Pages for production.

**"My data disappeared."**
iOS Safari clears web data after ~7 days of inactivity *unless the site is installed to the home screen*. Once you've tapped **Add to Home Screen**, the storage is persistent. If you haven't installed it yet and the data vanished, that's why. Back up regularly.

**"Add to Home Screen doesn't show up."**
On iPhone you must use **Safari**, not Chrome/Firefox iOS — those are wrappers around WebKit but don't expose the install flow. On Mac, Safari supports it via **File → Add to Dock** when viewing a PWA.

**"Code changes aren't showing up."**
The service worker is caching. In Chrome DevTools → Application → Service Workers → Unregister, then reload. On iPhone, swipe up to kill the app, then relaunch. The cache key in `service-worker.js` (`CACHE_VERSION`) is what triggers a refresh — bump it (e.g. `lift-v2`) when shipping a major change.

**"IndexedDB errors / 'Storage unavailable'."**
You're in Safari Private Browsing mode, which restricts IndexedDB. Exit private mode and reload.

**"My local IP works on my laptop but not my phone."**
Both devices must be on the same WiFi network. Some networks (guest WiFi, hotel WiFi, college WiFi) block client-to-client communication — try your home WiFi or a phone hotspot.
