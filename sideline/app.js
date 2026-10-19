'use strict';
// Sideline: ESPN scores + Polymarket win odds, side by side.

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/football';
const GAMMA = 'https://gamma-api.polymarket.com';
const CLOB = 'https://clob.polymarket.com';
const WSS = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';

const LEAGUES = {
  cfb: { path: 'college-football', q: 'groups=80&limit=400', series: 12756 },
  nfl: { path: 'nfl', q: 'limit=100', series: 12185 },
};
// Your teams, by ESPN team id.
const MY_TEAMS = { cfb: { '99': 'LSU' }, nfl: { '18': 'Saints' } };
const SEC = new Set(['333', '8', '2', '57', '61', '96', '99', '344', '142', '201', '145', '2579', '2633', '251', '245', '238']);

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('sideline.' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('sideline.' + k, JSON.stringify(v)); } catch {} },
};

const S = {
  filter: store.get('filter') || 'all',
  offset: 0,          // weeks from the current one
  base: {},           // league -> { week, type } of ESPN's current week
  games: [],
  pm: new Map(),      // ESPN game id -> Polymarket info
  tok: new Map(),     // token id -> { gid, side }
  book: new Map(),    // token id -> { bb, ba, last } from the live socket
  kick: store.get('kick') || {}, // away token id -> price at kickoff
  hist: null,         // { id, pts: [[t, p]] } for the open sheet
  open: null,
  lastPm: 0,
  updated: null,
  wsUp: false,
};

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
const pct = p => p == null ? '–' : p < 0.005 ? '<1%' : p > 0.995 ? '>99%' : Math.round(p * 100) + '%';
const other = side => side === 'away' ? 'home' : 'away';

async function j(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(r.status + ' ' + url);
    return await r.json();
  } finally { clearTimeout(t); }
}

/* ---------- scores (ESPN) ---------- */

async function loadScores() {
  const lists = await Promise.all(Object.entries(LEAGUES).map(async ([lg, L]) => {
    const url = `${ESPN}/${L.path}/scoreboard?${L.q}`;
    try {
      if (!S.base[lg]) {
        const d = await j(url);
        S.base[lg] = { week: d.week?.number ?? 1, type: d.season?.type ?? 2 };
        if (S.offset === 0) return (d.events || []).map(e => parseGame(e, lg));
      }
      const b = S.base[lg], w = b.week + S.offset;
      if (w < 1) return [];
      const d = await j(`${url}&week=${w}&seasontype=${b.type}`);
      return (d.events || []).map(e => parseGame(e, lg));
    } catch (e) {
      console.warn(e);
      return S.games.filter(g => g.lg === lg); // keep what we had
    }
  }));
  S.games = lists.flat();
  S.updated = new Date();
}

function parseGame(ev, lg) {
  const c = ev.competitions[0];
  const st = ev.status || c.status;
  const side = x => {
    const t = x.team || {};
    return {
      id: t.id, abbr: t.abbreviation, loc: t.location, short: t.shortDisplayName, name: t.name,
      display: t.displayName, logo: t.logo, color: t.color, alt: t.alternateColor,
      score: x.score, rank: x.curatedRank?.current, record: x.records?.[0]?.summary,
      winner: x.winner, lines: (x.linescores || []).map(l => l.value),
    };
  };
  const cs = c.competitors;
  const away = side(cs.find(x => x.homeAway === 'away') || cs[1]);
  const home = side(cs.find(x => x.homeAway === 'home') || cs[0]);
  const sit = c.situation || {};
  return {
    id: ev.id, lg, date: new Date(ev.date), timeValid: c.timeValid !== false,
    state: st.type.state, detail: st.type.shortDetail, period: st.period,
    away, home, neutral: c.neutralSite,
    poss: sit.possession, rz: sit.isRedZone,
    dd: sit.downDistanceText || sit.shortDownDistanceText, lastPlay: sit.lastPlay?.text,
    tv: c.broadcasts?.[0]?.names?.[0] || c.broadcast || '', venue: c.venue?.fullName || '',
    sec: lg === 'cfb' && (SEC.has(away.id) || SEC.has(home.id)),
    mine: !!(MY_TEAMS[lg][away.id] || MY_TEAMS[lg][home.id]),
  };
}

