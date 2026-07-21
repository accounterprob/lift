import {
  get, getAll, getByIndex, getSetting, put, setSetting,
} from '../db.js';
import { downloadBackup } from '../backup.js';
import {
  ASTHMA_CONTEXTS,
  RESPIRATORY_SYMPTOMS,
  WELLBEING_CONTEXTS,
  auditLiftData,
  currentTimeZone,
  detectAccessibleWorkoutConflicts,
  localCalendarDayIdentifier,
  stableSyncIdentifier,
  valenceToMood,
} from '../health/domain.js';
import { healthKitService } from '../health/service.js';
import {
  enqueueWorkout,
  healthSyncSummary,
  healthWritesEnabled,
  processHealthKitOutbox,
  retryAllHealthKitWrites,
  saveAsthmaEvent,
  saveWellbeingCheckIn,
  setHealthWritesEnabled,
} from '../health/sync.js';
import { esc, emit, formatDateLong, formatDurationShort, formatTime, respiratoryIcon, showSheet, showToast } from '../utils.js';
import { openAppleHealthShortcutPrompt, openShortcutSetup, shortcutSettings } from './shortcut.js';

export function renderDataTab(ctx) {
  let mounted = true;
  renderDataOverview(ctx).catch((error) => {
    if (mounted) ctx.container.innerHTML = `<div class="empty-state"><h2>Couldn’t load Data</h2><p>${esc(error.message)}</p></div>`;
  });
  return () => { mounted = false; };
}

