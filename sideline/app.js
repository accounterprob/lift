'use strict';
// Sideline: ESPN scores + Polymarket win odds, side by side.

// Bumped by deploy.sh on every publish; shown next to the title.
const VERSION = 4;

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
  exp: null,         // { id, range, side } of the game expanded in the list
  lastPm: 0,
  lastLines: 0,
  updated: null,
  wsUp: false,
};

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
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
      score: x.score, rank: x.curatedRank?.current, record: x.records?.[0]?.summary, winner: x.winner,
    };
  };
  const cs = c.competitors;
  const away = side(cs.find(x => x.homeAway === 'away') || cs[1]);
  const home = side(cs.find(x => x.homeAway === 'home') || cs[0]);
  const sit = c.situation || {};
  return {
    id: ev.id, lg, date: new Date(ev.date), timeValid: c.timeValid !== false,
    state: st.type.state, detail: st.type.shortDetail,
    away, home,
    poss: sit.possession, rz: sit.isRedZone,
    dd: sit.downDistanceText || sit.shortDownDistanceText,
    tv: c.broadcasts?.[0]?.names?.[0] || c.broadcast || '',
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

// The point spread moves during a game, so live games re-read it more often.
async function loadLiveLines() {
  const live = S.games.filter(g => g.state === 'in' && S.pm.has(g.id));
  for (let i = 0; i < live.length; i += 20) {
    const chunk = live.slice(i, i + 20);
    const evs = await j(`${GAMMA}/events?${chunk.map(g => 'slug=' + encodeURIComponent(S.pm.get(g.id).slug)).join('&')}`);
    for (const ev of evs) {
      const g = chunk.find(x => S.pm.get(x.id).slug === ev.slug);
      if (g) S.pm.get(g.id).spread = buildPm(ev, g, S.pm.get(g.id).flip).spread;
    }
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
    slug: ev.slug, flip, closed: !!ml.closed,
    tok: { away: toks[i], home: toks[1 - i] },
    p: { away: px[i], home: px[1 - i] },
  };
  // The main line is the one the market prices closest to 50/50.
  // Skip placeholder lines (no liquidity, parked at 50/50).
  const sp = bestLine(ev.markets.filter(m => m.sportsMarketType === 'spreads' && !m.closed && m.line != null && +m.liquidityNum >= 500));
  if (sp) info.spread = { side: sideOf(JSON.parse(sp.outcomes)[0]), line: +sp.line };
  return info;
}

// Polymarket shows the midpoint unless the spread is wide, then the last trade.
function bookPrice(t) {
  const b = S.book.get(t);
  if (!b) return null;
  if (b.bb != null && b.ba != null && b.ba - b.bb <= 0.1001) return (b.bb + b.ba) / 2;
  return b.last ?? (b.bb != null && b.ba != null ? (b.bb + b.ba) / 2 : null);
}
// Unrounded chance the away team wins.
function rawProb(g) {
  const pm = S.pm.get(g.id);
  if (!pm) return null;
  const a = bookPrice(pm.tok.away), h = bookPrice(pm.tok.home);
  const p = a != null && h != null ? (a + 1 - h) / 2 : a != null ? a : h != null ? 1 - h : pm.p.away;
  return p >= 0 && p <= 1 ? p : null;
}
const probs = g => pair(rawProb(g));
// Round once so the two sides always add to 100.
function pair(p) {
  if (p == null || !(p >= 0 && p <= 1)) return null;
  const a = Math.round(p * 100);
  return { away: a / 100, home: (100 - a) / 100 };
}
function kickProb(g) {
  const pm = S.pm.get(g.id);
  const k = pm && S.kick[pm.tok.away];
  return k == null ? null : pair(k);
}

// Finished games show the odds at kickoff.
const kickQueue = new Set();
async function fetchKickoffs() {
  const todo = visibleGames().filter(g => {
    const pm = S.pm.get(g.id);
    return g.state === 'post' && pm?.tok.away && !(pm.tok.away in S.kick) && !kickQueue.has(pm.tok.away);
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

/* ---------- list ---------- */

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
const teamName = (g, t) => g.lg === 'nfl' ? t.name : t.loc;
// ESPN has dark-background versions of every logo (maroon/navy marks vanish on black).
const logo = t => t.logo
  ? `<picture><source media="(prefers-color-scheme: dark)" srcset="${esc(t.logo.replace('/500/', '/500-dark/'))}"><img src="${esc(t.logo)}" alt=""></picture>`
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

// "LSU by 8.5": who the point spread favors, and by how much.
function favText(g) {
  const sp = S.pm.get(g.id)?.spread;
  if (!sp?.side || !sp.line) return '';
  const fav = sp.line < 0 ? sp.side : other(sp.side);
  return `${g[fav].abbr} by ${Math.abs(sp.line)}`;
}

function teamRow(g, side, pr) {
  const t = g[side];
  const lost = g.state === 'post' && g[other(side)].winner;
  const poss = g.state === 'in' && g.poss && g.poss === t.id;
  const p = pr?.[side];
  const odds = p == null ? '<span class="odds na"></span>'
    : `<span class="odds${g.state !== 'post' && p >= 0.5 ? ' fav' : ''}" data-side="${side}" style="--tc:${teamColor(t)}">${pct(p)}</span>`;
  return `<div class="row${lost ? ' lost' : ''}">
    ${logo(t)}
    <div class="tname">${isRanked(t) ? `<span class="rank">${t.rank}</span>` : ''}<b>${esc(teamName(g, t))}</b>${poss ? `<span class="poss${g.rz ? ' rz' : ''}"></span>` : ''}<span class="rec">${esc(t.record || '')}</span></div>
    <span class="score">${g.state === 'pre' ? '' : esc(t.score)}</span>
    ${odds}
  </div>`;
}

function statusText(g) {
  if (g.state === 'pre') return esc(startText(g) + (g.tv ? ' · ' + g.tv : ''));
  if (g.state === 'in') return `<span class="live-dot">●</span> ${esc(g.detail)}${g.dd ? ' · ' + esc(g.dd) : ''}`;
  return esc(g.detail);
}
const rightText = g => g.state === 'post' ? (kickProb(g) ? 'pregame odds' : '') : esc(favText(g));

function cardMain(g) {
  const pr = g.state === 'post' ? kickProb(g) : probs(g);
  const bar = pr ? `<div class="bar"><span style="flex-basis:${(pr.away * 100).toFixed(1)}%;background:${teamColor(g.away)}"></span><span style="flex:1;background:${teamColor(g.home)}"></span></div>` : '<div class="bar off"></div>';
  return `${teamRow(g, 'away', pr)}${teamRow(g, 'home', pr)}
    ${bar}
    <div class="meta"><span class="st">${statusText(g)}</span><span class="ln">${rightText(g)}</span></div>`;
}
function card(g) {
  const accent = g.mine ? teamColor(MY_TEAMS[g.lg][g.away.id] ? g.away : g.home) : '';
  const h = cardMain(g);
  cardHtml.set(g.id, h);
  return `<div class="card${g.mine ? ' mine' : ''}" data-id="${g.id}"${accent ? ` style="--accent:${accent}"` : ''}>
    <div class="card-main" role="button" tabindex="0">${h}</div>
    <div class="xp"><div class="xp-in"></div></div>
  </div>`;
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
  return [...days];
}
function visibleGames() { return sections().flatMap(s => s[1]); }

function byeNote() {
  const out = [];
  for (const [lg, teams] of Object.entries(MY_TEAMS))
    for (const [id, name] of Object.entries(teams))
      if (!S.games.some(g => g.lg === lg && (g.away.id === id || g.home.id === id))) out.push(name);
  return out.length ? `<div class="bye">${esc(out.join(' and '))}: no game this week</div>` : '';
}

// Rebuild the list only when its layout changes; otherwise refresh just the cards
// whose contents changed, so scrolling, taps and an open chart aren't disturbed.
let listKey = '';
const cardHtml = new Map();
function render() {
  document.querySelectorAll('#chips button').forEach(b => b.classList.toggle('on', b.dataset.f === S.filter));
  weekLabel();
  foot();
  const list = $('#list');
  if (!S.games.length) {
    listKey = '';
    list.innerHTML = `<div class="empty">${S.updated ? 'No games this week.' : 'Loading games…'}</div>`;
    return;
  }
  const secs = sections().filter(([, gs, mine]) => gs.length || mine).map(([t, gs, mine]) => [t, sortGames(gs), mine]);
  const key = S.filter + '|' + secs.map(([t, gs]) => t + ':' + gs.map(g => g.id + g.state).join(',')).join('|') + byeNote();
  if (key !== listKey) {
    listKey = key;
    cardHtml.clear();
    let html = '';
    for (const [title, gs, mine] of secs) {
      const live = gs.filter(g => g.state === 'in').length;
      html += `<h2>${esc(title)}${live ? `<small><span class="live-dot">●</span> ${live} live</small>` : ''}</h2>`;
      html += gs.map(card).join('');
      if (mine) html += byeNote();
    }
    list.innerHTML = html || '<div class="empty">No games here this week.</div>';
    if (S.exp) mountExpand(false);
    return;
  }
  for (const [, gs] of secs) for (const g of gs) {
    const h = cardMain(g);
    if (cardHtml.get(g.id) === h) continue;
    const el = list.querySelector(`.card[data-id="${g.id}"] .card-main`);
    if (el) el.innerHTML = h;
    cardHtml.set(g.id, h);
  }
  if (S.exp) drawChart();
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
  $('#foot').textContent = `Scores ESPN · Odds Polymarket${S.wsUp ? ' (live)' : ''}${t ? ' · updated ' + t : ''}`;
}

// Every live price, to the second, for every game this week (away team's chance).
// This is what lets the short chart ranges move second by second.
const ticks = new Map();
function recordTick(g) {
  const p = rawProb(g);
  if (p == null) return;
  const now = Math.floor(Date.now() / 1000);
  let a = ticks.get(g.id);
  if (!a) ticks.set(g.id, a = []);
  const last = a[a.length - 1];
  if (last && last[0] === now) last[1] = p;
  else if (!last || last[1] !== p) a.push([now, p]);
  if (a.length > 20000) a.splice(0, a.length - 20000);
}

// Live socket ticks: touch only the numbers that changed.
function patchOdds(gid) {
  const g = S.games.find(x => x.id === gid);
  if (!g) return;
  recordTick(g);
  const pr = probs(g);
  const el = document.querySelector(`.card[data-id="${gid}"] .card-main`);
  if (el && pr) {
    el.querySelectorAll('.odds[data-side]').forEach(o => {
      const txt = pct(pr[o.dataset.side]);
      if (o.textContent === txt) return;
      flash(o, parseFloat(txt) > parseFloat(o.textContent));
      o.textContent = txt;
      o.classList.toggle('fav', pr[o.dataset.side] >= 0.5);
    });
    const bar = el.querySelector('.bar span');
    if (bar) bar.style.flexBasis = (pr.away * 100).toFixed(1) + '%';
  }
  if (S.exp?.id === gid) drawChart();
}
function flash(el, up) {
  el.classList.remove('flash-up', 'flash-dn');
  void el.offsetWidth;
  el.classList.add(up ? 'flash-up' : 'flash-dn');
}

/* ---------- expanded game: odds chart ---------- */

// Time ranges, like Polymarket's. The two short ones run off live ticks.
const RANGES = {
  '5M': { sec: 300, fid: 1, span: 3600 },
  '1H': { sec: 3600, fid: 1, span: 3600 },
  '6H': { sec: 21600, fid: 1, span: 21600 },
  '1D': { sec: 86400, fid: 5, span: 86400 },
  '1W': { sec: 604800, fid: 30, span: 604800 },
  'MAX': { sec: 0, fid: 60 },
};
const histCache = new Map(); // `${token}|${range}` -> { at, pts, loading }
let expTimer = null, scrubT = null, geo = null;

// A finished game's chart ends when the game did, not now.
const chartEnd = g => g.state === 'post' ? Math.min(Date.now() / 1000, g.date / 1000 + 5 * 3600) : Date.now() / 1000;

function defaultRange(g) {
  if (g.state === 'in') return '1H';
  if (g.state === 'post') return '6H';
  return g.date - Date.now() < 864e5 ? '1D' : '1W';
}
function defaultSide(g) {
  const mine = MY_TEAMS[g.lg];
  if (mine[g.away.id]) return 'away';
  if (mine[g.home.id]) return 'home';
  const pr = probs(g);
  return pr && pr.home > pr.away ? 'home' : 'away';
}

function toggleExpand(id) {
  const prev = S.exp?.id;
  if (prev) collapse(prev);
  if (prev === id) { S.exp = null; stopExpTimer(); return; }
  const g = S.games.find(x => x.id === id);
  if (!g) return;
  S.exp = { id, range: defaultRange(g), side: defaultSide(g) };
  mountExpand(true);
}
function collapse(id) {
  const el = document.querySelector(`.card[data-id="${id}"]`);
  if (!el) return;
  el.classList.remove('open');
  setTimeout(() => { if (!el.classList.contains('open')) el.querySelector('.xp-in').innerHTML = ''; }, 300);
}
function stopExpTimer() { clearInterval(expTimer); expTimer = null; }

function mountExpand(animate) {
  const g = S.games.find(x => x.id === S.exp?.id);
  const el = g && document.querySelector(`.card[data-id="${g.id}"]`);
  if (!el) { S.exp = null; stopExpTimer(); return; }
  const inner = el.querySelector('.xp-in');
  if (!S.pm.has(g.id)) {
    inner.innerHTML = '<div class="none">No Polymarket odds for this game.</div>';
  } else {
    inner.innerHTML = `
      <div class="xp-head"><div class="xp-now" id="xv"></div></div>
      <div class="chart" id="xc"></div>
      <div class="xp-ctl">
        <div class="seg" id="xr">${Object.keys(RANGES).filter(r => g.state !== 'post' || !['5M', '1H'].includes(r)).map(r => `<button data-r="${r}">${r}</button>`).join('')}</div>
        <div class="seg" id="xs">${['away', 'home'].map(s => `<button data-s="${s}">${esc(g[s].abbr)}</button>`).join('')}</div>
      </div>`;
    bindChart(inner.querySelector('#xc'));
    loadRange(g);
    drawChart();
  }
  if (animate) {
    void el.offsetWidth;
    el.classList.add('open');
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      if (r.bottom > innerHeight - 20) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 260);
  } else el.classList.add('open');
  // Redraw every second so the line keeps flowing up to "now" between price changes.
  stopExpTimer();
  if (g.state !== 'post') expTimer = setInterval(() => { if (!document.hidden) drawChart(); }, 1000);
}

async function loadRange(g, force) {
  const pm = S.pm.get(g.id), R = RANGES[S.exp.range];
  const key = pm.tok.away + '|' + S.exp.range;
  const c = histCache.get(key);
  if (c && (c.loading || (!force && Date.now() - c.at < 60e3))) return;
  histCache.set(key, { at: Date.now(), pts: c?.pts || [], loading: true });
  const end = Math.floor(chartEnd(g));
  const url = R.sec
    ? `${CLOB}/prices-history?market=${pm.tok.away}&startTs=${end - R.span}&endTs=${end}&fidelity=${R.fid}`
    : `${CLOB}/prices-history?market=${pm.tok.away}&interval=max&fidelity=${R.fid}`;
  let pts = c?.pts || [];
  try { pts = ((await j(url)).history || []).map(x => [x.t, x.p]); } catch {}
  histCache.set(key, { at: Date.now(), pts });
  drawChart();
}

// History from the server (minute-level) plus our own per-second ticks after it.
function seriesFor(g) {
  const pm = S.pm.get(g.id), R = RANGES[S.exp.range];
  const c = histCache.get(pm.tok.away + '|' + S.exp.range);
  const end = chartEnd(g);
  const start = R.sec ? end - R.sec : -Infinity;
  const hist = (c?.pts || []).filter(q => q[0] >= start && q[0] <= end);
  const lastT = hist.length ? hist[hist.length - 1][0] : start;
  const live = (ticks.get(g.id) || []).filter(q => q[0] > lastT && q[0] >= start);
  let pts = hist.concat(live);
  // Carry the price in from before the window so the line starts at the left edge.
  if (R.sec && pts.length && pts[0][0] > start) {
    const before = (c?.pts || []).filter(q => q[0] < start).pop() || (ticks.get(g.id) || []).filter(q => q[0] < start).pop();
    if (before) pts.unshift([start, before[1]]);
  }
  if (g.state !== 'post') {
    const p = rawProb(g);
    if (p != null) pts.push([end, p]);
  }
  return { pts, start: R.sec ? start : (pts[0]?.[0] ?? end), end, loading: c?.loading };
}

let drawQueued = false;
function drawChart() {
  if (drawQueued) return;
  drawQueued = true;
  setTimeout(() => {
    drawQueued = false;
    const g = S.games.find(x => x.id === S.exp?.id), box = $('#xc');
    if (!g || !box) return;
    if (!histCache.has(S.pm.get(g.id).tok.away + '|' + S.exp.range) || Date.now() - histCache.get(S.pm.get(g.id).tok.away + '|' + S.exp.range).at > 60e3) loadRange(g);
    const sr = seriesFor(g);
    box.innerHTML = chartSvg(g, sr);
    drawHead(g, sr);
    document.querySelectorAll('#xr button').forEach(b => b.classList.toggle('on', b.dataset.r === S.exp.range));
    document.querySelectorAll('#xs button').forEach(b => b.classList.toggle('on', b.dataset.s === S.exp.side));
  }, 30);
}

const val = (p, side) => side === 'away' ? p : 1 - p;
const pct1 = v => (v * 100).toFixed(1) + '%';

function drawHead(g, sr) {
  const side = S.exp.side, t = g[side];
  const pts = sr.pts;
  let html;
  if (scrubT != null && pts.length) {
    const q = pointAt(pts, scrubT);
    html = `<b>${esc(t.abbr)} ${pct1(val(q[1], side))}</b><span class="when">${esc(fmtScrub(q[0]))}</span>`;
  } else if (pts.length) {
    const now = val(pts[pts.length - 1][1], side), then = val(pts[0][1], side);
    const d = (now - then) * 100;
    const label = g.state === 'post' && S.exp.range !== 'MAX' ? '' : S.exp.range === 'MAX' ? 'all time' : 'past ' + S.exp.range.toLowerCase().replace('m', ' min').replace('h', ' hr').replace('d', ' day').replace('w', ' wk');
    html = `<b>${esc(t.abbr)} ${pct1(now)}</b>` +
      (Math.abs(d) >= 0.05 ? `<span class="chg ${d > 0 ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'}${Math.abs(d).toFixed(1)}</span>` : '<span class="chg">no change</span>') +
      (label ? `<span class="when">${label}</span>` : '');
  } else html = `<b>${esc(t.abbr)}</b>`;
  $('#xv').innerHTML = html;
}

function pointAt(pts, t) {
  let q = pts[0];
  for (const p of pts) { if (p[0] > t) break; q = p; }
  return q;
}
function fmtScrub(t) {
  const d = new Date(t * 1000), R = S.exp.range;
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: R === '5M' || R === '1H' ? '2-digit' : undefined });
  return R === '1W' || R === 'MAX' ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + time : time;
}
function fmtAxis(t) {
  const d = new Date(t * 1000), R = S.exp.range;
  if (R === '5M') return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }).replace(/\s?[AP]M$/i, '');
  if (R === '1W') return d.toLocaleDateString([], { weekday: 'short' });
  if (R === 'MAX') return d.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?([AP])M$/i, (_, a) => a.toLowerCase());
}

