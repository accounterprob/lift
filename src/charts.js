// Interactive time-series chart: smooth (bezier) line with a period selector.
// Used by the per-exercise detail and the Progress volume trend.

const PERIODS = [
  { key: '1W', tick: '1W', days: 7 },
  { key: '1M', tick: '1M', days: 30 },
  { key: '3M', tick: '3M', days: 90 },
  { key: '1Y', tick: '1Y', days: 365 },
  { key: 'All', tick: 'All', all: true },
];

/**
 * @param {HTMLElement} container  where to render
 * @param {Array<{date:number, value:number}>} rawPoints  full dataset (ms timestamps)
 * @param {object} opts  { defaultPeriod?: string, unit?: string }
 */
export function mountTimeSeriesChart(container, rawPoints, opts = {}) {
  // Collapse to one point per calendar day (average) so two same-day sessions
  // never produce a vertical segment.
  const byDay = new Map();
  for (const p of rawPoints) {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const cur = byDay.get(key) || { date: p.date, total: 0, count: 0 };
    cur.total += p.value;
    cur.count += 1;
    // Keep the earliest timestamp of the day for stable X positioning
    cur.date = Math.min(cur.date, p.date);
    byDay.set(key, cur);
  }
  const points = [...byDay.values()]
    .map((d) => ({ date: d.date, value: d.total / d.count }))
    .sort((a, b) => a.date - b.date);

  const defaultKey = opts.defaultPeriod || 'All';
  let activeIdx = Math.max(0, PERIODS.findIndex((p) => p.key === defaultKey));
  const maxIdx = PERIODS.length - 1;

  function filtered() {
    const p = PERIODS[activeIdx];
    if (p.all) return points;
    const cutoff = Date.now() - p.days * 86400000;
    const within = points.filter((pt) => pt.date >= cutoff);
    return within.length >= 1 ? within : points.slice(-1);
  }

  // Build the static shell once (chart + date range + slider). Dragging the
  // slider only re-renders the chart body, so the slider keeps focus mid-drag.
  container.innerHTML = `
    <div class="chart-container" data-role="chart"></div>
    <div class="chart-daterange" data-role="range"></div>
    <div class="chart-slider">
      <input type="range" class="chart-range" min="0" max="${maxIdx}" step="1"
             value="${activeIdx}" aria-label="Time range" />
      <div class="chart-slider-ticks">
        ${PERIODS.map((p, i) => `<span data-i="${i}">${p.tick}</span>`).join('')}
      </div>
    </div>
  `;
  const chartEl = container.querySelector('[data-role="chart"]');
  const rangeEl = container.querySelector('[data-role="range"]');
  const slider = container.querySelector('.chart-range');
  const tickEls = [...container.querySelectorAll('.chart-slider-ticks span')];

  function update() {
    const pts = filtered();
    chartEl.innerHTML = smoothLineSvg(pts, opts.unit || 'lbs');
    rangeEl.innerHTML = pts.length >= 2
      ? `<span>${fmtDate(pts[0].date)}</span><span>${fmtDate(pts[pts.length - 1].date)}</span>`
      : '';
    tickEls.forEach((t, i) => t.classList.toggle('active', i === activeIdx));
  }

  slider.addEventListener('input', () => {
    activeIdx = Number(slider.value);
    update();
  });
  update();
}

function fmtDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function smoothLineSvg(data, unit) {
  const W = 400, H = 200;
  const pad = { top: 16, right: 14, bottom: 14, left: 44 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  if (data.length === 0) {
    return `<svg viewBox="0 0 ${W} ${H}"><text x="${W / 2}" y="${H / 2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`;
  }
  if (data.length === 1) {
    const x = pad.left + innerW / 2;
    const y = pad.top + innerH / 2;
    return `<svg viewBox="0 0 ${W} ${H}"><circle cx="${x}" cy="${y}" r="4" class="chart-point"/><text x="${x}" y="${y - 10}" text-anchor="middle" class="chart-axis-label">${Math.round(data[0].value)} ${unit}</text></svg>`;
  }

  const xs = data.map((d) => d.date);
  const ys = data.map((d) => d.value);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const maxY = Math.max(...ys), minY = Math.min(...ys);
  const yRange = Math.max(maxY - minY, 1);
  const yMin = Math.max(0, minY - yRange * 0.12);
  const yMax = maxY + yRange * 0.12;

  const xScale = (x) => pad.left + ((x - minX) / Math.max(maxX - minX, 1)) * innerW;
  const yScale = (y) => pad.top + innerH - ((y - yMin) / (yMax - yMin)) * innerH;

  const pixelPts = data.map((d) => ({ x: xScale(d.date), y: yScale(d.value) }));
  const path = smoothPath(pixelPts);

  const ticks = 4;
  const fmt = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));
  const yLabels = Array.from({ length: ticks + 1 }, (_, i) => {
    const val = yMin + ((yMax - yMin) * i) / ticks;
    const y = yScale(val);
    return `<text x="${pad.left - 6}" y="${y + 3}" text-anchor="end" class="chart-axis-label">${fmt(val)}</text>`;
  }).join('');
  const grid = Array.from({ length: ticks + 1 }, (_, i) => {
    const y = pad.top + (innerH * i) / ticks;
    return `<line x1="${pad.left}" x2="${W - pad.right}" y1="${y}" y2="${y}" class="chart-axis-line"/>`;
  }).join('');

  return `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      ${grid}
      ${yLabels}
      <path d="${path}" class="chart-line"/>
    </svg>
  `;
}

/** Catmull-Rom → cubic-bezier smoothing through all points. */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}
