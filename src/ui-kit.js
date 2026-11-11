/* ui-kit.js: replaces native select lists, date/time pickers, datalist dropdowns,
   title tooltips, validation bubbles and alert/confirm/prompt with themed versions.
   Plain script, no dependencies. Exposes window.ui = { confirm, alert, prompt, enhance, refresh }.
   The original <select>/<input> stays in the DOM as the source of truth (value, name,
   FormData, change listeners); the kit only adds a themed trigger next to it. */
(() => {
  'use strict';
  if (window.ui && window.ui.enhance) return;
  const d = document;
  const inst = new WeakMap();          // original element -> { trigger, sync }
  const owner = new WeakMap();         // trigger -> original element
  let uid = 0;
  const newId = (p) => `ui-${p}-${++uid}`;
  const hasPopover = typeof HTMLElement.prototype.showPopover === 'function';

  const icon = (body, cls) =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const CHECK = '<svg class="ui-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHEV = icon('<path d="M6 9l6 6 6-6"/>', 'ui-chev');
  const CAL = icon('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', 'ui-icon');
  const PREV = icon('<path d="M15 6l-6 6 6 6"/>', '');
  const NEXT = icon('<path d="M9 6l6 6-6 6"/>', '');

  const fire = (el) => {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  // Own classes are never copied to triggers.
  const userClasses = (el) => [...el.classList].filter((c) => !c.startsWith('ui-')).join(' ');
  // Elements live in the top layer while a modal <dialog> is open, so floating UI must
  // sit inside that dialog (or it is inert) and use the Popover API to render on top.
  const mount = (el, near) => {
    (near && near.closest('dialog[open]') || d.body).appendChild(el);
    if (hasPopover) { el.popover = 'manual'; try { el.showPopover(); } catch (_) {} }
  };

  /* Put a fixed element below (or above) a rect, clamped to the viewport. */
  function place(el, r, gap, center) {
    const vw = d.documentElement.clientWidth, vh = window.innerHeight, m = 8;
    el.style.maxHeight = '';
    const below = vh - r.bottom - gap - m, above = r.top - gap - m;
    let h = el.offsetHeight;
    const up = h > below && above > below;
    const room = Math.max(up ? above : below, 120);
    if (h > room && el.classList.contains('ui-pop')) { el.style.maxHeight = room + 'px'; h = room; }
    const w = el.offsetWidth;
    let left = center ? r.left + r.width / 2 - w / 2 : r.left;
    left = Math.max(m, Math.min(left, vw - w - m));
    const top = up ? Math.max(m, r.top - gap - h) : Math.min(r.bottom + gap, vh - h - m);
    el.style.left = Math.round(left) + 'px';
    el.style.top = Math.round(Math.max(m, top)) + 'px';
  }

  /* ---------- Popover manager: one open at a time ---------- */
  let open = null; // { pop, anchor, onClose }
  function showPop(anchor, pop, onClose) {
    closePop();
    pop.classList.add('ui-pop');
    pop.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('input,textarea')) e.preventDefault(); // keep focus on the trigger
    });
    mount(pop, anchor);
    const r = anchor.getBoundingClientRect();
    if (!pop.classList.contains('ui-cal')) pop.style.minWidth = Math.max(180, r.width) + 'px';
    place(pop, r, 4, false);
    open = { pop, anchor, onClose };
    anchor.setAttribute('aria-expanded', 'true');
    anchor.setAttribute('aria-controls', pop.id);
  }
  function closePop(refocus) {
    if (!open) return;
    const { pop, anchor, onClose } = open;
    open = null;
    pop.remove();
    anchor.setAttribute('aria-expanded', 'false');
    anchor.removeAttribute('aria-activedescendant');
    anchor.removeAttribute('aria-controls');
    if (onClose) onClose();
    if (refocus) anchor.focus();
  }
  const isOpen = (anchor) => open && open.anchor === anchor;
  d.addEventListener('pointerdown', (e) => {
    if (open && !open.pop.contains(e.target) && !open.anchor.contains(e.target)) closePop();
  }, true);
  // Only a scroll that moves the anchor matters (an ancestor or the page), not unrelated
  // scrolling panes or the menu itself. A text-field anchor (datalist, time) is repositioned
  // instead: on iPhone the page scrolls when the keyboard opens.
  const movesAnchor = (t, a) => t === d || t === window || (t instanceof Node && t.contains(a));
  const typed = (a) => a.tagName === 'INPUT';
  function follow() {
    const r = open.anchor.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return closePop();
    place(open.pop, r, 4, false);
  }
  window.addEventListener('scroll', (e) => {
    if (open && !(e.target instanceof Node && open.pop.contains(e.target)) && movesAnchor(e.target, open.anchor)) {
      if (typed(open.anchor)) follow(); else closePop();
    }
    if (tipFor && movesAnchor(e.target, tipFor)) hideTip();
    if (bubble && bubble.isConnected && bubbleFor && movesAnchor(e.target, bubbleFor)) place(bubble, bubbleFor.getBoundingClientRect(), 6, false);
  }, true);
  window.addEventListener('resize', () => { if (open && typed(open.anchor)) follow(); else closePop(); hideTip(); });
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { e.preventDefault(); closePop(); } });

  /* ---------- Generic listbox menu ---------- */
  // entries: [{ group: 'Label' } | { label, value, disabled, selected }]
  function openMenu(anchor, entries, { onPick, activeIndex = -1, onClose }) {
    const pop = d.createElement('div');
    pop.id = newId('menu');
    pop.className = 'ui-menu';
    pop.setAttribute('role', 'listbox');
    const items = [];
    for (const e of entries) {
      if (e.group != null) {
        const g = d.createElement('div');
        g.className = 'ui-group';
        g.setAttribute('role', 'presentation');
        g.textContent = e.group;
        pop.appendChild(g);
        continue;
      }
      const it = d.createElement('div');
      it.className = 'ui-item';
      it.id = newId('opt');
      it.setAttribute('role', 'option');
      it.setAttribute('aria-selected', e.selected ? 'true' : 'false');
      if (e.disabled) it.setAttribute('aria-disabled', 'true');
      const s = d.createElement('span');
      s.textContent = e.label;
      it.appendChild(s);
      if (e.selected) it.insertAdjacentHTML('beforeend', CHECK);
      const i = items.length;
      it.addEventListener('pointermove', () => ctl.setActive(i, false));
      it.addEventListener('click', () => ctl.pick(i));
      items.push({ el: it, e });
      pop.appendChild(it);
    }
    let active = -1;
    const ctl = {
      pop, items,
      get active() { return active; },
      setActive(i, scroll = true) {
        if (items[active]) items[active].el.classList.remove('ui-active');
        active = i;
        const it = items[i];
        if (!it) { anchor.removeAttribute('aria-activedescendant'); return; }
        it.el.classList.add('ui-active');
        anchor.setAttribute('aria-activedescendant', it.el.id);
        if (scroll) { // scroll inside the menu only, never the page
          const t = it.el.offsetTop, b = t + it.el.offsetHeight;
          if (t < pop.scrollTop) pop.scrollTop = t;
          else if (b > pop.scrollTop + pop.clientHeight) pop.scrollTop = b - pop.clientHeight;
        }
      },
      move(delta) {
        const n = items.length;
        if (!n) return;
        let i = active < 0 ? (delta > 0 ? -1 : n) : active;
        for (let k = 0; k < n; k++) {
          i += delta;
          if (i < 0 || i >= n) return; // stop at the ends
          if (!items[i].e.disabled) return ctl.setActive(i);
        }
      },
      edge(end) { ctl.setActive(-1); active = end ? items.length : -1; ctl.move(end ? -1 : 1); },
      pick(i = active) {
        const it = items[i];
        if (!it || it.e.disabled) return false;
        closePop();
        onPick(it.e, i);
        return true;
      },
      typed: '', typedAt: 0,
      typeahead(ch) {
        const now = Date.now();
        ctl.typed = (now - ctl.typedAt > 700 ? '' : ctl.typed) + ch.toLowerCase();
        ctl.typedAt = now;
        const t = ctl.typed, n = items.length;
        const same = t.length > 1 && [...t].every((c) => c === t[0]); // "aaa" cycles through A's
        const q = same ? t[0] : t;
        const start = same || t.length === 1 ? active + 1 : Math.max(active, 0);
        for (let k = 0; k < n; k++) {
          const i = (start + k) % n, it = items[i];
          if (!it.e.disabled && it.e.label.trim().toLowerCase().startsWith(q)) return ctl.setActive(i);
        }
      },
    };
    showPop(anchor, pop, onClose);
    ctl.setActive(activeIndex >= 0 ? activeIndex : -1);
    if (activeIndex >= 0 && items[activeIndex]) {
      const el = items[activeIndex].el; // centre the chosen item in long lists
      pop.scrollTop = el.offsetTop - pop.clientHeight / 2 + el.offsetHeight / 2;
    }
    return ctl;
  }
  // Shared key handling for an open menu. Returns true when the key was used.
  function menuKey(ctl, e, { typeahead = true, spacePicks = true } = {}) {
    switch (e.key) {
      case 'ArrowDown': ctl.move(1); break;
      case 'ArrowUp': ctl.move(-1); break;
      case 'PageDown': for (let i = 0; i < 6; i++) ctl.move(1); break;
      case 'PageUp': for (let i = 0; i < 6; i++) ctl.move(-1); break;
      case 'Home': if (!typeahead) return false; ctl.edge(false); break;
      case 'End': if (!typeahead) return false; ctl.edge(true); break;
      case 'Enter': if (!ctl.pick()) { if (!typeahead) return false; closePop(true); } break;
      case ' ':
        if (!spacePicks) return false;
        if (typeahead && ctl.typed && Date.now() - ctl.typedAt < 700) { ctl.typeahead(' '); break; }
        ctl.pick(); break;
      case 'Escape': closePop(true); break;
      case 'Tab': closePop(); return false;
      default:
        if (typeahead && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { ctl.typeahead(e.key); break; }
        return false;
    }
    e.preventDefault();
    e.stopPropagation();
    return true;
  }

  /* ---------- Shared "hidden source + themed trigger" plumbing ---------- */
  function hideSource(el, trigger, sync, props, proto, openFn) {
    el.setAttribute('data-ui', '');
    el.setAttribute('data-ui-hidden', '');
    el.tabIndex = -1;
    el.setAttribute('aria-hidden', 'true');
    // inert: unreachable by tap, Tab, label click and the iPhone keyboard's next/previous
    // arrows, so the native picker can never open. Values still submit with the form.
    el.inert = true;
    el.after(trigger);
    inst.set(el, { trigger, sync });
    owner.set(trigger, el);
    // Code calling el.focus() / el.showPicker() gets the themed control.
    el.focus = (o) => trigger.focus(o);
    el.showPicker = () => { trigger.focus(); openFn(); };
    // Code that sets .value / .selectedIndex updates the trigger too.
    for (const k of props) {
      const desc = Object.getOwnPropertyDescriptor(proto, k);
      Object.defineProperty(el, k, {
        configurable: true,
        get() { return desc.get.call(this); },
        set(v) { desc.set.call(this, v); sync(); },
      });
    }
    if (el.title) { el.setAttribute('data-tip', el.title); el.removeAttribute('title'); }
    // Focusing the hidden element (label click, el.focus()) goes to the trigger.
    el.addEventListener('focus', () => trigger.focus());
    new MutationObserver(sync).observe(el, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['disabled', 'readonly', 'class', 'style', 'title', 'data-tip', 'selected', 'label', 'value', 'min', 'max', 'placeholder', 'aria-label', 'hidden'],
    });
    sync();
  }
  // Mirrors styling-related attributes from the source to its trigger.
  function mirror(el, trigger, base) {
    trigger.className = (base + ' ' + userClasses(el)).trim();
    const st = el.getAttribute('style');
    if (st) trigger.setAttribute('style', st); else trigger.removeAttribute('style');
    trigger.hidden = el.hidden;
    trigger.disabled = el.matches(':disabled');
    if (trigger.tagName === 'INPUT') trigger.readOnly = el.readOnly;
    // The title becomes data-tip on the source (kept, so a cloned copy still has it) and the trigger.
    if (el.title) { el.setAttribute('data-tip', el.title); el.removeAttribute('title'); }
    const tipText = el.getAttribute('data-tip');
    if (tipText) trigger.dataset.tip = tipText; else delete trigger.dataset.tip;
  }
  // Accessible name from aria-label or the element's <label> text (minus the control itself).
  function nameOf(el) {
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    const L = el.labels && el.labels[0];
    if (!L) return '';
    const c = L.cloneNode(true);
    c.querySelectorAll('select,input,button,textarea,datalist').forEach((x) => x.remove());
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  /* ---------- Select ---------- */
  // option.selected = true from app code changes the value without touching .value: keep the label in sync.
  const optDesc = Object.getOwnPropertyDescriptor(HTMLOptionElement.prototype, 'selected');
  Object.defineProperty(HTMLOptionElement.prototype, 'selected', {
    configurable: true, enumerable: optDesc.enumerable,
    get() { return optDesc.get.call(this); },
    set(v) {
      optDesc.set.call(this, v);
      const p = this.parentNode, s = p && (p.tagName === 'OPTGROUP' ? p.parentNode : p), t = s && inst.get(s);
      if (t) t.sync();
    },
  });
  function enhanceSelect(sel) {
    if (sel.multiple || sel.size > 1) return;
    const btn = d.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="ui-select-label"></span>' + CHEV;
    const label = btn.firstChild;
    let ctl = null;
    const sync = () => {
      mirror(sel, btn, 'ui-select');
      const o = sel.options[sel.selectedIndex];
      label.textContent = o ? o.label : '';
      const n = nameOf(sel);
      if (n) btn.setAttribute('aria-label', o ? `${n}: ${o.label}` : n); else btn.removeAttribute('aria-label');
      if (ctl && isOpen(btn)) openList(); // options changed while open: redraw
    };
    function openList() {
      const entries = [];
      let active = -1;
      const add = (o) => {
        if (o.hidden) return;
        if (o.index === sel.selectedIndex) active = entries.filter((x) => x.group == null).length;
        entries.push({ label: o.label, value: o.index, disabled: o.disabled || (o.parentNode.tagName === 'OPTGROUP' && o.parentNode.disabled), selected: o.index === sel.selectedIndex });
      };
      for (const c of sel.children) {
        if (c.tagName === 'OPTGROUP') { entries.push({ group: c.label }); [...c.children].forEach((o) => o.tagName === 'OPTION' && add(o)); }
        else if (c.tagName === 'OPTION') add(c);
      }
      ctl = openMenu(btn, entries, {
        activeIndex: active,
        onClose: () => { ctl = null; },
        onPick: (e) => {
          btn.focus();
          if (sel.selectedIndex !== e.value) { sel.selectedIndex = e.value; fire(sel); }
        },
      });
      if (active < 0) ctl.move(1);
    }
    btn.addEventListener('click', () => (isOpen(btn) ? closePop() : openList()));
    btn.addEventListener('keydown', (e) => {
      if (ctl && isOpen(btn)) return menuKey(ctl, e);
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key) || (e.altKey && e.key === 'ArrowDown')) {
        e.preventDefault(); openList();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
        e.preventDefault(); openList(); ctl.typeahead(e.key);
      }
    });
    hideSource(sel, btn, sync, ['value', 'selectedIndex'], HTMLSelectElement.prototype, () => isOpen(btn) || openList());
  }

  /* ---------- Date picker ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  // Formatters are built once: toLocale*String() builds a new one on every call (slow with hundreds of fields).
  const fmt = (o) => new Intl.DateTimeFormat(undefined, o);
  const F_LABEL = fmt({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const F_MONTH = fmt({ month: 'long', year: 'numeric' });
  const F_LONG = fmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const F_TIME = fmt({ hour: 'numeric', minute: '2-digit' });
  const iso = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const parseISO = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const addDays = (dt, n) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
  const addMonths = (dt, n) => {
    const t = new Date(dt.getFullYear(), dt.getMonth() + n, 1);
    const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    return new Date(t.getFullYear(), t.getMonth(), Math.min(dt.getDate(), last));
  };
  const weekStart = (() => { // locale's first weekday; Sunday unless the locale says otherwise
    try { const l = new Intl.Locale(navigator.language); const w = (l.getWeekInfo ? l.getWeekInfo() : l.weekInfo); return w ? w.firstDay % 7 : 0; } catch (_) { return 0; }
  })();

  function enhanceDate(inp) {
    const btn = d.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="ui-date-label"></span>' + CAL;
    const label = btn.firstChild;
    let view = null, active = null, grid = null, titleEl = null;
    const limits = () => [parseISO(inp.min), parseISO(inp.max)];
    const allowed = (dt) => { const [lo, hi] = limits(); return (!lo || dt >= lo) && (!hi || dt <= hi); };
    const sync = () => {
      mirror(inp, btn, 'ui-date');
      const v = parseISO(inp.value);
      label.classList.toggle('ui-empty', !v);
      label.textContent = v
        ? F_LABEL.format(v)
        : inp.placeholder || 'Select date';
      const n = nameOf(inp);
      if (n) btn.setAttribute('aria-label', `${n}: ${label.textContent}`); else btn.removeAttribute('aria-label');
      if (grid && isOpen(btn)) render();
    };
    function render() {
      titleEl.textContent = F_MONTH.format(view);
      const first = new Date(view.getFullYear(), view.getMonth(), 1);
      const start = addDays(first, -((first.getDay() - weekStart + 7) % 7));
      const sel = inp.value, today = iso(new Date());
      grid.querySelectorAll('.ui-cal-day').forEach((b) => b.remove());
      for (let i = 0; i < 42; i++) {
        const dt = addDays(start, i), key = iso(dt);
        const b = d.createElement('button');
        b.type = 'button';
        b.tabIndex = -1;
        b.className = 'ui-cal-day';
        b.id = `${btn.id}-${key}`;
        b.setAttribute('role', 'gridcell');
        b.textContent = dt.getDate();
        b.setAttribute('aria-label', F_LONG.format(dt));
        if (dt.getMonth() !== view.getMonth()) b.classList.add('ui-out');
        if (key === today) b.classList.add('ui-today');
        if (key === sel) b.setAttribute('aria-selected', 'true');
        if (active && key === iso(active)) { b.classList.add('ui-active'); btn.setAttribute('aria-activedescendant', b.id); }
        b.disabled = !allowed(dt);
        b.addEventListener('click', () => choose(dt));
        grid.appendChild(b);
      }
    }
    function choose(dt) {
      if (dt && !allowed(dt)) return;
      closePop(true);
      const v = dt ? iso(dt) : '';
      if (inp.value !== v) { inp.value = v; fire(inp); }
    }
    function moveTo(dt) {
      const [lo, hi] = limits();
      if (lo && dt < lo) dt = lo;
      if (hi && dt > hi) dt = hi;
      active = dt;
      if (dt.getMonth() !== view.getMonth() || dt.getFullYear() !== view.getFullYear()) view = new Date(dt.getFullYear(), dt.getMonth(), 1);
      render();
    }
    function openCal() {
      const pop = d.createElement('div');
      pop.id = newId('cal');
      pop.className = 'ui-cal';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', 'Choose date');
      pop.innerHTML = `<div class="ui-cal-head"><div class="ui-cal-title" aria-live="polite"></div>
        <button type="button" class="ui-cal-nav" tabindex="-1" aria-label="Previous month">${PREV}</button>
        <button type="button" class="ui-cal-nav" tabindex="-1" aria-label="Next month">${NEXT}</button></div>
        <div class="ui-cal-grid" role="grid"></div>
        <div class="ui-cal-foot"><button type="button" tabindex="-1">Today</button><button type="button" tabindex="-1">Clear</button></div>`;
      titleEl = pop.querySelector('.ui-cal-title');
      grid = pop.querySelector('.ui-cal-grid');
      const wd = new Date(2023, 0, 1 + weekStart); // 2023-01-01 was a Sunday
      for (let i = 0; i < 7; i++) {
        const c = d.createElement('div');
        c.className = 'ui-cal-wd';
        c.setAttribute('role', 'columnheader');
        c.textContent = addDays(wd, i).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
        grid.appendChild(c);
      }
      const [prev, next] = pop.querySelectorAll('.ui-cal-nav');
      prev.onclick = () => moveTo(addMonths(active, -1));
      next.onclick = () => moveTo(addMonths(active, 1));
      const [todayB, clearB] = pop.querySelectorAll('.ui-cal-foot button');
      todayB.onclick = () => choose(new Date(new Date().setHours(0, 0, 0, 0)));
      clearB.onclick = () => choose(null);
      clearB.hidden = inp.required;
      todayB.disabled = !allowed(new Date(new Date().setHours(0, 0, 0, 0)));
      const cur = parseISO(inp.value) || new Date(new Date().setHours(0, 0, 0, 0));
      active = cur;
      view = new Date(cur.getFullYear(), cur.getMonth(), 1);
      render();
      showPop(btn, pop, () => { grid = null; });
    }
    btn.addEventListener('click', () => (isOpen(btn) ? closePop() : openCal()));
    btn.addEventListener('keydown', (e) => {
      if (!(grid && isOpen(btn))) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openCal(); }
        return;
      }
      const k = e.key, step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[k];
      if (step) moveTo(addDays(active, step));
      else if (k === 'PageUp' || k === 'PageDown') moveTo(addMonths(active, (k === 'PageUp' ? -1 : 1) * (e.shiftKey ? 12 : 1)));
      else if (k === 'Home') moveTo(addDays(active, -((active.getDay() - weekStart + 7) % 7)));
      else if (k === 'End') moveTo(addDays(active, 6 - ((active.getDay() - weekStart + 7) % 7)));
      else if (k === 'Enter' || k === ' ') choose(active);
      else if (k === 'Escape') closePop(true);
      else { if (k === 'Tab') closePop(); return; }
      e.preventDefault();
      e.stopPropagation();
    });
    btn.id = newId('date');
    hideSource(inp, btn, sync, ['value', 'valueAsDate', 'valueAsNumber'], HTMLInputElement.prototype, () => isOpen(btn) || openCal());
  }

  /* ---------- Time: a typeable field with a 15-minute menu ---------- */
  const fmtTime = (hm) => {
    const [h, m] = hm.split(':').map(Number);
    return F_TIME.format(new Date(2000, 0, 1, h, m));
  };
  function parseTime(s) {
    const t = String(s).trim().toLowerCase().replace(/\s+/g, '');
    if (!t) return '';
    const m = /^(\d{1,2})(?::?(\d{2}))?(?::\d{2})?(a|am|p|pm)?$/.exec(t);
    if (!m) return null;
    let h = +m[1];
    const min = +(m[2] || 0);
    if (m[3]) { if (h < 1 || h > 12) return null; h = (h % 12) + (m[3][0] === 'p' ? 12 : 0); }
    if (h > 23 || min > 59) return null;
    return `${pad(h)}:${pad(min)}`;
  }
  function enhanceTime(inp) {
    const box = d.createElement('input');
    box.type = 'text';
    box.autocomplete = 'off';
    box.inputMode = 'text';
    box.setAttribute('role', 'combobox');
    box.setAttribute('aria-haspopup', 'listbox');
    box.setAttribute('aria-expanded', 'false');
    box.setAttribute('aria-autocomplete', 'list');
    let ctl = null, typing = false;
    const sync = () => {
      mirror(inp, box, 'ui-time');
      box.placeholder = inp.placeholder || fmtTime('09:00');
      if (!typing) box.value = inp.value ? fmtTime(inp.value.slice(0, 5)) : '';
      const n = nameOf(inp);
      if (n) box.setAttribute('aria-label', n);
    };
    const commit = (v) => {
      typing = false;
      if (v == null) { box.value = inp.value ? fmtTime(inp.value.slice(0, 5)) : ''; return; }
      if (inp.value.slice(0, 5) !== v) { inp.value = v; fire(inp); }
      box.value = v ? fmtTime(v) : '';
    };
    function openList(filter) {
      const entries = [], cur = inp.value.slice(0, 5);
      let active = -1;
      for (let i = 0; i < 96; i++) {
        const v = `${pad(i >> 2)}:${pad((i & 3) * 15)}`;
        if ((inp.min && v < inp.min) || (inp.max && v > inp.max)) continue;
        const lab = fmtTime(v);
        if (filter && !lab.toLowerCase().replace(/\s/g, '').startsWith(filter) && !v.startsWith(filter)) continue;
        if (v <= cur || active < 0 && filter) active = entries.length;
        entries.push({ label: lab, value: v, selected: v === cur });
      }
      if (!entries.length) return closePop();
      ctl = openMenu(box, entries, { activeIndex: active, onClose: () => { ctl = null; }, onPick: (e) => commit(e.value) });
    }
    // The typed text is internal: apps only see events from the real time input.
    box.addEventListener('change', (e) => e.stopPropagation());
    box.addEventListener('focus', () => { if (!isOpen(box)) openList(); });
    box.addEventListener('click', () => { if (!isOpen(box)) openList(); });
    box.addEventListener('input', (e) => { e.stopPropagation(); typing = true; openList(box.value.trim().toLowerCase().replace(/\s/g, '')); });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') commit(null); // Escape throws away half-typed text
      if (ctl && isOpen(box)) {
        if (e.key === 'Enter' && ctl.active < 0) { e.preventDefault(); closePop(); commit(parseTime(box.value)); return; }
        if (menuKey(ctl, e, { typeahead: false, spacePicks: false })) return;
      } else if (e.key === 'ArrowDown') { e.preventDefault(); openList(); }
      else if (e.key === 'Enter') commit(parseTime(box.value));
    });
    box.addEventListener('blur', () => { if (!isOpen(box)) commit(parseTime(box.value)); else setTimeout(() => { if (d.activeElement !== box) { closePop(); commit(parseTime(box.value)); } }); });
    hideSource(inp, box, sync, ['value', 'valueAsNumber', 'valueAsDate'], HTMLInputElement.prototype, () => isOpen(box) || openList());
  }

  /* ---------- Datalist combobox ---------- */
  const comboDone = new WeakSet();
  const comboFired = new WeakMap(); // input -> value the kit already announced with 'change'
  // After a pick the kit fires 'change' itself; swallow the browser's own 'change' on blur
  // for the same value so apps never see it twice.
  window.addEventListener('change', (e) => {
    if (!e.isTrusted || !comboFired.has(e.target)) return;
    const v = comboFired.get(e.target);
    comboFired.delete(e.target);
    if (e.target.value === v) e.stopImmediatePropagation();
  }, true);
  function enhanceDatalist(inp) {
    if (comboDone.has(inp)) return;
    comboDone.add(inp);
    if (inp.hasAttribute('list')) inp.dataset.uiList = inp.getAttribute('list');
    inp.removeAttribute('list');
    inp.setAttribute('data-ui', '');
    inp.setAttribute('role', 'combobox');
    inp.setAttribute('aria-autocomplete', 'list');
    inp.setAttribute('aria-expanded', 'false');
    inp.autocomplete = 'off';
    let ctl = null;
    const show = () => {
      const list = d.getElementById(inp.dataset.uiList);
      const q = inp.value.trim().toLowerCase();
      const vals = list ? [...list.querySelectorAll('option')].map((o) => o.value || o.textContent).filter(Boolean) : [];
      const hits = [...new Set(vals.filter((v) => v.toLowerCase().includes(q)))].slice(0, 8);
      if (!hits.length || (hits.length === 1 && hits[0].toLowerCase() === q)) return isOpen(inp) && closePop();
      ctl = openMenu(inp, hits.map((v) => ({ label: v, value: v })), {
        onClose: () => { ctl = null; },
        onPick: (e) => { inp.value = e.value; fire(inp); comboFired.set(inp, e.value); },
      });
    };
    inp.addEventListener('focus', show);
    inp.addEventListener('input', (e) => { if (e.isTrusted) { comboFired.delete(inp); show(); } });
    inp.addEventListener('keydown', (e) => {
      if (ctl && isOpen(inp)) {
        if ((e.key === 'Enter' && ctl.active < 0) || e.key === 'Home' || e.key === 'End') return e.key === 'Enter' && closePop();
        menuKey(ctl, e, { typeahead: false, spacePicks: false });
      } else if (e.key === 'ArrowDown') { e.preventDefault(); show(); }
    });
    inp.addEventListener('blur', () => setTimeout(() => { if (isOpen(inp) && d.activeElement !== inp) closePop(); }));
  }

  /* ---------- Tooltips ---------- */
  let tip = null, tipFor = null, tipTimer = 0;
  // Turns every native title on the path into data-tip so the browser never shows its own.
  const NO_CLAIM = /^(LINK|STYLE|META|IFRAME|HTML|HEAD)$/; // title means something else there
  function claimOne(el) {
    if (NO_CLAIM.test(el.tagName)) return;
    const t = el.getAttribute('title');
    const st = el instanceof SVGElement && [...el.children].find((c) => c.tagName === 'title');
    if (t == null && !st) return;
    const text = t != null ? t : st.textContent;
    el.removeAttribute('title');
    if (st) st.remove();
    if (text.trim()) {
      el.setAttribute('data-tip', text);
      if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby') && (st || !el.textContent.trim())) el.setAttribute('aria-label', text.replace(/\s+/g, ' ').trim());
    } else el.removeAttribute('data-tip');
  }
  // Strips titles as soon as they reach the page, long before any native hover delay.
  function claimAll(root) {
    if (root === d) root = d.body;
    if (!root || root.nodeType !== 1) return;
    claimOne(root);
    root.querySelectorAll('[title]').forEach(claimOne);
    root.querySelectorAll('title').forEach((t) => t.parentNode instanceof SVGElement && claimOne(t.parentNode));
  }
  function claimTitles(start) {
    let found = null;
    for (let el = start; el && el.nodeType === 1; el = el.parentNode) {
      if (el.classList.contains('ui-pop')) return null;
      claimOne(el);
      if (!found && el.getAttribute('data-tip')) found = el;
    }
    return found;
  }
  function showTipLater(el) {
    clearTimeout(tipTimer);
    if (tipFor === el && tip) return;
    hideTip();
    tipFor = el;
    tipTimer = setTimeout(() => {
      if (!el.isConnected || isOpen(el)) return;
      tip = d.createElement('div');
      tip.className = 'ui-tip';
      tip.setAttribute('role', 'tooltip');
      tip.textContent = el.getAttribute('data-tip');
      if (!tip.textContent) { tip = null; return; }
      mount(tip, el);
      place(tip, el.getBoundingClientRect(), 6, true);
    }, 500);
  }
  function hideTip() {
    clearTimeout(tipTimer);
    if (tip) tip.remove();
    tip = tipFor = null;
  }
  // Keyboard focus shows tips; focus that follows a tap or click does not.
  let viaKeys = false, lastTouch = 0;
  d.addEventListener('keydown', () => { viaKeys = true; }, true);
  d.addEventListener('pointerdown', (e) => { viaKeys = false; if (e.pointerType !== 'mouse') lastTouch = Date.now(); }, true);
  d.addEventListener('pointerover', (e) => {
    const el = claimTitles(e.target);
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return; // never on touch
    if (el) showTipLater(el); else if (tipFor) hideTip();
  }, true);
  d.addEventListener('pointerout', (e) => {
    if (tipFor && !(e.relatedTarget instanceof Node && tipFor.contains(e.relatedTarget))) hideTip();
  }, true);
  d.addEventListener('pointerdown', hideTip, true);
  d.addEventListener('focusin', (e) => {
    const el = claimTitles(e.target);
    if (el && viaKeys && Date.now() - lastTouch > 1000 && e.target.matches(':focus-visible')) showTipLater(el); else hideTip();
  });
  d.addEventListener('focusout', () => hideTip());
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && tip) hideTip(); }, true);

  /* ---------- Validation bubbles ---------- */
  let invalidShown = false, bubble = null, bubbleFor = null, bubbleTimer = 0;
  d.addEventListener('invalid', (e) => {
    e.preventDefault();
    if (invalidShown) return;
    invalidShown = true;
    setTimeout(() => { invalidShown = false; });
    const field = e.target, target = (inst.get(field) || {}).trigger || field;
    if (bubble) bubble.remove();
    clearTimeout(bubbleTimer);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    bubbleFor = target;
    hideTip();
    bubble = d.createElement('div');
    bubble.className = 'ui-tip ui-tip-error';
    bubble.setAttribute('role', 'alert');
    bubble.textContent = field.validationMessage;
    mount(bubble, target);
    place(bubble, target.getBoundingClientRect(), 6, false);
    const b = bubble;
    bubbleTimer = setTimeout(() => b.remove(), 3000);
    const off = () => { b.remove(); field.removeEventListener('input', off); };
    field.addEventListener('input', off);
  }, true);

  /* ---------- Dialogs ---------- */
  function modal(kind, message, o = {}) {
    return new Promise((resolve) => {
      let title = o.title, msg = message == null ? '' : String(message);
      if (title == null) { const i = msg.indexOf('\n'); title = i < 0 ? msg : msg.slice(0, i); msg = i < 0 ? '' : msg.slice(i + 1).trim(); }
      const dlg = d.createElement('dialog');
      const tid = newId('title');
      dlg.className = 'ui-modal';
      dlg.setAttribute('aria-modal', 'true');
      dlg.setAttribute('aria-labelledby', tid);
      dlg.innerHTML = `<form method="dialog"><h2 class="ui-modal-title" id="${tid}"></h2><p class="ui-modal-msg"></p>
        ${kind === 'prompt' ? '<input class="ui-modal-input" type="text" autocomplete="off">' : ''}
        <div class="ui-modal-actions"><button type="submit" class="ui-btn-primary"></button>
        ${kind === 'alert' ? '' : '<button type="button" class="ui-btn-cancel"></button>'}</div></form>`;
      dlg.querySelector('h2').textContent = title;
      const p = dlg.querySelector('p');
      if (msg) { p.textContent = msg; dlg.setAttribute('aria-describedby', (p.id = newId('msg'))); } else p.remove();
      const input = dlg.querySelector('input');
      if (input) { input.value = o.value == null ? '' : o.value; input.placeholder = o.placeholder || ''; }
      const ok = dlg.querySelector('.ui-btn-primary');
      ok.textContent = o.ok || 'OK';
      if (o.danger) ok.classList.add('ui-btn-danger');
      const cancel = dlg.querySelector('.ui-btn-cancel');
      if (cancel) { cancel.textContent = o.cancel || 'Cancel'; cancel.onclick = () => dlg.close(); }
      let result = kind === 'confirm' ? false : kind === 'prompt' ? null : undefined;
      dlg.querySelector('form').addEventListener('submit', () => {
        result = kind === 'confirm' ? true : kind === 'prompt' ? input.value : undefined;
      });
      // Backdrop click = cancel (press and release both outside, so a text drag that ends outside doesn't).
      const outside = (e) => { const r = dlg.getBoundingClientRect(); return e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom); };
      let downOutside = false;
      dlg.addEventListener('pointerdown', (e) => { downOutside = outside(e); });
      dlg.addEventListener('click', (e) => { if (downOutside && outside(e)) dlg.close(); downOutside = false; });
      const prev = d.activeElement;
      // Like the native dialogs, keys and edits inside it never reach the app's own shortcuts.
      for (const t of ['input', 'change', 'keydown', 'keyup', 'keypress']) dlg.addEventListener(t, (e) => e.stopPropagation());
      dlg.addEventListener('close', () => {
        dlg.remove();
        if (prev && prev.isConnected && prev.focus) prev.focus({ preventScroll: true });
        resolve(result);
      });
      closePop();
      hideTip();
      d.body.appendChild(dlg);
      dlg.showModal();
      if (input) { input.focus(); input.select(); } else ok.focus();
    });
  }

  /* ---------- Enhancement pass ---------- */
  const TEXTY = /^(text|search|tel|url|number|)$/;
  function setup(el, fn) {
    const known = inst.get(el);
    if (known) { // element was moved: bring its trigger along
      if (el.nextElementSibling !== known.trigger) el.after(known.trigger);
      return;
    }
    if (el.hasAttribute('data-ui')) { // a clone of an enhanced element: drop the copied trigger
      const t = el.nextElementSibling;
      if (t && /\bui-(select|date|time)\b/.test(t.className)) t.remove();
      el.removeAttribute('data-ui-hidden');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('tabindex');
      el.inert = false;
    }
    fn(el);
  }
  function enhance(root = d) {
    if (!root || !root.querySelectorAll) return;
    const all = (s) => {
      const list = [...root.querySelectorAll(s)];
      if (root.nodeType === 1 && root.matches(s)) list.unshift(root);
      return list.filter((el) => !el.closest('[data-native]'));
    };
    all('select').forEach((el) => setup(el, enhanceSelect));
    all('input[type=date]').forEach((el) => setup(el, enhanceDate));
    all('input[type=time]').forEach((el) => setup(el, enhanceTime));
    all('input[list], input[data-ui-list]').forEach((el) => !el.closest('[data-ui-hidden]') && enhanceDatalist(el));
    claimAll(root);
    all('input:not([autocomplete])').forEach((el) => {
      if (TEXTY.test(el.getAttribute('type') || '')) el.autocomplete = 'off';
    });
    all('input[type=range]').forEach(rangeFill);
  }
  function rangeFill(el) {
    const lo = +el.min || 0, hi = el.max === '' ? 100 : +el.max;
    el.style.setProperty('--ui-fill', ((+el.value - lo) / ((hi - lo) || 1)) * 100 + '%');
  }
  d.addEventListener('input', (e) => { if (e.target.type === 'range') rangeFill(e.target); }, true);
  // A label click would focus the hidden control (on iOS that opens the native picker):
  // send it to the themed trigger instead.
  d.addEventListener('click', (e) => {
    const L = e.target.closest && e.target.closest('label');
    const c = L && L.control, t = c && inst.get(c);
    if (!t || e.target.closest('button,input,select,textarea,a')) return;
    e.preventDefault();
    t.trigger.focus();
  }, true);
  d.addEventListener('reset', (e) => setTimeout(() => refresh(e.target)), true);

  function refresh(el = d) {
    const one = inst.get(el);
    if (one) return one.sync();
    (el.querySelectorAll ? el.querySelectorAll('[data-ui-hidden]') : []).forEach((x) => inst.get(x) && inst.get(x).sync());
  }

  // Remember the focused trigger so a full re-render (innerHTML) can hand focus to its replacement.
  let focusedSrc = null;
  d.addEventListener('focusin', (e) => {
    const s = owner.get(e.target);
    focusedSrc = s ? { trigger: e.target, id: s.id, name: s.getAttribute('name'), form: s.form && s.form.id } : null;
  });
  const KIT = /\bui-(pop|tip|modal|select|date|time)\b/;
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'attributes') { if (r.target.getAttribute('title') != null) claimOne(r.target); continue; }
      for (const n of r.removedNodes) { // a source element removed on its own takes its trigger along
        if (n.nodeType !== 1) continue;
        const srcs = n.hasAttribute('data-ui-hidden') ? [n] : n.querySelectorAll('[data-ui-hidden]');
        for (const s of srcs) {
          const t = inst.get(s);
          if (t && !s.isConnected && t.trigger.isConnected) t.trigger.remove();
        }
      }
      for (const n of r.addedNodes) {
        if (n.nodeType !== 1 || !n.isConnected) continue;
        if (n.tagName === 'title' && n.parentNode instanceof SVGElement) claimOne(n.parentNode);
        else if (!KIT.test(n.getAttribute('class') || '')) enhance(n);
      }
    }
    if (open && !open.anchor.isConnected) closePop();
    if (tipFor && !tipFor.isConnected) hideTip();
    if (focusedSrc && !focusedSrc.trigger.isConnected) {
      const f = focusedSrc;
      focusedSrc = null;
      const ae = d.activeElement;
      if (!ae || ae === d.body || ae === d.documentElement) {
        let s = f.id ? d.getElementById(f.id) : null;
        if (!s && f.name) {
          const sc = (f.form && d.getElementById(f.form)) || d;
          s = sc.querySelector(`[data-ui-hidden][name="${CSS.escape(f.name)}"]`);
        }
        const t = s && inst.get(s);
        if (t && t.trigger.isConnected) t.trigger.focus({ preventScroll: true });
      }
    }
  });
  function start() {
    enhance(d);
    mo.observe(d.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['title'] });
    window.addEventListener('pageshow', () => refresh()); // values restored from the back/forward cache
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start, { once: true }); else start();

  window.ui = {
    confirm: (message, o) => modal('confirm', message, o),
    alert: (message, o) => modal('alert', message, o),
    prompt: (message, o) => modal('prompt', message, o),
    enhance,
    refresh,
  };
})();
