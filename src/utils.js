export const uuid = () =>
  (crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

export function epley1RM(weight, reps) {
  if (!reps || !weight) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function formatWeight(w) {
  if (w == null) return '0';
  if (Math.abs(w - Math.round(w)) < 0.001) return String(Math.round(w));
  return w.toFixed(1);
}

export function formatLbs(w) {
  return `${formatWeight(w)} lbs`;
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatDurationShort(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatVolume(v) {
  if (v >= 10_000) return `${(v / 1000).toFixed(1)}k lbs`;
  return `${Math.round(v)} lbs`;
}

export function formatDateShort(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' });
}

export function formatDateLong(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function debounce(fn, delay = 200) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Escape text for safe HTML interpolation. */
export function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function todayWorkoutName() {
  return `${new Date().toLocaleDateString(undefined, { weekday: 'long' })} Workout`;
}

export function showToast(message, durationMs = 1800, opts = {}) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  if (opts.persistUntilClick) {
    // Stays until the user taps anywhere on it — no auto-dismiss, no close button.
    toast.classList.add('toast-clickable');
    toast.addEventListener('click', () => toast.remove());
  } else {
    setTimeout(() => toast.remove(), durationMs);
  }
  document.body.appendChild(toast);
}

export const events = new EventTarget();

export function emit(type, detail) {
  events.dispatchEvent(new CustomEvent(type, { detail }));
}

export function on(type, handler) {
  events.addEventListener(type, handler);
  return () => events.removeEventListener(type, handler);
}

/**
 * Display a bottom sheet. Returns a dismiss function.
 * @param {{ html: string, onMount?: (sheetEl: HTMLElement, dismiss: () => void) => void }} config
 */
export function showSheet({ html, onMount }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.innerHTML = `<div class="sheet"></div>`;
  const sheet = backdrop.querySelector('.sheet');
  sheet.innerHTML = html;

  const topInset = readSafeAreaTop();

  // The backdrop always covers the FULL layout viewport (its dim never
  // exposes the page). The sheet bottom-aligns to the very bottom of the
  // viewport so its BACKGROUND fills all the way down — behind the keyboard
  // AND its accessory toolbar — leaving no gap. To keep the sheet's CONTENT
  // above the keyboard, we pad the sheet's bottom by the keyboard's overlap
  // height. Capping the height below the status bar / Dynamic Island keeps
  // the header (Cancel / Add / Done) tappable. iOS PWA standalone doesn't
  // fire window.resize on keyboard show — visualViewport does.
  function syncHeight() {
    const vv = window.visualViewport;
    if (!vv) {
      sheet.style.maxHeight = `${window.innerHeight - topInset - 10}px`;
      return;
    }
    const layoutHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
    const keyboardInset = Math.max(0, layoutHeight - vv.height - vv.offsetTop);
    backdrop.style.paddingBottom = '0px';
    if (keyboardInset > 0) {
      // box-sizing is border-box, so max-height includes the bottom padding.
      sheet.style.paddingBottom = `${keyboardInset}px`;
      sheet.style.maxHeight = `${vv.height - topInset - 10 + keyboardInset}px`;
    } else {
      sheet.style.paddingBottom = '';
      sheet.style.maxHeight = `${vv.height - topInset - 10}px`;
    }
  }
  syncHeight();
  const vv = window.visualViewport;
  vv?.addEventListener('resize', syncHeight);
  vv?.addEventListener('scroll', syncHeight);

  function dismiss() {
    backdrop.remove();
    vv?.removeEventListener('resize', syncHeight);
    vv?.removeEventListener('scroll', syncHeight);
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) dismiss();
  });

  document.body.appendChild(backdrop);
  onMount?.(sheet, dismiss);
  return dismiss;
}

/** Reads the px value of env(safe-area-inset-top) via a throwaway probe element. */
function readSafeAreaTop() {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);';
  document.body.appendChild(probe);
  const px = probe.offsetHeight || 0;
  probe.remove();
  return px;
}

/** Confirm dialog backed by window.confirm — simple but works on iOS. */
export function confirmAction(message) {
  return window.confirm(message);
}

// ----- Shared inline icons + error markup (used across views) -----

export function trashIcon() {
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color: var(--red);"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
}

export function shareIcon() {
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.41 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>`;
}

export function errorState(err) {
  return `<div class="empty-state"><div class="empty-icon">!</div><h2>Couldn't load</h2><p>${esc(err.message || String(err))}</p></div>`;
}
