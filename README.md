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

---

## File layout

```
lift-pwa/
├── index.html              — app shell (nav bar + tab bar + content slot)
├── manifest.webmanifest    — PWA install metadata
├── service-worker.js       — offline caching of all assets
├── styles.css              — iOS-style design system (auto dark mode)
├── icons/
│   └── icon.svg            — app icon (dumbbell on iOS blue)
└── src/
    ├── main.js             — bootstrap, tab routing, nav-bar coordination
    ├── state.js            — minimal shared state
    ├── db.js               — IndexedDB wrapper (exercises, workouts, sets)
    ├── seed.js             — ~70 starter exercises
    ├── backup.js           — JSON export/import via Files picker
    ├── utils.js            — uuid, formatters, sheet helper, event bus
    └── views/
        ├── workout.js      — Start screen + active workout
        ├── history.js      — Past workouts list + detail
        ├── exercises.js    — Library + per-exercise detail w/ chart
        └── progress.js     — Totals, charts, PRs
```

No build step. No `npm install`. Edit any file, refresh the browser.

> The service worker aggressively caches. After a code change, hard-refresh: ⌘⇧R in Chrome, or DevTools → Application → Service Workers → **Unregister** → reload. Once installed on iPhone, force-quit the app (swipe up from app switcher) to pick up a new version.

---

## Customization tips

**Rename.** In `manifest.webmanifest` change `"name"` and `"short_name"`. In `index.html` change `<title>` and the `apple-mobile-web-app-title` meta. In `service-worker.js` change `CACHE_VERSION` so the new manifest is picked up.

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
