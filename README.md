# Lift

Lift is a local-first strength-training app. The recommended free iPhone setup is the installable web app plus an optional Apple Shortcut for adding completed workout summaries to Apple Health. A separate native Xcode host remains available for direct HealthKit integration.

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

There are no accounts, servers, analytics, or third-party health services. The web app keeps exercises, sets, weights, repetitions, timestamps, effort, check-ins, mood, and respiratory logs in IndexedDB and includes them in its JSON backup.

## Free iPhone setup: Home Screen app + Shortcut

Serve Lift over HTTPS, open it in Safari on iPhone, then choose Share → Add to Home Screen. After finishing a workout, Lift saves it locally first and offers **Add to Apple Health**.

The first time, follow Lift’s one-time setup guide to create a shortcut named `Lift Add Workout`:

1. Get Dictionary from Shortcut Input.
2. Read `startDate` and convert it to a date.
3. Read `durationMinutes`.
4. Use Log Workout with Traditional Strength Training, that start date, and that duration.

Lift opens this shortcut with a small JSON payload containing the workout name, start time, duration, and Lift workout ID. The Shortcut writes the summary to Apple Health. No paid Apple Developer account, Xcode, Mac relay, or server is required.

Web apps cannot read Apple Health, so Lift cannot confirm or delete the resulting Health entry independently. Running the same export twice can create a duplicate. Check-ins, mood, inhaler use, symptoms, and workout effort stay in Lift in this free setup.

## Native iPhone build

Requirements:

- Xcode 16 or later
- iOS 17.0 deployment target
- An Apple development team and an App ID for `com.accounterprob.lift`
- A physical iPhone for complete HealthKit testing

Open `Lift.xcodeproj`, select the Lift target, choose your development team, confirm the HealthKit capability, and run. Swift is compiled in Swift 5 language mode. Workout effort and State of Mind synchronization are available on iOS 18 and later. On iOS 17, Lift keeps those two values locally while the remaining HealthKit integration continues to work.

The native target bundles the existing web app into `Web/` during its Copy Web App build phase. `WKWebView` hosts the interface and `NativeBridge` is the only boundary to HealthKit, notifications, settings, and Files export.

## Browser development

The PWA remains usable without HealthKit:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Workout logging and all local data remain usable. The Apple Health button opens Shortcuts on iPhone; it will not run on a desktop browser.

The service worker caches aggressively. Bump `CACHE_VERSION` in `service-worker.js` for shipped web changes, then reload twice or unregister the old worker during development.

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
├── index.html              — app shell (nav bar + tab bar + content slot)
├── manifest.webmanifest    — PWA install metadata
├── service-worker.js       — offline caching of all assets
├── styles.css              — iOS-style design system (auto dark mode)
├── tools/
│   ├── install-prune-agent.sh — one-command installer for the backup pruner
│   ├── prune-backups.sh    — Mac-side trim of the backup folder to the newest few
│   └── com.lift.prune-backups.plist — LaunchAgent template that runs it on folder changes
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

## Tests and checks

No package installation is required.

```bash
npm test
npm run check
swiftc -frontend -parse LiftNative/*.swift
plutil -lint Lift.xcodeproj/project.pbxproj LiftNative/Info.plist LiftNative/Lift.entitlements
```

The JavaScript tests use a deterministic fake HealthKit service. A full iOS compile, entitlement validation, signing check, and live HealthKit read/write test require Xcode and a physical iPhone.

## Native data ownership and synchronization

Every HealthKit-owned value first enters the durable `healthKitOutbox`. Successful writes create a lightweight `healthKitLinks` record and remove the measurement payload. Failed writes retain their payload for retry. Dependencies ensure a workout exists before its effort sample is related.

Stable identifiers use the real bundle namespace:

```text
com.accounterprob.lift.<entityKind>.<localEntityID>
```

HealthKit synchronization metadata and increasing versions make unchanged retries idempotent. Lift queries and deletes only objects created by Lift; it never edits or deletes another source’s workouts.

## Backup format

Backup schema version 2 remains backward-compatible with version 1. It adds Lift-owned wellbeing records, asthma event indexes, HealthKit links, pending/failed operations, migration state, and relevant settings. Restored links require reconciliation and restored writes require reviewed retry.

A complete archive consists of:

1. A Lift JSON backup containing detailed lifting and every value stored locally by the web app.
2. An Apple Health export if the Shortcut or native HealthKit integration has written additional Health records.

Values synchronized by the native app are not duplicated permanently in the Lift backup. Values recorded in the free web-app setup are included. Legacy non-null set RPE values are preserved; null-only RPE is omitted from new backup output.

## Key files

```text
Lift.xcodeproj/                 Native iPhone project
LiftNative/HealthKitService.swift
LiftNative/NativeBridge.swift
LiftNative/NotificationService.swift
src/health/domain.js            Validation, identifiers, and migration audit
src/health/service.js           Native protocol boundary and fake service
src/health/shortcut.js          Validated workout payload and Shortcuts URL
src/health/outbox-runner.js     Dependency-aware retry engine
src/health/sync.js              Links, outbox, reconciliation, and deletion
src/views/data.js               Check-in, asthma, settings, and migration UI
src/views/shortcut.js           One-time setup and workout export prompts
src/backup.js                   Schema-v2 export and backward-compatible restore
test/                           Deterministic JavaScript tests
```

See `docs/CURRENT_DATA_AUDIT.md` for the non-destructive audit of the supplied backup.