/* ---------- odds (Polymarket) ---------- */

async function loadOdds() {
  const events = [];
  for (const [lg, L] of Object.entries(LEAGUES)) {
    const ts = S.games.filter(g => g.lg === lg).map(g => +g.date);
    if (!ts.length) continue;
    const from = new Date(Math.min(...ts) - 12 * 36e5).toISOString();
    const to = new Date(Math.max(...ts) + 12 * 36e5).toISOString();
    for (let off = 0; off < 1000; off += 100) {
      const page = await j(`${GAMMA}/events?series_id=${L.series}&end_date_min=${from}&end_date_max=${to}&limit=100&offset=${off}`);
      for (const e of page) events.push({ ...e, lg });
      if (page.length < 100) break;
    }
  }
  for (const ev of events) {
    if (ev.teams?.length !== 2 || !ev.markets?.some(m => m.sportsMarketType === 'moneyline')) continue;
    const hit = matchGame(ev);
    if (hit) S.pm.set(hit.g.id, buildPm(ev, hit.g, hit.flip));
  }
}

function espnKeys(t, lg) {
  const k = [t.loc, t.short, t.display, t.abbr];
  if (lg === 'nfl') k.push(t.name); // college nicknames repeat (Tigers, Bulldogs), so skip them
  return k.map(norm).filter(Boolean);
}
function pmKeys(t, lg) {
  const k = [t.alias, t.abbreviation];
  if (lg === 'nfl') k.push(t.name);
  return k.map(norm).filter(Boolean);
}
function teamScore(pt, et, lg) {
  const a = pmKeys(pt, lg), b = espnKeys(et, lg);
  if (a.some(x => b.includes(x))) return 3;
  if (a.some(x => x.length >= 4 && b.some(y => y.length >= 4 && (y.startsWith(x) || x.startsWith(y))))) return 1;
  return 0;
}
function matchGame(ev) {
  const start = new Date(ev.startTime || ev.endDate);
  let best = null;
  for (const g of S.games) {
    if (g.lg !== ev.lg || Math.abs(g.date - start) > 30 * 36e5) continue;
    for (const flip of [false, true]) {
      const [pa, ph] = flip ? [ev.teams[1], ev.teams[0]] : ev.teams;
      const s = teamScore(pa, g.away, g.lg) + teamScore(ph, g.home, g.lg);
      // One exact team + the date is enough: nobody plays twice in 30 hours.
      if (s >= 3 && (!best || s > best.s)) best = { g, flip, s };
    }
  }
  return best;
}

function bestLine(ms) {
  let best = null;
  for (const m of ms) {
    const p = +JSON.parse(m.outcomePrices || '[]')[0];
    if (!(p > 0)) continue;
    const d = Math.abs(p - 0.5);
    if (!best || d < best.d) best = { m, d };
  }
  return best?.m;
}

function buildPm(ev, g, flip) {
  const pmAway = ev.teams[flip ? 1 : 0], pmHome = ev.teams[flip ? 0 : 1];
  const sideOf = name => {
    const n = norm(name);
    if (pmKeys(pmAway, g.lg).includes(n) || espnKeys(g.away, g.lg).includes(n)) return 'away';
    if (pmKeys(pmHome, g.lg).includes(n) || espnKeys(g.home, g.lg).includes(n)) return 'home';
    return null;
  };
  const ml = ev.markets.find(m => m.sportsMarketType === 'moneyline');
  const outs = JSON.parse(ml.outcomes || '[]');
  const toks = JSON.parse(ml.clobTokenIds || '[]');
  const px = JSON.parse(ml.outcomePrices || '[]').map(Number);
  const s0 = sideOf(outs[0]) || other(sideOf(outs[1]) || 'home');
  const i = s0 === 'away' ? 0 : 1;
  const info = {
    slug: ev.slug, closed: !!ml.closed, vol: +ev.volume || 0,
    tok: { away: toks[i], home: toks[1 - i] },
    p: { away: px[i], home: px[1 - i] },
  };
  // Skip placeholder lines (no liquidity, parked at 50/50).
  const open = t => ev.markets.filter(m => m.sportsMarketType === t && !m.closed && m.line != null && +m.liquidityNum >= 500);
  const sp = bestLine(open('spreads'));
  if (sp) info.spread = { side: sideOf(JSON.parse(sp.outcomes)[0]), line: +sp.line };
  const tt = bestLine(open('totals'));
  if (tt) info.total = +tt.line;
  return info;
}

