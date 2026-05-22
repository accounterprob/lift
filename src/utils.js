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

export function showToast(message, durationMs = 1800) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), durationMs);
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

  // Track the iOS on-screen keyboard so the sheet height shrinks above it
  // (iOS PWA standalone doesn't fire window.resize on keyboard show, but
  // visualViewport does). Without this, the picker's list scrolls behind
  // the keyboard and becomes unreachable.
  function syncHeight() {
    const vv = window.visualViewport;
    const h = vv ? vv.height : window.innerHeight;
    sheet.style.maxHeight = `${h - 12}px`;
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

/** Confirm dialog backed by window.confirm — simple but works on iOS. */
export function confirmAction(message) {
  return window.confirm(message);
}