function chartSvg(g, sr) {
  const side = S.exp.side, color = teamColor(g[side]);
  const pts = sr.pts.map(q => [q[0], val(q[1], side)]);
  if (pts.length < 2) return `<div class="none">${sr.loading ? 'Loading…' : 'No odds history yet'}</div>`;
  const W = 340, H = 190, L = 2, R = 38, T = 8, B = 20;
  const t0 = sr.start, t1 = sr.end;
  // Zoom the y-axis to the window so small moves are visible, like Polymarket.
  let lo = Math.min(...pts.map(q => q[1])), hi = Math.max(...pts.map(q => q[1]));
  const pad = Math.max((hi - lo) * 0.15, 0.005);
  lo -= pad; hi += pad;
  if (hi - lo < 0.04) { const m = (hi + lo) / 2; lo = m - 0.02; hi = m + 0.02; }
  lo = Math.max(0, lo); hi = Math.min(1, hi);
  const x = t => L + (t - t0) / (t1 - t0 || 1) * (W - L - R);
  const y = v => T + (hi - v) / (hi - lo || 1) * (H - T - B);
  geo = { x0: L, x1: W - R, t0, t1, W };
  const d = pts.map((q, i) => (i ? 'L' : 'M') + x(q[0]).toFixed(1) + ',' + y(q[1]).toFixed(1)).join('');
  const area = `${d}L${x(pts[pts.length - 1][0]).toFixed(1)},${H - B}L${x(pts[0][0]).toFixed(1)},${H - B}Z`;
  // Gridlines at round percentages.
  const span = (hi - lo) * 100;
  const step = [0.5, 1, 2, 5, 10, 20, 25].find(s => span / s <= 4) || 25;
  let grid = '';
  for (let v = Math.ceil(lo * 100 / step) * step; v <= hi * 100 + 1e-9; v += step) {
    const yy = y(v / 100);
    grid += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="grid"/><text class="axis" x="${W - R + 5}" y="${yy + 3}">${+v.toFixed(1)}%</text>`;
  }
  let xt = '';
  for (let i = 0; i < 4; i++) {
    const t = t0 + (t1 - t0) * (i + 0.5) / 4;
    xt += `<text class="axis" x="${x(t)}" y="${H - 5}" text-anchor="middle">${esc(fmtAxis(t))}</text>`;
  }
  const k = g.date / 1000;
  const ko = k > t0 && k < t1 ? `<line x1="${x(k)}" x2="${x(k)}" y1="${T}" y2="${H - B}" class="ko"/>` : '';
  const [lx, ly] = [x(pts[pts.length - 1][0]), y(pts[pts.length - 1][1])];
  let scrub = '';
  if (scrubT != null) {
    const q = pointAt(pts, scrubT), sx = x(Math.max(t0, Math.min(t1, scrubT)));
    scrub = `<line x1="${sx}" x2="${sx}" y1="${T}" y2="${H - B}" class="scrub"/><circle cx="${sx}" cy="${y(q[1])}" r="4.5" fill="${color}" stroke="var(--card)" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Win odds over time">
    <defs><linearGradient id="xg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    ${grid}${ko}
    <path d="${area}" fill="url(#xg)"/>
    <path d="${d}" fill="none" stroke="${color}" class="line"/>
    ${g.state !== 'post' && scrubT == null ? `<circle class="pulse" cx="${lx}" cy="${ly}" r="7" fill="${color}"/><circle cx="${lx}" cy="${ly}" r="3.5" fill="${color}"/>` : ''}
    ${scrub}${xt}
  </svg>`;
}

// Drag across the chart to read the odds at any moment, like Polymarket.
function bindChart(box) {
  const move = e => {
    if (!geo) return;
    const r = box.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * geo.W;
    scrubT = geo.t0 + (Math.max(geo.x0, Math.min(geo.x1, px)) - geo.x0) / (geo.x1 - geo.x0) * (geo.t1 - geo.t0);
    drawChart();
  };
  const end = () => { scrubT = null; drawChart(); };
  box.addEventListener('pointerdown', move);
  box.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) move(e); });
  box.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') end(); });
  box.addEventListener('pointerleave', end);
  box.addEventListener('pointercancel', end);
}

/* ---------- refresh loop ---------- */

let timer = null, busy = false;
async function refresh(full) {
  if (busy) return;
  busy = true;
  try {
    await loadScores();
    render();
    if (full || Date.now() - S.lastPm > 120e3) {
      try { await loadOdds(); S.lastPm = Date.now(); S.lastLines = Date.now(); } catch (e) { console.warn(e); }
      render();
    } else if (Date.now() - S.lastLines > 30e3 && S.games.some(g => g.state === 'in')) {
      try { await loadLiveLines(); S.lastLines = Date.now(); } catch (e) { console.warn(e); }
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
  timer = setTimeout(() => refresh(false), live ? 10e3 : soon ? 30e3 : 120e3);
}

function changeWeek(delta) {
  S.offset = delta === 0 ? 0 : S.offset + delta;
  S.games = []; S.pm.clear(); S.book.clear(); S.updated = null; S.exp = null;
  stopExpTimer(); ticks.clear();
  closeSocket(); wsKey = '';
  window.scrollTo(0, 0);
  render();
  refresh(true);
}

$('#chips').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.dataset.f === S.filter) return;
  S.filter = b.dataset.f;
  store.set('filter', S.filter);
  window.scrollTo(0, 0);
  render();
  fetchKickoffs();
});
$('#prev').onclick = () => changeWeek(-1);
$('#next').onclick = () => changeWeek(1);
$('#weekLabel').onclick = () => S.offset && changeWeek(0);
$('#list').addEventListener('click', e => {
  const rb = e.target.closest('#xr button'), sb = e.target.closest('#xs button');
  if (rb) { S.exp.range = rb.dataset.r; scrubT = null; drawChart(); return; }
  if (sb) { S.exp.side = sb.dataset.s; drawChart(); return; }
  const main = e.target.closest('.card-main');
  if (main) toggleExpand(main.parentElement.dataset.id);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clearTimeout(timer); closeSocket(); return; }
  wsKey = '';
  refresh(Date.now() - S.lastPm > 120e3);
  if (S.exp) { const g = S.games.find(x => x.id === S.exp.id); if (g && S.pm.has(g.id)) loadRange(g, true); } // fill the gap while the phone was locked
});

$('#ver').textContent = 'v' + VERSION;
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
render();
refresh(true);
