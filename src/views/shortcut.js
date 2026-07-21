import { getSetting, put, setSetting } from '../db.js';
import { buildWorkoutShortcutURL, SHORTCUT_DEFAULT_NAME } from '../health/shortcut.js';
import { esc, formatDateLong, formatDurationShort, showSheet, showToast } from '../utils.js';

export async function shortcutSettings() {
  const [ready, name] = await Promise.all([
    getSetting('appleHealthShortcutReady', false),
    getSetting('appleHealthShortcutName', SHORTCUT_DEFAULT_NAME),
  ]);
  return { ready: Boolean(ready), name: String(name || SHORTCUT_DEFAULT_NAME) };
}

export async function openShortcutSetup({ onReady = null } = {}) {
  const settings = await shortcutSettings();
  const dismiss = showSheet({
    dismissOnBackdrop: false,
    html: `
      <div class="sheet-header"><button class="btn-text" id="shortcut-setup-close">Not Now</button><div class="title">Apple Health Shortcut</div><span style="width:60px"></span></div>
      <div class="sheet-content">
        <p class="sheet-intro">This one-time setup lets the Home Screen version of Lift hand a completed workout to Apple Health. It does not require a paid developer account.</p>
        <div class="notice-card">Lift saves your workout before opening Shortcuts. The Shortcut receives only the workout name, start time, and duration.</div>
        <div class="section">Build it in Shortcuts</div>
        <div class="shortcut-step-list" aria-label="Shortcut setup steps">
          <div class="shortcut-step"><span class="shortcut-step-number">1</span><div><strong>Create the Shortcut</strong><p>Make a new shortcut named <b>${esc(settings.name)}</b>.</p></div></div>
          <div class="shortcut-step"><span class="shortcut-step-number">2</span><div><strong>Read Lift’s input</strong><p>Add <b>Get Dictionary from Input</b> and choose <b>Shortcut Input</b>.</p></div></div>
          <div class="shortcut-step"><span class="shortcut-step-number">3</span><div><strong>Get the start time</strong><p>Get the dictionary value <b>startDate</b>, then add <b>Get Dates from Input</b>.</p></div></div>
          <div class="shortcut-step"><span class="shortcut-step-number">4</span><div><strong>Get the duration</strong><p>Get the dictionary value <b>durationMinutes</b>.</p></div></div>
          <div class="shortcut-step"><span class="shortcut-step-number">5</span><div><strong>Log the workout</strong><p>Add <b>Log Workout</b>. Choose <b>Traditional Strength Training</b>, use the date from step 3 as Start Date, and the number from step 4 as Duration in minutes.</p></div></div>
          <div class="shortcut-step"><span class="shortcut-step-number">6</span><div><strong>Finish</strong><p>Leave Log Workout as the last action, then tap Done.</p></div></div>
        </div>
        <div class="form-section"><label class="form-row"><span>Shortcut name</span><input id="shortcut-name" value="${esc(settings.name)}" autocomplete="off" /></label></div>
        <div class="action-section compact-actions">
          <button class="btn-secondary" id="shortcut-open">Open Shortcuts</button>
          <button class="btn-primary" id="shortcut-ready">${settings.ready ? 'Save Setup' : 'Shortcut Is Ready'}</button>
        </div>
        <div class="section-footer">Apple may ask permission the first time the shortcut writes to Health. If you rename it later, update the name here.</div>
      </div>`,
    onMount(sheet) {
      const nameInput = sheet.querySelector('#shortcut-name');
      sheet.querySelector('#shortcut-setup-close').addEventListener('click', () => dismiss());
      sheet.querySelector('#shortcut-open').addEventListener('click', async () => {
        const name = nameInput.value.trim() || SHORTCUT_DEFAULT_NAME;
        await setSetting('appleHealthShortcutName', name);
        window.location.assign('shortcuts://create-shortcut');
      });
      sheet.querySelector('#shortcut-ready').addEventListener('click', async () => {
        const name = nameInput.value.trim() || SHORTCUT_DEFAULT_NAME;
        await Promise.all([
          setSetting('appleHealthShortcutName', name),
          setSetting('appleHealthShortcutReady', true),
        ]);
        dismiss();
        showToast('Apple Health Shortcut is ready.');
        onReady?.();
      });
    },
  });
}

export async function openAppleHealthShortcutPrompt(workout, { repeat = false } = {}) {
  const settings = await shortcutSettings();
  if (!settings.ready) {
    await openShortcutSetup({ onReady: () => openAppleHealthShortcutPrompt(workout, { repeat }) });
    return;
  }
  const duration = (Number(workout.endedAt) - Number(workout.startedAt)) / 1000;
  const wasExported = workout.appleHealthShortcutStatus === 'exported';
  const wasOpened = workout.appleHealthShortcutStatus === 'launching';
  const mightDuplicate = repeat || wasExported || wasOpened;
  const dismiss = showSheet({
    html: `
      <div class="sheet-header"><button class="btn-text" id="shortcut-cancel">Not Now</button><div class="title">Add to Apple Health?</div><span style="width:60px"></span></div>
      <div class="sheet-content">
        <div class="form-section">
          <div class="stat-row"><div class="stat-label">Workout</div><div class="stat-value">${esc(workout.name || 'Lift Workout')}</div></div>
          <div class="stat-row"><div class="stat-label">Date</div><div class="stat-value">${formatDateLong(workout.startedAt)}</div></div>
          <div class="stat-row"><div class="stat-label">Duration</div><div class="stat-value">${formatDurationShort(duration)}</div></div>
        </div>
        <div class="notice-card">Your workout is already saved in Lift. This opens your Shortcut to add one Traditional Strength Training summary to Apple Health.</div>
        ${mightDuplicate ? `<div class="notice-card warning-text">${wasOpened && !wasExported ? 'Lift opened this workout in Shortcuts before but did not receive a result. Check Apple Health first—opening it again could create a duplicate.' : 'This workout was already sent before. Running the Shortcut again can create a duplicate in Apple Health.'}</div>` : ''}
        <div class="action-section"><button class="btn-primary" id="shortcut-run">${mightDuplicate ? 'Open Shortcut Again' : 'Add to Apple Health'}</button></div>
        <div class="section-footer">Lift cannot read Apple Health from a web app, so it cannot verify or remove entries made by the Shortcut.</div>
      </div>`,
    onMount(sheet) {
      sheet.querySelector('#shortcut-cancel').addEventListener('click', () => dismiss());
      sheet.querySelector('#shortcut-run').addEventListener('click', async () => {
        const next = {
          ...workout,
          appleHealthShortcutStatus: 'launching',
          appleHealthShortcutLastAttemptAt: Date.now(),
          appleHealthShortcutLastError: null,
        };
        await put('workouts', next);
        const url = buildWorkoutShortcutURL(next, { shortcutName: settings.name });
        dismiss();
        window.location.assign(url);
      });
    },
  });
}