// Polymarket shows the midpoint unless the spread is wide, then the last trade.
function bookPrice(t) {
  const b = S.book.get(t);
  if (!b) return null;
  if (b.bb != null && b.ba != null && b.ba - b.bb <= 0.1001) return (b.bb + b.ba) / 2;
  return b.last ?? (b.bb != null && b.ba != null ? (b.bb + b.ba) / 2 : null);
}
function probs(g) {
  const pm = S.pm.get(g.id);
  if (!pm) return null;
  const a = bookPrice(pm.tok.away), h = bookPrice(pm.tok.home);
  let p = a != null && h != null ? (a + 1 - h) / 2 : a != null ? a : h != null ? 1 - h : pm.p.away;
  return pair(p);
}
// Round once so the two sides always add to 100.
function pair(p) {
  if (!(p >= 0 && p <= 1)) return null;
  const a = Math.round(p * 100);
  return { away: a / 100, home: (100 - a) / 100 };
}
function kickProb(g) {
  const pm = S.pm.get(g.id);
  const k = pm && S.kick[pm.tok.away];
  return k == null ? null : pair(k);
}

const kickQueue = new Set();
async function fetchKickoffs() {
  const todo = visibleGames().filter(g => {
    const pm = S.pm.get(g.id);
    return g.state !== 'pre' && pm?.tok.away && !(pm.tok.away in S.kick) && !kickQueue.has(pm.tok.away);
  });
  if (!todo.length) return;
  const run = async g => {
    const t = S.pm.get(g.id).tok.away;
    kickQueue.add(t);
    try {
      const k = Math.floor(g.date / 1000);
      const d = await j(`${CLOB}/prices-history?market=${t}&startTs=${k - 4 * 3600}&endTs=${k}&fidelity=10`);
      const h = d.history || [];
      S.kick[t] = h.length ? h[h.length - 1].p : null;
    } catch { /* try again next refresh */ }
    kickQueue.delete(t);
  };
  for (let i = 0; i < todo.length; i += 4) await Promise.all(todo.slice(i, i + 4).map(run));
  const keys = Object.keys(S.kick);
  if (keys.length > 600) keys.slice(0, keys.length - 600).forEach(k => delete S.kick[k]);
  store.set('kick', S.kick);
  render();
}

/* ---------- live odds socket ---------- */