async function renderDataOverview(ctx) {
  ctx.setTitle('Data');
  ctx.setBack(null);
  ctx.setAction(null);
  if (!healthKitService.nativeAvailable) {
    await renderBrowserDataOverview(ctx);
    return;
  }
  const dayID = localCalendarDayIdentifier();
  const [today, healthStatus, sync, writesEnabled, reminder, recentHealth, migrationState] = await Promise.all([
    getByIndex('wellbeingEntries', 'localCalendarDayIdentifier', dayID).then((rows) => rows[0] ?? null),
    healthKitService.getStatus().catch(() => ({ available: false, authorization: {}, message: 'Apple Health is unavailable.' })),
    healthSyncSummary(),
    healthWritesEnabled(),
    getSetting('dailyReminder', { enabled: false, time: '09:00' }),
    healthKitService.queryRecentRespiratoryEvents().catch(() => []),
    get('migrationState', 'healthKitBackfill'),
  ]);
  const moodState = await stateOfMindDisplay(today);
  const moodSource = moodState.local ? ' · stored in Lift' : moodState.pending ? ' · pending Health sync' : ' · Apple Health';

  const authRows = Object.entries(healthStatus.authorization ?? {}).map(([kind, status]) => `
    <div class="stat-row"><div class="stat-label">${esc(healthLabel(kind))}</div><div class="stat-value health-auth-${esc(status)}">${esc(authorizationLabel(status))}</div></div>
  `).join('');
  const todayValues = today ? `
    <div class="stat-row"><div class="stat-label">Mood</div><div class="stat-value">${moodState.found ? `${moodState.mood}/5${moodSource}` : 'Not accessible in Apple Health'}</div></div>
    <div class="stat-row"><div class="stat-label">Energy</div><div class="stat-value">${today.energy}/5</div></div>
    <div class="stat-row"><div class="stat-label">Stress intensity</div><div class="stat-value">${today.stress}/5</div></div>
    <div class="stat-row"><div class="stat-label">Muscular soreness</div><div class="stat-value">${today.muscularSoreness}/3</div></div>
    <div class="stat-row"><div class="stat-label">Breathing limitation</div><div class="stat-value">${today.breathingLimitation}/3</div></div>
    <div class="section-footer">Recorded ${formatTime(today.timestamp)} · ${esc(contextLabel(today.context))}. ${moodState.local ? 'Mood is stored in Lift because State of Mind is unavailable on this iOS version.' : 'Synchronized mood is read from Apple Health; a pending value remains only in Lift’s outbox.'}</div>
  ` : '<div class="section-footer">No check-in has been completed for this local calendar day.</div>';

  ctx.container.innerHTML = `
    <div class="section">Today’s check-in</div>
    <div class="form-section">${todayValues}</div>
    <div class="action-section compact-actions">
      <button class="btn-primary" id="data-checkin">${today ? 'Edit Check-In' : 'Complete Check-In'}</button>
      <button class="btn-secondary lungs-action" id="data-asthma" aria-label="Log inhaler use or respiratory symptoms">${respiratoryIcon()}<span>Log Inhaler or Symptoms</span></button>
    </div>

    <div class="section">Most recent Apple Health information</div>
    <div class="form-section">
      ${recentHealthMarkup(recentHealth)}
    </div>
    <div class="section-footer">When no entry appears, Lift can only say that no accessible Health data was found. HealthKit does not reliably reveal read-permission denial.</div>

    <div class="section">Apple Health</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Available</div><div class="stat-value">${healthStatus.available ? 'Yes' : 'No'}</div></div>
      <label class="stat-row toggle-row"><span class="stat-label">Future Lift writes</span><input id="health-writes" type="checkbox" ${writesEnabled ? 'checked' : ''} /></label>
      <div class="stat-row"><div class="stat-label">Last successful sync</div><div class="stat-value">${sync.lastSuccessfulSyncAt ? formatDateLong(sync.lastSuccessfulSyncAt) : 'Never'}</div></div>
      <div class="stat-row"><div class="stat-label">Pending writes</div><div class="stat-value">${sync.pendingCount}</div></div>
      <div class="stat-row"><div class="stat-label">Failed writes</div><div class="stat-value">${sync.failedCount}</div></div>
      ${authRows || '<div class="stat-row"><div class="stat-label">Write authorization</div><div class="stat-value">Unavailable</div></div>'}
      <button class="list-row button" id="health-access"><div class="row-main"><div class="row-title accent">Request or Review Access</div></div></button>
      <button class="list-row button" id="health-retry"><div class="row-main"><div class="row-title accent">Retry All</div></div></button>
      <button class="list-row button" id="health-settings"><div class="row-main"><div class="row-title accent">Open App Settings</div></div></button>
    </div>
    <div class="section-footer">${esc(healthStatus.message ?? 'HealthKit read access may be partial even when writes are authorized.')}</div>

    <div class="section">Historical migration</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Status</div><div class="stat-value">${esc(migrationStatusLabel(migrationState))}</div></div>
      <button class="list-row button" id="health-migration"><div class="row-main"><div class="row-title accent">Review Existing Lift Data for Apple Health</div><div class="row-subtitle">Preview, resolve conflicts, and backfill safely</div></div><div class="chevron">›</div></button>
      ${migrationState ? '<button class="list-row button" id="health-migration-resume"><div class="row-main"><div class="row-title accent">Resume</div></div></button><button class="list-row button" id="health-migration-retry"><div class="row-main"><div class="row-title accent">Retry Failed</div></div></button><button class="list-row button" id="health-migration-conflicts"><div class="row-main"><div class="row-title accent">Review Conflicts</div></div></button><button class="list-row button" id="health-migration-report-view"><div class="row-main"><div class="row-title accent">View Report</div></div></button>' : ''}
      <button class="list-row button" id="health-cleanup-report"><div class="row-main"><div class="row-title accent">Download Data Quality Report</div><div class="row-subtitle">Checks for incomplete or unmatched records</div></div></button>
    </div>

    <div class="section">Daily reminder</div>
    <div class="form-section">
      <label class="stat-row toggle-row"><span class="stat-label">Reminder</span><input id="reminder-enabled" type="checkbox" ${reminder.enabled ? 'checked' : ''} /></label>
      <label class="stat-row"><span class="stat-label">Time</span><input id="reminder-time" type="time" value="${esc(reminder.time ?? '09:00')}" ${reminder.enabled ? '' : 'disabled'} /></label>
    </div>
    <div class="section-footer">Off by default. Notification permission is requested only when you enable it. Tapping the reminder opens the check-in.</div>

    <div class="section">Where data lives</div>
    <div class="form-section ownership-copy">
      <p><strong>Lift</strong> keeps exercises, sets, weights, repetitions, workout timestamps and notes, energy, stress, soreness, general breathing limitation, and asthma notes.</p>
      <p><strong>Apple Health</strong> owns synchronized workout summaries, effort, State of Mind mood, inhaler puffs, and exact respiratory symptoms.</p>
      <p>On iOS versions where workout effort or State of Mind synchronization is unavailable, those values stay in Lift and its backup.</p>
      <p>Recording Traditional Strength Training separately in Apple Workout for the same session can create a second workout. Lift does not merge other apps’ workouts.</p>
    </div>
  `;

  ctx.container.querySelector('#data-checkin').addEventListener('click', () => openWellbeingCheckIn({ existing: today, context: 'general', onSaved: () => emit('data:changed') }));
  ctx.container.querySelector('#data-asthma').addEventListener('click', () => openAsthmaQuickLog({ context: 'outsideWorkout', onSaved: () => emit('data:changed') }));
  ctx.container.querySelector('#health-access').addEventListener('click', () => showHealthAuthorizationExplanation(async () => {
    try { await healthKitService.requestAuthorization(); showToast('Apple Health access reviewed.'); emit('data:changed'); }
    catch (error) { showToast(error.message); }
  }));
  ctx.container.querySelector('#health-retry').addEventListener('click', async () => {
    const result = await retryAllHealthKitWrites().catch((error) => ({ failed: 1, error }));
    showToast(result.error ? result.error.message : `Synced ${result.succeeded} · failed ${result.failed}`);
    emit('data:changed');
  });
  ctx.container.querySelector('#health-settings').addEventListener('click', () => healthKitService.openSettings().catch((error) => showToast(error.message)));
  ctx.container.querySelector('#health-writes').addEventListener('change', async (event) => {
    await setHealthWritesEnabled(event.target.checked);
    showToast(event.target.checked ? 'Future Health writes enabled.' : 'Future Health writes disabled. Existing data was not deleted.');
  });
  ctx.container.querySelector('#health-migration').addEventListener('click', () => beginHistoricalMigration());
  ctx.container.querySelector('#health-migration-resume')?.addEventListener('click', () => beginHistoricalMigration());
  ctx.container.querySelector('#health-migration-retry')?.addEventListener('click', async () => {
    const result = await retryAllHealthKitWrites().catch((error) => ({ failed: 1, error }));
    showToast(result.error ? result.error.message : `Synced ${result.succeeded} · failed ${result.failed}`);
    emit('data:changed');
  });
  ctx.container.querySelector('#health-migration-conflicts')?.addEventListener('click', () => beginHistoricalMigration());
  ctx.container.querySelector('#health-migration-report-view')?.addEventListener('click', () => beginHistoricalMigration());
  ctx.container.querySelector('#health-cleanup-report').addEventListener('click', () => exportStructuralCleanupReport());

  const reminderEnabled = ctx.container.querySelector('#reminder-enabled');
  const reminderTime = ctx.container.querySelector('#reminder-time');
  const saveReminder = async () => {
    const configuration = { enabled: reminderEnabled.checked, time: reminderTime.value || '09:00' };
    reminderTime.disabled = !configuration.enabled;
    try {
      await healthKitService.configureReminder(configuration);
      await setSetting('dailyReminder', configuration);
      showToast(configuration.enabled ? `Reminder set for ${configuration.time}.` : 'Daily reminder off.');
    } catch (error) {
      reminderEnabled.checked = false;
      reminderTime.disabled = true;
      await setSetting('dailyReminder', { ...configuration, enabled: false });
      showToast(error.message);
    }
  };
  reminderEnabled.addEventListener('change', saveReminder);
  reminderTime.addEventListener('change', saveReminder);
}

