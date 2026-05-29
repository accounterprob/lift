import { openDB, purgeCardioData } from './db.js';
import { seedIfNeeded } from './seed.js';
import { on, showToast, esc } from './utils.js';
import { setCurrentTab } from './state.js';
import { renderWorkoutTab } from './views/workout.js';
import { renderExercisesTab } from './views/exercises.js';
import { renderProgressTab } from './views/progress.js';

// iOS PWA standalone mode misreports `visualViewport.height` and `innerHeight`
// — it leaves a phantom Safari-URL-bar-sized gap at the bottom. The OS-reported
// `screen.height` doesn't lie, so use that in standalone mode. In Safari we
// still want visualViewport.height (it correctly excludes the URL bar so the
// tab bar lands above the chrome).
function syncAppHeight() {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  let h;
  if (isStandalone) {
    // Take the largest reading available — screen.height is the OS-level
    // logical-pixel height and is the most reliable in standalone mode.
    h = Math.max(
      window.innerHeight || 0,
      window.visualViewport?.height || 0,
      window.screen?.height || 0,
    );
  } else {
    h = window.visualViewport?.height || window.innerHeight;
  }
  document.documentElement.style.setProperty('--app-height', `${h}px`);
}
syncAppHeight();
window.addEventListener('resize', syncAppHeight);
window.addEventListener('orientationchange', syncAppHeight);
window.addEventListener('pageshow', syncAppHeight);
window.visualViewport?.addEventListener('resize', syncAppHeight);

const TABS = {
  workout: { title: 'Workout', render: renderWorkoutTab },
  exercises: { title: 'Exercises', render: renderExercisesTab },
  progress: { title: 'Progress', render: renderProgressTab },
};

const viewContent = document.getElementById('view-content');
const navTitle = document.getElementById('nav-title');
const navBack = document.getElementById('nav-back');
const navAction = document.getElementById('nav-action');

let currentTab = 'workout';
let activeBackHandler = null;
let activeActionHandler = null;
let teardown = null;

const ctx = {
  container: viewContent,
  setTitle(title) {
    navTitle.textContent = title;
  },
  /** config: { label?: string, html?: string, onClick: () => void } | null */
  setAction(config) {
    if (!config) {
      navAction.hidden = true;
      navAction.innerHTML = '';
      activeActionHandler = null;
      return;
    }
    navAction.hidden = false;
    if (config.html) {
      navAction.innerHTML = config.html;
    } else {
      navAction.textContent = config.label ?? '';
    }
    activeActionHandler = config.onClick;
  },
  /** Show/hide the back chevron. Pass a handler to enable, null to hide. */
  setBack(handler) {
    activeBackHandler = handler;
    navBack.hidden = !handler;
  },
  refresh() {
    renderTab(currentTab);
  },
  toast(message) {
    showToast(message);
  },
};

function teardownCurrent() {
  if (typeof teardown === 'function') {
    try { teardown(); } catch (e) { console.error(e); }
  }
  teardown = null;
}

function renderTab(tab) {
  currentTab = tab;
  setCurrentTab(tab);
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.setAttribute('aria-selected', String(btn.dataset.tab === tab));
  });

  teardownCurrent();
  ctx.setTitle(TABS[tab].title);
  ctx.setAction(null);
  ctx.setBack(null);
  viewContent.innerHTML = '';
  viewContent.scrollTop = 0;

  try {
    teardown = TABS[tab].render(ctx);
  } catch (err) {
    console.error('Render failed', err);
    viewContent.innerHTML = `<div class="empty-state"><div class="empty-icon">!</div><h2>Render error</h2><p>${esc(err.message)}</p></div>`;
  }
}

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => renderTab(btn.dataset.tab));
});

navBack.addEventListener('click', () => {
  if (activeBackHandler) activeBackHandler();
});

navAction.addEventListener('click', () => {
  if (activeActionHandler) activeActionHandler();
});

on('data:changed', () => renderTab(currentTab));
on('workout:changed', () => {
  if (currentTab === 'workout') renderTab(currentTab);
});

async function init() {
  try {
    await openDB();
    const seededCount = await seedIfNeeded();
    if (seededCount > 0) console.info(`Seeded ${seededCount} exercises.`);
    const purged = await purgeCardioData();
    if (purged.exercises > 0) {
      console.info(`Removed ${purged.exercises} cardio exercise(s), ${purged.sets} set(s), ${purged.workouts} cardio-only workout(s).`);
    }
    renderTab('workout');
  } catch (err) {
    console.error('Init failed:', err);
    viewContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">!</div>
        <h2>Storage unavailable</h2>
        <p>${esc(err.message ?? String(err))}</p>
        <p>If you are running this from a <code>file://</code> URL, serve it through a local web server instead.</p>
      </div>`;
  }
}

init();