let ws = null, wsKey = '', pingTimer = null, retry = 0;
function syncSocket() {
  const toks = [];
  S.tok.clear();
  for (const g of S.games) {
    const pm = S.pm.get(g.id);
    if (g.state === 'post' || !pm || pm.closed) continue;
    for (const side of ['away', 'home']) {
      const t = pm.tok[side];
      if (t) { toks.push(t); S.tok.set(t, { gid: g.id, side }); }
    }
  }
  const key = toks.slice().sort().join(',');
  if (key === wsKey && ws && ws.readyState <= 1) return;
  wsKey = key;
  closeSocket();
  if (!toks.length || document.hidden) return;
  ws = new WebSocket(WSS);
  ws.onopen = () => {
    retry = 0; S.wsUp = true; foot();
    ws.send(JSON.stringify({ assets_ids: toks, type: 'market' }));
    pingTimer = setInterval(() => ws?.readyState === 1 && ws.send('PING'), 10000);
  };
  ws.onmessage = e => {
    if (e.data === 'PONG') return;
    let m;
    try { m = JSON.parse(e.data); } catch { return; }
    const touched = new Set();
    (Array.isArray(m) ? m : [m]).forEach(x => onBook(x, touched));
    touched.forEach(patchOdds);
  };
  ws.onclose = () => {
    clearInterval(pingTimer); S.wsUp = false; foot();
    if (document.hidden) return;
    setTimeout(() => { wsKey = ''; syncSocket(); }, Math.min(30000, 1000 * 2 ** retry++));
  };
}
function closeSocket() {
  clearInterval(pingTimer);
  if (ws) { ws.onclose = null; ws.close(); ws = null; }
  S.wsUp = false;
}
function onBook(m, touched) {
  const num = v => (v == null || v === '' || +v <= 0 || +v >= 1) ? null : +v;
  const upd = (t, f) => {
    if (!S.tok.has(t)) return;
    const b = S.book.get(t) || {};
    f(b);
    S.book.set(t, b);
    touched.add(S.tok.get(t).gid);
  };
  if (m.bids && m.asks) upd(m.asset_id, b => {
    const bids = m.bids.map(x => +x.price), asks = m.asks.map(x => +x.price);
    b.bb = bids.length ? Math.max(...bids) : null;
    b.ba = asks.length ? Math.min(...asks) : null;
    if (m.last_trade_price) b.last = +m.last_trade_price;
  });
  if (m.price_changes) m.price_changes.forEach(pc => upd(pc.asset_id, b => {
    if ('best_bid' in pc) b.bb = num(pc.best_bid);
    if ('best_ask' in pc) b.ba = num(pc.best_ask);
  }));
  if (m.event_type === 'last_trade_price') upd(m.asset_id, b => { b.last = +m.price; });
}

/* ---------- rendering ---------- */

function teamColor(t) {
  for (const c of [t.color, t.alt]) {
    if (!/^[0-9a-f]{6}$/i.test(c || '')) continue;
    const n = parseInt(c, 16);
    const l = (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
    if (l > 0.1 && l < 0.85) return '#' + c;
  }
  return '#636366';
}
const isRanked = t => t.rank && t.rank <= 25;
// ESPN has dark-background versions of every logo (maroon/navy marks vanish on black).
const logo = t => t.logo
  ? `<picture><source media="(prefers-color-scheme: dark)" srcset="${esc(t.logo.replace('/500/', '/500-dark/'))}"><img src="${esc(t.logo)}" alt="" loading="lazy"></picture>`
  : `<span class="logo-ph"></span>`;

function startText(g) {
  const d = g.date, now = new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((day - today) / 864e5);
  const time = g.timeValid ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'TBD';
  const dayTxt = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff > 1 && diff < 7
    ? d.toLocaleDateString([], { weekday: 'short' }) : d.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  return `${dayTxt} ${time}`;
}

function linesText(g) {
  const pm = S.pm.get(g.id);
  if (!pm) return '';
  const out = [];
  if (pm.spread?.side) out.push(`${g[pm.spread.side].abbr} ${pm.spread.line > 0 ? '+' : ''}${pm.spread.line}`);
  if (pm.total) out.push(`O/U ${pm.total}`);
  return out.join(' · ');
}

function upset(g) {
  const k = kickProb(g);
  if (!k || g.state !== 'post') return null;
  const w = g.away.winner ? 'away' : g.home.winner ? 'home' : null;
  return w && k[w] < 0.5 ? w : null;
}

function teamRow(g, side, pr) {
  const t = g[side], o = g[other(side)];
  const lost = g.state === 'post' && o.winner;
  const poss = g.state === 'in' && g.poss && g.poss === t.id;
  const p = pr?.[side];
  let odds;
  if (p == null) odds = `<span class="odds na">${S.pm.has(g.id) || g.state === 'post' ? '' : '—'}</span>`;
  else {
    const fav = g.state !== 'post' && p >= 0.5;
    odds = `<span class="odds${fav ? ' fav' : ''}" data-side="${side}" style="--tc:${teamColor(t)}">${pct(p)}</span>`;
  }
  return `<div class="row${lost ? ' lost' : ''}">
    ${logo(t)}
    <div class="tname">${isRanked(t) ? `<span class="rank">${t.rank}</span>` : ''}<b>${esc(g.lg === 'nfl' ? t.name : t.loc)}</b>${poss ? `<span class="poss${g.rz ? ' rz' : ''}"></span>` : ''}<span class="rec">${esc(t.record || '')}</span></div>
    <span class="score">${g.state === 'pre' ? '' : esc(t.score)}</span>
    ${odds}
  </div>`;
}

function metaLeft(g) {
  if (g.state === 'pre') return esc(startText(g) + (g.tv ? ' · ' + g.tv : ''));
  if (g.state === 'in') return `<span class="live-dot">●</span> ${esc(g.detail)}${g.dd ? ' · ' + esc(g.dd) : ''}`;
  const u = upset(g);
  return esc(g.detail) + (u ? ` · <span class="upset">UPSET</span>` : '');
}
function metaRight(g, pr) {
  if (g.state === 'post') return kickProb(g) ? 'odds at kickoff' : '';
  if (g.state === 'in') {
    const k = kickProb(g);
    if (k && pr) {
      const side = pr.away >= pr.home ? 'away' : 'home';
      const d = Math.round((pr[side] - k[side]) * 100);
      if (d) return `${esc(g[side].abbr)} <span class="delta ${d > 0 ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</span> since kickoff`;
    }
  }
  return esc(linesText(g));
}

function card(g) {
  const pr = g.state === 'post' ? kickProb(g) : probs(g);
  const accent = g.mine ? teamColor(MY_TEAMS[g.lg][g.away.id] ? g.away : g.home) : '';
  const bar = pr ? `<div class="bar"><span style="flex-basis:${(pr.away * 100).toFixed(1)}%;background:${teamColor(g.away)}"></span><span style="flex:1;background:${teamColor(g.home)}"></span></div>` : '<div style="height:8px"></div>';
  return `<button class="card${g.mine ? ' mine' : ''}" data-id="${g.id}"${accent ? ` style="--accent:${accent}"` : ''}>
    ${teamRow(g, 'away', pr)}${teamRow(g, 'home', pr)}
    ${bar}
    <div class="meta"><span class="st">${metaLeft(g)}</span><span class="ln">${metaRight(g, pr)}</span></div>
  </button>`;
}

const ORDER = { in: 0, pre: 1, post: 2 };
const sortGames = gs => gs.slice().sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.date - b.date);