async function renderBrowserDataOverview(ctx) {
  const dayID = localCalendarDayIdentifier();
  const [today, asthmaEvents, workouts, shortcut] = await Promise.all([
    getByIndex('wellbeingEntries', 'localCalendarDayIdentifier', dayID).then((rows) => rows[0] ?? null),
    getAll('asthmaEvents'),
    getAll('workouts'),
    shortcutSettings(),
  ]);
  const latestWorkout = workouts.filter((workout) => workout.endedAt).sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
  const recentEvents = asthmaEvents.sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  const moodState = await stateOfMindDisplay(today);
  const todayValues = today ? `
    <div class="stat-row"><div class="stat-label">Mood</div><div class="stat-value">${moodState.found ? `${moodState.mood}/5 · stored in Lift` : 'Not recorded'}</div></div>
    <div class="stat-row"><div class="stat-label">Energy</div><div class="stat-value">${today.energy}/5</div></div>
    <div class="stat-row"><div class="stat-label">Stress intensity</div><div class="stat-value">${today.stress}/5</div></div>
    <div class="stat-row"><div class="stat-label">Muscular soreness</div><div class="stat-value">${today.muscularSoreness}/3</div></div>
    <div class="stat-row"><div class="stat-label">Breathing limitation</div><div class="stat-value">${today.breathingLimitation}/3</div></div>
    <div class="section-footer">Recorded ${formatTime(today.timestamp)} · ${esc(contextLabel(today.context))}. These values stay in Lift and are included in its backup.</div>
  ` : '<div class="section-footer">No check-in has been completed for this local calendar day.</div>';
  const latestStatus = latestWorkout ? shortcutStatusLabel(latestWorkout.appleHealthShortcutStatus) : 'No completed workout';
  const latestNeedsRepeat = latestWorkout && ['exported', 'launching', 'changedAfterExport'].includes(latestWorkout.appleHealthShortcutStatus);

  ctx.container.innerHTML = `
    <div class="section">Today’s check-in</div>
    <div class="form-section">${todayValues}</div>
    <div class="action-section compact-actions">
      <button class="btn-primary" id="data-checkin">${today ? 'Edit Check-In' : 'Complete Check-In'}</button>
      <button class="btn-secondary lungs-action" id="data-asthma" aria-label="Log inhaler use or respiratory symptoms">${respiratoryIcon()}<span>Log Inhaler or Symptoms</span></button>
    </div>

    <div class="section">Recent inhaler & symptoms</div>
    <div class="form-section">${recentLocalAsthmaMarkup(recentEvents)}</div>
    <div class="section-footer">Stored privately in Lift on this device. Lift does not provide dosing or treatment advice.</div>

    <div class="section">Apple Health via Shortcut</div>
    <div class="form-section">
      <div class="stat-row"><div class="stat-label">Shortcut</div><div class="stat-value">${shortcut.ready ? `Ready · ${esc(shortcut.name)}` : 'Setup needed'}</div></div>
      <div class="stat-row"><div class="stat-label">Latest workout</div><div class="stat-value">${esc(latestStatus)}</div></div>
      <button class="list-row button" id="shortcut-setup"><div class="row-main"><div class="row-title accent">${shortcut.ready ? 'Review Shortcut Setup' : 'Set Up Apple Health Shortcut'}</div><div class="row-subtitle">One-time setup · no paid developer account</div></div><div class="chevron">›</div></button>
      ${latestWorkout ? `<button class="list-row button" id="shortcut-latest"><div class="row-main"><div class="row-title accent">${latestNeedsRepeat ? 'Open Shortcut for Latest Workout Again' : 'Add Latest Workout to Apple Health'}</div><div class="row-subtitle">Opens Shortcuts with the saved workout summary</div></div><div class="chevron">›</div></button>` : ''}
    </div>
    <div class="section-footer">The Home Screen web app cannot read Apple Health. It sends only the selected workout name, start time, and duration to your Shortcut. Running it twice can create a duplicate.</div>

    <div class="section">Daily reminder</div>
    <div class="form-section"><div class="stat-row"><div class="stat-label">Web app reminder</div><div class="stat-value">Not available reliably</div></div></div>
    <div class="section-footer">If you want one, create a personal automation in Shortcuts that opens Lift at your preferred time.</div>

    <div class="section">Data quality</div>
    <div class="form-section">
      <button class="list-row button" id="health-cleanup-report"><div class="row-main"><div class="row-title accent">Download Data Quality Report</div><div class="row-subtitle">Checks Lift data without changing it</div></div></button>
    </div>

    <div class="section">Where data lives</div>
    <div class="form-section ownership-copy">
      <p><strong>Lift</strong> keeps workouts, exercises, sets, effort, check-ins, mood, and inhaler or symptom logs locally and includes them in the Lift JSON backup.</p>
      <p><strong>Apple Health</strong> receives only a completed workout summary when you choose Add to Apple Health and run your Shortcut.</p>
      <p>Lift cannot read, edit, or delete Health entries from a web app, and does not send your data to a server.</p>
    </div>
  `;

  ctx.container.querySelector('#data-checkin').addEventListener('click', () => openWellbeingCheckIn({ existing: today, context: 'general', onSaved: () => emit('data:changed') }));
  ctx.container.querySelector('#data-asthma').addEventListener('click', () => openAsthmaQuickLog({ context: 'outsideWorkout', onSaved: () => emit('data:changed') }));
  ctx.container.querySelector('#shortcut-setup').addEventListener('click', () => openShortcutSetup({ onReady: () => emit('data:changed') }));
  ctx.container.querySelector('#shortcut-latest')?.addEventListener('click', () => openAppleHealthShortcutPrompt(latestWorkout, { repeat: latestNeedsRepeat }));
  ctx.container.querySelector('#health-cleanup-report').addEventListener('click', () => exportStructuralCleanupReport());
}

