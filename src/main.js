import { openDB } from './db.js';
import { seedIfNeeded } from './seed.js';
import { on, showToast, esc } from './utils.js';
import { setCurrentTab } from './state.js';
import { refreshDayTheme } from './days.js';
import { runDataMigrationsOnce } from './migrations.js';
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
      navAction.removeAttribute('aria-label');
      activeActionHandler = null;
      return;
    }
    navAction.hidden = false;
    if (config.label) navAction.setAttribute('aria-label', config.label);
    else navAction.removeAttribute('aria-label');
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
  btn.addEventListener('click', () => {
    // Close any open sheets so they don't strand over the new tab.
    document.querySelectorAll('.sheet-backdrop').forEach((el) => el.dismissSheet?.());
    renderTab(btn.dataset.tab);
  });
});

navBack.addEventListener('click', () => {
  if (activeBackHandler) activeBackHandler();
});

navAction.addEventListener('click', () => {
  if (activeActionHandler) activeActionHandler();
});

// Tap feedback, app-wide. :active is unreliable in iOS standalone PWAs, so
// mirror the calculator keys' approach for every control: toggle a .pressed
// class on pointer down/up so buttons visibly react for the duration of a tap
// (the .pressed CSS rules decide how each control looks). The calculator keys
// keep their own bespoke handling and opt out here.
(function initPressFeedback() {
  const SELECTOR = 'button, [role="button"], a[href]';
  let pressed = null;
  let startX = 0;
  let startY = 0;
  const release = () => {
    if (pressed) { pressed.classList.remove('pressed'); pressed = null; }
  };
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest?.(SELECTOR);
    if (pressed && pressed !== el) release();
    if (!el || el.disabled || el.classList.contains('calc-key')) return;
    pressed = el;
    startX = e.clientX;
    startY = e.clientY;
    el.classList.add('pressed');
  }, { passive: true });
  // A few px of movement means a scroll/drag, not a tap — drop the highlight so
  // a flicked list never leaves a row stuck looking pressed.
  document.addEventListener('pointermove', (e) => {
    if (pressed && (Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8)) release();
  }, { passive: true });
  document.addEventListener('pointerup', release, { passive: true });
  document.addEventListener('pointercancel', release, { passive: true });
  window.addEventListener('scroll', release, { passive: true, capture: true });
})();

on('data:changed', () => {
  refreshDayTheme();
  renderTab(currentTab);
});
on('workout:changed', () => {
  refreshDayTheme();
  if (currentTab === 'workout') renderTab(currentTab);
});

// Re-check the day when the app comes back to the foreground, so the theme
// rolls over to the next rotation day past midnight without a relaunch.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshDayTheme();
});

async function init() {
  try {
    await openDB();
    const seededCount = await seedIfNeeded();
    if (seededCount > 0) console.info(`Seeded ${seededCount} exercises.`);
    // One-time data cleanups — skipped on later launches once they've run on
    // this device (a restore re-runs them). See migrations.js.
    await runDataMigrationsOnce();
    // Render immediately: the correct day accent was already applied before
    // first paint by the inline bootstrap in index.html (from localStorage).
    // refreshDayTheme then reconciles today's day in the background and caches
    // it for next launch — no green→color flash, no theme read blocking paint.
    renderTab('workout');
    refreshDayTheme();
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