function sections() {
  const G = S.games, f = S.filter;
  if (f === 'all') {
    const rest = G.filter(g => !g.mine);
    return [
      ['Your teams', G.filter(g => g.mine), true],
      ['SEC', rest.filter(g => g.sec)],
      ['Top 25', rest.filter(g => g.lg === 'cfb' && !g.sec && (isRanked(g.away) || isRanked(g.home)))],
      ['NFL', rest.filter(g => g.lg === 'nfl')],
    ];
  }
  const pool = f === 'sec' ? G.filter(g => g.sec) : G.filter(g => g.lg === f);
  const days = new Map();
  for (const g of pool.slice().sort((a, b) => a.date - b.date)) {
    const k = g.date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    if (!days.has(k)) days.set(k, []);
    days.get(k).push(g);
  }
  return [...days].map(([k, gs]) => [k, gs]);
}
function visibleGames() { return sections().flatMap(s => s[1]); }

function byeNote() {
  const out = [];
  for (const [lg, teams] of Object.entries(MY_TEAMS))
    for (const [id, name] of Object.entries(teams))
      if (!S.games.some(g => g.lg === lg && (g.away.id === id || g.home.id === id))) out.push(name);
  return out.length ? `<div class="bye">${esc(out.join(' and '))}: no game this week</div>` : '';
}

function render() {
  const list = $('#list');
  if (!S.games.length) {
    list.innerHTML = `<div class="empty">${S.updated ? 'No games this week.' : 'Loading games…'}</div>`;
  } else {
    let html = '';
    for (const [title, gs, mine] of sections()) {
      if (!gs.length && !mine) continue;
      const live = gs.filter(g => g.state === 'in').length;
      html += `<h2>${esc(title)}${live ? `<small><span class="live-dot">●</span> ${live} live</small>` : ''}</h2>`;
      html += sortGames(gs).map(card).join('');
      if (mine) html += byeNote();
    }
    list.innerHTML = html || '<div class="empty">No games here this week.</div>';
  }
  document.querySelectorAll('#chips button').forEach(b => b.classList.toggle('on', b.dataset.f === S.filter));
  weekLabel();
  foot();
  if (S.open) renderSheet();
}