function recentLocalAsthmaMarkup(rows) {
  if (!rows.length) return '<div class="stat-row"><div class="stat-label">Result</div><div class="stat-value">Nothing logged yet.</div></div>';
  const labels = Object.fromEntries(RESPIRATORY_SYMPTOMS.map(({ kind, label }) => [kind, label]));
  return rows.map((row) => {
    const details = [];
    if (Number(row.localPuffs) > 0) details.push(`${row.localPuffs} puff${Number(row.localPuffs) === 1 ? '' : 's'}`);
    for (const [kind, severity] of Object.entries(row.localSymptoms ?? {})) details.push(`${labels[kind] ?? kind}: ${severity}`);
    return `<div class="health-event-row"><div class="health-event-summary">${esc(details.join(' · ') || 'Event saved')}</div><div class="health-event-meta">${formatDateLong(row.timestamp)} · ${formatTime(row.timestamp)}</div></div>`;
  }).join('');
}

function shortcutStatusLabel(status) {
  return ({
    exported: 'Added to Apple Health',
    launching: 'Opened in Shortcuts',
    changedAfterExport: 'Edited since Health export',
    failed: 'Shortcut needs retry',
    notExported: 'Not added yet',
  })[status] ?? 'Not added yet';
}

function migrationStatusLabel(state) {
  if (!state) return 'Not started';
  return ({ running: 'In progress', canceled: 'Canceled · resumable', partiallyCompleted: 'Needs retry or review', completed: 'Completed' })[state.status] ?? state.status;
}

async function stateOfMindDisplay(entry) {
  if (!entry) return { found: false, mood: null, pending: false };
  if (Number.isInteger(Number(entry.localMood))) return { found: true, mood: Number(entry.localMood), pending: false, local: true };
  const pending = (await getByIndex('healthKitOutbox', 'localEntityID', entry.id))
    .find((operation) => operation.entityKind === 'stateOfMind');
  if (pending?.payload && Number.isFinite(Number(pending.payload.valence))) {
    return { found: true, mood: valenceToMood(pending.payload.valence), pending: true };
  }
  if (!entry.stateOfMindHealthKitLinkID) return { found: false, mood: null, pending: false };
  try {
    const result = await healthKitService.queryStateOfMind(stableSyncIdentifier('stateOfMind', entry.id));
    return result?.found
      ? { found: true, mood: valenceToMood(result.valence), pending: false }
      : { found: false, mood: null, pending: false };
  } catch {
    return { found: false, mood: null, pending: false };
  }
}

function recentHealthMarkup(rows) {
  if (!rows?.length) return '<div class="stat-row"><div class="stat-label">Result</div><div class="stat-value">No accessible Health data was found.</div></div>';
  return rows.slice(0, 4).map((row) => `
    <div class="stat-row"><div class="stat-label">${esc(healthLabel(row.entityKind))}</div><div class="stat-value">${esc(row.displayValue)} · ${formatDateLong(row.timestamp)}</div></div>
  `).join('');
}

function healthLabel(kind) {
  return ({
    workout: 'Workouts', workoutEffort: 'Workout effort', stateOfMind: 'State of Mind', inhalerUsage: 'Inhaler usage',
    wheezing: 'Wheezing', shortnessOfBreath: 'Shortness of breath', coughing: 'Coughing', chestTightnessOrPain: 'Chest tightness or pain',
  })[kind] ?? kind;
}

function authorizationLabel(status) {
  return ({ sharingAuthorized: 'Allowed', sharingDenied: 'Not allowed', notDetermined: 'Not requested', unavailable: 'Unavailable' })[status] ?? 'Unknown';
}

function contextLabel(context) {
  return ({ general: 'general', preWorkout: 'before a workout', postWorkout: 'after a workout' })[context] ?? context;
}

export function showHealthAuthorizationExplanation(onContinue) {
  const dismiss = showSheet({
    html: `
      <div class="sheet-header"><button class="btn-text" id="health-explain-cancel">Not Now</button><div class="title">Connect Apple Health</div><button class="btn-text primary" id="health-explain-continue">Continue</button></div>
      <div class="sheet-content health-explanation">
        <p>Lift would like to save completed strength-workout summaries, workout effort, momentary mood, inhaler puffs, and exact respiratory symptoms.</p>
        <p>Reading the same types helps prevent duplicates, restore links, and show recent entries. Lift requests no unrelated Health data and sends none to a server.</p>
        <p>You can allow some types and decline others. Lift remains fully usable either way.</p>
      </div>`,
    onMount(sheet) {
      sheet.querySelector('#health-explain-cancel').addEventListener('click', () => dismiss());
      sheet.querySelector('#health-explain-continue').addEventListener('click', () => { dismiss(); onContinue?.(); });
    },
  });
}

export async function openWellbeingCheckIn({ existing = null, context = 'general', relatedWorkoutID = null, onSaved = null, onDismiss = null } = {}) {
  const dayID = existing?.localCalendarDayIdentifier ?? localCalendarDayIdentifier();
  if (!existing) existing = (await getByIndex('wellbeingEntries', 'localCalendarDayIdentifier', dayID))[0] ?? null;
  context = existing?.context ?? context;
  relatedWorkoutID = existing?.relatedWorkoutID ?? relatedWorkoutID;
  const moodState = await stateOfMindDisplay(existing);
  const requiresDeliberateMoodReplacement = Boolean(existing && !moodState.found);
  const initial = { mood: moodState.mood ?? 3, energy: existing?.energy ?? 3, stress: existing?.stress ?? 3, muscularSoreness: existing?.muscularSoreness ?? 1, breathingLimitation: existing?.breathingLimitation ?? 0 };
  const dismiss = showSheet({
    html: `
      <div class="sheet-header"><button class="btn-text" id="checkin-cancel">Not Now</button><div class="title">Right Now</div><button class="btn-text primary" id="checkin-save">Save</button></div>
      <div class="sheet-content checkin-sheet">
        <p class="sheet-intro">A quick snapshot of how you feel right now—not a medical assessment or a measure of your whole day.</p>
        ${rangeControl('mood', 'How do you feel right now?', 1, 5, initial.mood, 'Very low', 'Very good')}
        ${requiresDeliberateMoodReplacement ? '<div class="notice-card">The prior mood entry is not accessible in Apple Health. Lift will leave it unchanged unless you deliberately replace it.</div><label class="stat-row toggle-row"><span class="stat-label">Replace mood in Apple Health</span><input id="checkin-replace-mood" type="checkbox" /></label>' : ''}
        ${rangeControl('energy', 'Energy', 1, 5, initial.energy, 'Very low', 'Very high')}
        ${rangeControl('stress', 'Stress intensity', 1, 5, initial.stress, 'None', 'Very high')}
        ${rangeControl('muscularSoreness', 'Muscular soreness', 0, 3, initial.muscularSoreness, 'None', 'Severe')}
        ${rangeControl('breathingLimitation', 'General breathing limitation', 0, 3, initial.breathingLimitation, 'None', 'Severe')}
        <div class="section">Context</div>
        <div class="form-section"><select id="checkin-context" aria-label="Check-in context">${WELLBEING_CONTEXTS.map((value) => `<option value="${value}" ${value === context ? 'selected' : ''}>${esc(contextLabel(value))}</option>`).join('')}</select></div>
        <button class="btn-secondary" id="checkin-symptoms" hidden>Add Specific Symptoms</button>
      </div>`,
    onMount(sheet) {
      const replaceMood = sheet.querySelector('#checkin-replace-mood');
      const moodInput = sheet.querySelector('#mood');
      if (replaceMood) {
        moodInput.disabled = true;
        replaceMood.addEventListener('change', () => { moodInput.disabled = !replaceMood.checked; });
      }
      for (const input of sheet.querySelectorAll('input[type="range"]')) {
        const output = sheet.querySelector(`[data-output="${input.id}"]`);
        const update = () => { output.textContent = input.value; if (input.id === 'breathingLimitation') sheet.querySelector('#checkin-symptoms').hidden = Number(input.value) === 0; };
        input.addEventListener('input', update); update();
      }
      sheet.querySelector('#checkin-cancel').addEventListener('click', () => { dismiss(); onDismiss?.(); });
      sheet.querySelector('#checkin-symptoms').addEventListener('click', () => openAsthmaQuickLog({ context: relatedWorkoutID ? 'beforeWorkout' : 'outsideWorkout', relatedWorkoutID }));
      sheet.querySelector('#checkin-save').addEventListener('click', async () => {
        try {
          const values = Object.fromEntries(['mood', 'energy', 'stress', 'muscularSoreness', 'breathingLimitation'].map((id) => [id, Number(sheet.querySelector(`#${id}`).value)]));
          await saveWellbeingCheckIn({
            existing,
            saveMood: !requiresDeliberateMoodReplacement || Boolean(replaceMood?.checked),
            ...values,
            timestamp: existing?.timestamp ?? Date.now(),
            localCalendarDayIdentifier: dayID,
            timeZone: existing?.timeZone ?? currentTimeZone(),
            context: sheet.querySelector('#checkin-context').value,
            relatedWorkoutID,
          });
          dismiss(); onSaved?.(); showToast('Check-in saved.');
          if (healthKitService.nativeAvailable) processHealthKitOutbox().then(() => emit('data:changed')).catch(() => {});
        } catch (error) { showToast(error.message); }
      });
    },
  });
}