function weekLabel() {
  const el = $('#weekLabel');
  if (S.offset === 0) { el.textContent = 'This week'; return; }
  const ts = S.games.map(g => +g.date);
  if (!ts.length) { el.textContent = (S.offset > 0 ? '+' : '') + S.offset + ' wk'; return; }
  const a = new Date(Math.min(...ts)), b = new Date(Math.max(...ts));
  const m = d => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  el.textContent = a.getMonth() === b.getMonth() ? `${m(a)}–${b.getDate()}` : `${m(a)}–${m(b)}`;
}

function foot() {
  const t = S.updated ? S.updated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  $('#foot').innerHTML = `Scores ESPN · Odds Polymarket${S.wsUp ? ' (live)' : ''}${t ? ' · updated ' + t : ''}`;
}

// Live socket ticks: update just the numbers, no full re-render.
function patchOdds(gid) {
  const g = S.games.find(x => x.id === gid);
  if (!g) return;
  const pr = probs(g);
  const el = document.querySelector(`.card[data-id="${gid}"]`);
  if (el && pr) {
    el.querySelectorAll('.odds[data-side]').forEach(o => {
      const side = o.dataset.side, txt = pct(pr[side]);
      if (o.textContent !== txt) {
        const up = parseFloat(txt) > parseFloat(o.textContent);
        o.textContent = txt;
        o.classList.toggle('fav', pr[side] >= 0.5);
        o.classList.remove('flash-up', 'flash-dn');
        void o.offsetWidth;
        o.classList.add(up ? 'flash-up' : 'flash-dn');
      }
    });
    const bar = el.querySelector('.bar span');
    if (bar) bar.style.flexBasis = (pr.away * 100).toFixed(1) + '%';
    const ln = el.querySelector('.ln');
    if (ln) ln.innerHTML = metaRight(g, pr);
  }
  if (S.open === gid && pr) {
    if (S.hist?.id === gid && g.state === 'in') S.hist.pts.push([Date.now() / 1000, pr.away]);
    renderSheet();
  }
}

/* ---------- detail sheet ---------- */

function openSheet(id) {
  S.open = id;
  S.hist = null;
  $('#sheet').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#sheet').scrollTop = 0;
  history.pushState({ sheet: id }, '');
  renderSheet();
  loadHistory(id);
}
function closeSheet() {
  S.open = null;
  $('#sheet').hidden = true;
  document.body.style.overflow = '';
}

async function loadHistory(id) {
  const g = S.games.find(x => x.id === id), pm = S.pm.get(id);
  if (!g || !pm?.tok.away) return;
  const k = Math.floor(g.date / 1000), now = Math.floor(Date.now() / 1000);
  const url = g.state === 'pre'
    ? `${CLOB}/prices-history?market=${pm.tok.away}&interval=1w&fidelity=60`
    : `${CLOB}/prices-history?market=${pm.tok.away}&startTs=${k - 3600}&endTs=${Math.min(now, k + 6 * 3600)}&fidelity=1`;
  try {
    const d = await j(url);
    if (S.open !== id) return;
    S.hist = { id, pts: (d.history || []).map(x => [x.t, x.p]) };
  } catch { S.hist = { id, pts: [] }; }
  renderSheet();
}