function rangeControl(id, label, min, max, value, low, high) {
  return `<div class="checkin-control"><div class="range-heading"><label for="${id}">${esc(label)}</label><output data-output="${id}">${value}</output></div><input id="${id}" type="range" min="${min}" max="${max}" step="1" value="${value}" aria-label="${esc(label)}"/><div class="range-endpoints"><span>${esc(low)}</span><span>${esc(high)}</span></div></div>`;
}

export function openAsthmaQuickLog({ context = 'outsideWorkout', relatedWorkoutID = null, onSaved = null } = {}) {
  const lastPuffs = Number(localStorage.getItem('lift.lastInhalerPuffs') ?? 2);
  const dismiss = showSheet({
    html: `
      <div class="sheet-header"><button class="btn-text" id="asthma-cancel">Cancel</button><div class="title">Inhaler & Symptoms</div><button class="btn-text primary" id="asthma-save">Save</button></div>
      <div class="sheet-content asthma-sheet">
        <p class="sheet-intro">Log what happened. Lift does not provide dosing or treatment advice.</p>
        <div class="section">Inhaler puffs</div>
        <div class="segmented puff-selector" role="radiogroup" aria-label="Inhaler puffs">
          <button type="button" data-puffs="1" aria-pressed="false">1 puff</button><button type="button" data-puffs="2" aria-pressed="false">2 puffs</button><button type="button" data-puffs="other" aria-pressed="false">Other</button>
        </div>
        <label class="form-row other-puffs" hidden><span>Number of puffs</span><input id="asthma-puffs-other" type="number" min="1" max="99" inputmode="numeric" /></label>
        <div class="section">Optional symptoms</div>
        <div class="form-section symptom-list">${RESPIRATORY_SYMPTOMS.map(({ kind, label }) => `
          <div class="symptom-row"><label><input type="checkbox" data-symptom="${kind}"/> <span>${esc(label)}</span></label><select data-severity="${kind}" aria-label="${esc(label)} severity" disabled><option value="unspecified">Unspecified</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></div>`).join('')}</div>
        <div class="section">Details</div>
        <div class="form-section"><label class="form-row"><span>Timestamp</span><input id="asthma-time" type="datetime-local" value="${localDateTimeValue(new Date())}" /></label><label class="form-row"><span>Context</span><select id="asthma-context">${ASTHMA_CONTEXTS.map((value) => `<option value="${value}" ${value === context ? 'selected' : ''}>${esc(astmaContextLabel(value))}</option>`).join('')}</select></label><label class="form-row"><span>Optional note</span><textarea id="asthma-note" rows="2" maxlength="500"></textarea></label></div>
      </div>`,
    onMount(sheet) {
      let puffs = 0;
      for (const button of sheet.querySelectorAll('[data-puffs]')) button.addEventListener('click', () => {
        const value = button.dataset.puffs;
        puffs = value === 'other' ? 'other' : Number(value);
        for (const peer of sheet.querySelectorAll('[data-puffs]')) peer.setAttribute('aria-pressed', String(peer === button));
        sheet.querySelector('.other-puffs').hidden = value !== 'other';
        if (value === 'other') sheet.querySelector('#asthma-puffs-other').value = lastPuffs || '';
      });
      for (const checkbox of sheet.querySelectorAll('[data-symptom]')) checkbox.addEventListener('change', () => { sheet.querySelector(`[data-severity="${checkbox.dataset.symptom}"]`).disabled = !checkbox.checked; });
      sheet.querySelector('#asthma-cancel').addEventListener('click', () => dismiss());
      sheet.querySelector('#asthma-save').addEventListener('click', async () => {
        try {
          const amount = puffs === 'other' ? Number(sheet.querySelector('#asthma-puffs-other').value || 0) : Number(puffs);
          const symptoms = {};
          for (const checkbox of sheet.querySelectorAll('[data-symptom]:checked')) symptoms[checkbox.dataset.symptom] = sheet.querySelector(`[data-severity="${checkbox.dataset.symptom}"]`).value;
          await saveAsthmaEvent({
            puffs: amount,
            symptoms,
            note: sheet.querySelector('#asthma-note').value,
            timestamp: new Date(sheet.querySelector('#asthma-time').value).getTime(),
            context: sheet.querySelector('#asthma-context').value,
            relatedWorkoutID,
          });
          if (amount > 0) localStorage.setItem('lift.lastInhalerPuffs', String(amount));
          dismiss(); onSaved?.(); showToast('Asthma event saved.');
          if (healthKitService.nativeAvailable) processHealthKitOutbox().then(() => emit('data:changed')).catch(() => {});
        } catch (error) { showToast(error.message); }
      });
    },
  });
}