function chartSvg(g, pts) {
  if (!pts || pts.length < 2) return `<div class="empty" style="padding:28px 0">${pts ? 'No odds history yet' : 'Loading…'}</div>`;
  const W = 340, H = 150, P = 6;
  const t0 = pts[0][0], t1 = pts[pts.length - 1][0];
  const x = t => P + (t - t0) / (t1 - t0 || 1) * (W - 2 * P);
  const y = p => P + (1 - p) * (H - 2 * P);
  const line = pts.map((q, i) => (i ? 'L' : 'M') + x(q[0]).toFixed(1) + ',' + y(q[1]).toFixed(1)).join('');
  const area = `${line}L${x(t1).toFixed(1)},${y(0.5)}L${x(t0).toFixed(1)},${y(0.5)}Z`;
  const k = g.date / 1000;
  const ko = k > t0 && k < t1 ? `<line x1="${x(k)}" x2="${x(k)}" y1="${P}" y2="${H - P}" stroke="var(--faint)" stroke-dasharray="3 3"/><text class="axis" x="${x(k) + 4}" y="${H - P - 2}">kickoff</text>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Win odds over time">
    <defs>
      <clipPath id="ctop"><rect x="0" y="0" width="${W}" height="${y(0.5)}"/></clipPath>
      <clipPath id="cbot"><rect x="0" y="${y(0.5)}" width="${W}" height="${H}"/></clipPath>
    </defs>
    <path d="${area}" fill="${teamColor(g.away)}" opacity=".35" clip-path="url(#ctop)"/>
    <path d="${area}" fill="${teamColor(g.home)}" opacity=".35" clip-path="url(#cbot)"/>
    <line x1="${P}" x2="${W - P}" y1="${y(0.5)}" y2="${y(0.5)}" stroke="var(--faint)" stroke-dasharray="2 4"/>
    ${ko}
    <path d="${line}" fill="none" stroke="var(--text)" stroke-width="2" stroke-linejoin="round"/>
    <text class="axis" x="${P + 2}" y="${P + 10}">${esc(g.away.abbr)} 100%</text>
    <text class="axis" x="${P + 2}" y="${H - P - 2}">${esc(g.home.abbr)} 100%</text>
  </svg>`;
}

function renderSheet() {
  const g = S.games.find(x => x.id === S.open);
  const body = $('#sheetBody');
  if (!g) { body.innerHTML = '<div class="empty">Game not found.</div>'; return; }
  const pm = S.pm.get(g.id);
  const pr = g.state === 'post' ? kickProb(g) : probs(g);
  const side = s => {
    const t = g[s];
    return `<div>${logo(t)}<div class="nm">${isRanked(t) ? `<span class="rank">${t.rank}</span> ` : ''}${esc(t.short || t.loc)}</div><div class="sub">${esc(t.record || '')}</div></div>`;
  };
  const sc = s => `<span class="${g.state === 'post' && g[other(s)].winner ? 'lost' : ''}">${esc(g[s].score)}</span>`;
  const mid = g.state === 'pre'
    ? `<div class="mid"><div class="stat" style="font-size:15px;color:var(--text);font-weight:600">${esc(startText(g))}</div><div class="stat">${esc(g.tv)}</div></div>`
    : `<div class="mid"><div class="big">${sc('away')} – ${sc('home')}</div><div class="stat">${g.state === 'in' ? '<span class="live-dot">●</span> ' : ''}${esc(g.detail)}</div></div>`;

  let html = `<div class="hero">${side('away')}${mid}${side('home')}</div>`;

  if (pm) {
    const label = g.state === 'post' ? 'Win odds at kickoff' : 'Win odds';
    html += `<div class="box"><h3>${label}</h3>
      <div class="probs">
        <div><div class="p" style="color:${teamColor(g.away)}">${pct(pr?.away)}</div><div class="who">${esc(g.away.abbr)}</div></div>
        <div style="text-align:right"><div class="p" style="color:${teamColor(g.home)}">${pct(pr?.home)}</div><div class="who">${esc(g.home.abbr)}</div></div>
      </div>
      <div class="chart">${chartSvg(g, S.hist?.id === g.id ? S.hist.pts : null)}</div>
    </div>`;
    const kv = [];
    if (g.state === 'in' && kickProb(g)) kv.push(['At kickoff', `${g.away.abbr} ${pct(kickProb(g).away)}`]);
    if (pm.spread?.side) kv.push(['Spread', `${g[pm.spread.side].abbr} ${pm.spread.line > 0 ? '+' : ''}${pm.spread.line}`]);
    if (pm.total) kv.push(['Total', `O/U ${pm.total}`]);
    if (pm.vol) kv.push(['Traded', '$' + (pm.vol >= 1e6 ? (pm.vol / 1e6).toFixed(1) + 'M' : pm.vol >= 1e3 ? Math.round(pm.vol / 1e3) + 'K' : Math.round(pm.vol))]);
    if (kv.length) html += `<div class="box"><h3>Market</h3><div class="kv">${kv.map(([a, b]) => `<span>${esc(a)}</span><span>${esc(b)}</span>`).join('')}</div></div>`;
  } else {
    html += `<div class="box"><h3>Win odds</h3><div class="play" style="color:var(--dim)">No Polymarket market for this game.</div></div>`;
  }

  if (g.state === 'in' && (g.dd || g.lastPlay)) {
    html += `<div class="box"><h3>${esc(g.dd || 'Last play')}</h3><div class="play">${esc(g.lastPlay || '')}</div></div>`;
  }

  const n = Math.max(g.away.lines.length, g.home.lines.length);
  if (g.state !== 'pre' && n) {
    const head = Array.from({ length: n }, (_, i) => `<th>${i < 4 ? i + 1 : 'OT'}</th>`).join('');
    const row = s => `<tr><td>${esc(g[s].abbr)}</td>${Array.from({ length: n }, (_, i) => `<td>${g[s].lines[i] ?? ''}</td>`).join('')}<td>${esc(g[s].score)}</td></tr>`;
    html += `<div class="box"><h3>Scoring</h3><table class="ls"><tr><th></th>${head}<th>T</th></tr>${row('away')}${row('home')}</table></div>`;
  }

  const info = [['Kickoff', g.date.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })]];
  if (g.venue) info.push(['Stadium', g.venue]);
  if (g.tv) info.push(['TV', g.tv]);
  html += `<div class="box"><h3>Info</h3><div class="kv">${info.map(([a, b]) => `<span>${esc(a)}</span><span>${esc(b)}</span>`).join('')}</div></div>`;

  html += `<div class="links">
    ${pm ? `<a href="https://polymarket.com/event/${encodeURIComponent(pm.slug)}" target="_blank" rel="noopener">Polymarket</a>` : ''}
    <a href="https://www.espn.com/${g.lg === 'nfl' ? 'nfl' : 'college-football'}/game/_/gameId/${encodeURIComponent(g.id)}" target="_blank" rel="noopener">ESPN</a>
  </div>`;
  body.innerHTML = html;
}