function astmaContextLabel(value) {
  return ({ beforeWorkout: 'Before workout', duringWorkout: 'During workout', afterWorkout: 'After workout', outsideWorkout: 'Outside workout' })[value];
}

function localDateTimeValue(date) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

async function openHistoricalMigration() {
  const [exercises, workouts, sets, healthKitLinks, healthKitOutbox, migrationState] = await Promise.all([
    getAll('exercises'), getAll('workouts'), getAll('sets'), getAll('healthKitLinks'), getAll('healthKitOutbox'), getAll('migrationState'),
  ]);
  const audit = auditLiftData({ exercises, workouts, sets, healthKitLinks, healthKitOutbox, migrationState });
  let rows = audit.rows;
  let healthMessage = 'Apple Health is unavailable; preview is based on Lift data only.';
  try {
    const status = await healthKitService.getStatus();
    const validRows = rows.filter((row) => Number.isFinite(row.start) && Number.isFinite(row.end) && row.end > row.start);
    if (status.available && validRows.length) {
      const accessible = await healthKitService.queryWorkouts({ start: Math.min(...validRows.map((row) => row.start)), end: Math.max(...validRows.map((row) => row.end)) });
      rows = detectAccessibleWorkoutConflicts(audit, accessible);
      healthMessage = accessible.length ? `${accessible.length} accessible Health workout(s) were checked.` : 'No accessible overlapping workouts were found. HealthKit may hide data Lift cannot read.';
    }
  } catch (error) {
    healthMessage = `No accessible Health data was found. ${error.message}`;
  }
  showMigrationPreview(audit, rows, healthMessage, { exercises, workouts, sets, healthKitLinks, healthKitOutbox, migrationState });
}

async function beginHistoricalMigration() {
  const status = await healthKitService.getStatus().catch(() => ({ available: false }));
  const explained = await getSetting('migrationHealthAccessExplained', false);
  if (!status.available || explained) {
    openHistoricalMigration();
    return;
  }
  showHealthAuthorizationExplanation(async () => {
    try {
      await healthKitService.requestAuthorization();
      await setSetting('migrationHealthAccessExplained', true);
    } catch (error) {
      showToast(error.message);
    }
    openHistoricalMigration();
  });
}