/* ---------- refresh loop ---------- */

let timer = null, busy = false;
async function refresh(full) {
  if (busy) return;
  busy = true;
  try {
    await loadScores();
    render();
    if (full || Date.now() - S.lastPm > 60e3) {
      try { await loadOdds(); S.lastPm = Date.now(); } catch (e) { console.warn(e); }
      render();
    }
    syncSocket();
    fetchKickoffs();
  } finally {
    busy = false;
    schedule();
  }
}
function schedule() {
  clearTimeout(timer);
  if (document.hidden) return;
  const now = Date.now();
  const live = S.games.some(g => g.state === 'in');
  const soon = S.games.some(g => g.state === 'pre' && g.date - now < 20 * 6e4);
  timer = setTimeout(() => refresh(false), live ? 15e3 : soon ? 30e3 : 120e3);
}

function changeWeek(delta) {
  S.offset = delta === 0 ? 0 : S.offset + delta;
  S.games = []; S.pm.clear(); S.book.clear(); S.updated = null;
  closeSocket(); wsKey = '';
  render();
  refresh(true);
}

$('#chips').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  S.filter = b.dataset.f;
  store.set('filter', S.filter);
  render();
  window.scrollTo(0, 0);
  fetchKickoffs();
});
$('#prev').onclick = () => changeWeek(-1);
$('#next').onclick = () => changeWeek(1);
$('#weekLabel').onclick = () => S.offset && changeWeek(0);
$('#list').addEventListener('click', e => {
  const c = e.target.closest('.card');
  if (c) openSheet(c.dataset.id);
});
$('#close').onclick = () => history.state?.sheet ? history.back() : closeSheet();
addEventListener('popstate', () => { if (S.open) closeSheet(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clearTimeout(timer); closeSocket(); }
  else { wsKey = ''; refresh(Date.now() - S.lastPm > 60e3); }
});

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
render();
refresh(true);