function showMigrationPreview(audit, rows, healthMessage, snapshot) {
  const selected = new Set(rows.filter((row) => row.status === 'eligible').map((row) => row.workoutID));
  const counts = migrationCounts(rows);
  let canceled = false;
  let finished = false;
  const dismiss = showSheet({
    dismissOnBackdrop: false,
    html: `
      <div class="sheet-header"><button class="btn-text" id="migration-close">Cancel</button><div class="title">Health Backfill</div><button class="btn-text primary" id="migration-run">Import ${selected.size}</button></div>
      <div class="sheet-content migration-sheet">
        <div class="migration-summary"><strong>${rows.length}</strong> scanned · <strong>${counts.eligible}</strong> eligible · <strong>${counts.alreadySynchronized}</strong> already synced · <strong>${counts.possibleConflict}</strong> conflicts · <strong>${counts.invalid}</strong> invalid · <strong>${counts.requiresReview}</strong> review · <strong id="migration-excluded">0</strong> excluded</div>
        <p class="section-footer">${esc(healthMessage)}</p>
        <div class="notice-card"><strong>Historical values unavailable:</strong> effort, mood, energy, stress, soreness, breathing limitation, inhaler use, and symptoms will not be inferred.</div>
        <button class="btn-secondary" id="migration-backup">Create Fresh Lift Backup</button>
        <div class="migration-progress" id="migration-progress" hidden></div>
        <div class="migration-list">${rows.map((row) => migrationRow(row, selected.has(row.workoutID))).join('')}</div>
        <button class="btn-secondary" id="migration-report">Export Audit Report</button>
      </div>`,
    onMount(sheet) {
      const run = sheet.querySelector('#migration-run');
      const refreshCount = () => {
        run.textContent = `Import ${selected.size}`;
        run.disabled = selected.size === 0;
        sheet.querySelector('#migration-excluded').textContent = String(rows.filter((row) => ['eligible', 'requiresReview', 'needsUpdate'].includes(row.status)).length - selected.size);
      };
      for (const checkbox of sheet.querySelectorAll('[data-migration-id]')) checkbox.addEventListener('change', () => { checkbox.checked ? selected.add(checkbox.dataset.migrationId) : selected.delete(checkbox.dataset.migrationId); refreshCount(); });
      refreshCount();
      sheet.querySelector('#migration-close').addEventListener('click', () => { canceled = true; dismiss(); });
      sheet.querySelector('#migration-backup').addEventListener('click', () => downloadBackup().then(() => showToast('Fresh backup created.')).catch((error) => showToast(error.message)));
      sheet.querySelector('#migration-report').addEventListener('click', () => exportMigrationReport({
        audit,
        rows,
        selectedWorkoutIDs: [...selected],
        excludedWorkoutIDs: rows.filter((row) => !selected.has(row.workoutID)).map((row) => row.workoutID),
        generatedAt: new Date().toISOString(),
      }));
      run.addEventListener('click', async () => {
        if (finished) { dismiss(); emit('data:changed'); return; }
        if (!confirm(`Import ${selected.size} reviewed workout summaries to Apple Health? Keep Lift open until this finishes.`)) return;
        try {
          await downloadBackup();
          const progress = sheet.querySelector('#migration-progress');
          progress.hidden = false; progress.textContent = 'Creating durable pending operations…';
          run.disabled = true;
          const approvedRows = rows.filter((row) => selected.has(row.workoutID));
          const state = { id: 'healthKitBackfill', status: 'running', selectedWorkoutIDs: [...selected], excludedWorkoutIDs: rows.filter((r) => !selected.has(r.workoutID)).map((r) => r.workoutID), startedAt: Date.now(), updatedAt: Date.now(), migrationVersion: 1 };
          await put('migrationState', state);
          for (const row of approvedRows) {
            if (canceled) break;
            const workout = snapshot.workouts.find((candidate) => candidate.id === row.workoutID);
            await enqueueWorkout(workout, { backfilled: true, migrationVersion: 1 });
          }
          const result = await processHealthKitOutbox({ shouldCancel: () => canceled, onProgress: ({ processed, total, phase }) => { progress.textContent = `${phase === 'failure' ? 'Needs attention' : 'Synchronizing'} ${processed} of ${total}`; } });
          state.status = result.canceled ? 'canceled' : result.failed ? 'partiallyCompleted' : 'completed';
          state.updatedAt = Date.now(); state.completedAt = result.canceled ? null : Date.now(); state.result = result;
          await put('migrationState', state);
          progress.textContent = `${result.succeeded} synchronized · ${result.failed} failed${result.canceled ? ' · canceled safely' : ''}`;
          finished = !result.failed;
          run.textContent = result.failed ? 'Retry Failed' : 'Done';
          run.disabled = false;
          showToast('Migration state saved.');
        } catch (error) { run.disabled = false; showToast(error.message); }
      });
    },
  });
}

function migrationCounts(rows) {
  const result = { eligible: 0, alreadySynchronized: 0, possibleConflict: 0, invalid: 0, requiresReview: 0, needsUpdate: 0 };
  for (const row of rows) result[row.status] = (result[row.status] ?? 0) + 1;
  return result;
}

function migrationRow(row, selected) {
  const selectable = ['eligible', 'requiresReview', 'needsUpdate'].includes(row.status);
  return `<details class="migration-item status-${esc(row.status)}"><summary>${selectable ? `<input type="checkbox" data-migration-id="${row.workoutID}" ${selected ? 'checked' : ''} aria-label="Select ${esc(row.name)}"/>` : ''}<span><strong>${esc(row.name)}</strong><small>${row.start ? `${formatDateLong(row.start)} · ${formatTime(row.start)}–${formatTime(row.end)} · ${formatDurationShort(row.duration / 1000)}` : 'Invalid date'}</small></span><span class="migration-status">${esc(row.status)}</span></summary><div class="migration-detail"><p>${row.completedSetCount} completed · ${row.incompleteSetCount} incomplete set(s)</p><p>${esc(row.exercises.join(' · ') || 'No exercises')}</p><p>Proposed type: ${esc(row.proposedActivityType ?? 'None')}</p>${row.reason ? `<p class="warning-text">${esc(row.reason)}</p>` : ''}</div></details>`;
}

function exportMigrationReport(report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `lift-health-migration-report-${localCalendarDayIdentifier()}.json`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportStructuralCleanupReport() {
  const [exercises, workouts, sets] = await Promise.all([getAll('exercises'), getAll('workouts'), getAll('sets')]);
  const audit = auditLiftData({ exercises, workouts, sets });
  const report = {
    reportType: 'Lift structural cleanup review',
    generatedAt: new Date().toISOString(),
    destructiveChangesApplied: false,
    backupOrUndoPlan: 'Create a fresh Lift backup before approving any future structural cleanup.',
    findings: audit.findings,
    excludedFromBackfill: audit.rows.filter((row) => row.status !== 'eligible'),
  };
  exportMigrationReport(report);
}

export async function maybeOfferDailyCheckIn({ context = 'general', relatedWorkoutID = null } = {}) {
  const dayID = localCalendarDayIdentifier();
  const existing = (await getByIndex('wellbeingEntries', 'localCalendarDayIdentifier', dayID))[0];
  if (existing) return false;
  const deferredDay = await getSetting('checkInDeferredDay', null);
  if (context === 'general' && deferredDay === dayID) return false;
  openWellbeingCheckIn({ context, relatedWorkoutID, onSaved: () => emit('data:changed') });
  if (context === 'general') await setSetting('checkInDeferredDay', dayID);
  return true;
}
