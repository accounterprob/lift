// Interactive time-series chart: smooth (bezier) lines with a period selector.
// Draws one line per series — the Progress volume trend passes one series per
// rotation day; the per-exercise detail passes a single flat point list.

const PERIODS = [
  { key: '1W', tick: '1W', days: 7 },
  { key: '1M', tick: '1M', days: 30 },
  { key: '3M', tick: '3M', days: 90 },
  { key: '1Y', tick: '1Y', days: 365 },
  { key: 'All', tick: 'All', all: true },
];

// Collapse to one point per calendar day (average) so two same-day sessions
// never produce a vertical segment.
function collapseByDay(rawPoints) {
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
  return [...byDay.values()]
    .map((d) => ({ date: d.date, value: d.total / d.count }))
    .sort((a, b) => a.date - b.date);
}

/**
 * @param {HTMLElement} container  where to render
 * @param {Array<{date:number, value:number}> | Array<{label:string, color:string, points:Array<{date:number, value:number}>}>} raw
 *        one flat point list (single accent-colored line) or named series
 *        (one colored line each, with a legend). Timestamps in ms.
 * @param {object} opts  { defaultPeriod?: string, unit?: string }
 */
export function mountTimeSeriesChart(container, raw, opts = {}) {
  const isMulti = raw.length > 0 && raw[0].points !== undefined;
  const series = (isMulti ? raw : [{ points: raw }])
    .map((s) => ({
      label: s.label ?? '',
      color: s.color || 'var(--accent)',
      points: collapseByDay(s.points),
    }))
    .filter((s) => s.points.length > 0);

  const defaultKey = opts.defaultPeriod || 'All';
  let activeIdx = Math.max(0, PERIODS.findIndex((p) => p.key === defaultKey));
  const maxIdx = PERIODS.length - 1;

  function filtered() {
    const p = PERIODS[activeIdx];
    if (p.all) return series.map((s) => s.points);
    const cutoff = Date.now() - p.days * 86400000;
    const within = series.map((s) => s.points.filter((pt) => pt.date >= cutoff));
    // Nothing at all in the window: fall back to each line's latest point.
    if (within.every((pts) => pts.length === 0)) return series.map((s) => s.points.slice(-1));
    return within;
  }

  // Build the static shell once (readout + legend + chart + date range +
  // slider). Dragging the slider only re-renders the chart body.
  const legendHtml = isMulti && series.some((s) => s.label)
    ? `<div class="chart-legend">${series.map((s) =>
        `<span class="legend-item"><i style="background: ${s.color};"></i>${s.label}</span>`
      ).join('')}</div>`
    : '';
  container.innerHTML = `
    <div class="chart-scrub-readout" data-role="scrub"></div>
    ${legendHtml}
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
  const scrubEl = container.querySelector('[data-role="scrub"]');
  const chartEl = container.querySelector('[data-role="chart"]');
  const rangeEl = container.querySelector('[data-role="range"]');
  const slider = container.querySelector('.chart-range');
  const tickEls = [...container.querySelectorAll('.chart-slider-ticks span')];
  const unit = opts.unit || 'lbs';

  let geom = null;  // pixel points + data for the currently drawn chart

  function update() {
    const perSeries = filtered();
    const built = buildChart(perSeries, series, unit);
    chartEl.innerHTML = built.html;
    geom = built.geom;
    const all = perSeries.flat();
    if (all.length >= 2) {
      const minD = Math.min(...all.map((p) => p.date));
      const maxD = Math.max(...all.map((p) => p.date));
      rangeEl.innerHTML = `<span>${fmtDate(minD)}</span><span>${fmtDate(maxD)}</span>`;
    } else {
      rangeEl.innerHTML = '';
    }
    tickEls.forEach((t, i) => t.classList.toggle('active', i === activeIdx));
  }

  slider.addEventListener('input', () => {
    activeIdx = Number(slider.value);
    endScrub();
    update();
  });

  // ----- Scrubbing: drag a finger along the chart to read date + value -----
  function scrubAt(clientX) {
    if (!geom || geom.pts.length < 2) return;
    const svg = chartEl.querySelector('svg');
    const ctm = svg?.getScreenCTM();
    if (!ctm) return;
    const x = new DOMPoint(clientX, 0).matrixTransform(ctm.inverse()).x;
    let best = 0;
    let bestDist = Infinity;
    geom.pts.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    const p = geom.pts[best];
    const line = svg.querySelector('.chart-scrub-line');
    const dot = svg.querySelector('.chart-scrub-dot');
    if (line) {
      line.setAttribute('x1', p.x);
      line.setAttribute('x2', p.x);
      line.removeAttribute('visibility');
    }
    if (dot) {
      dot.setAttribute('cx', p.x);
      dot.setAttribute('cy', p.y);
      dot.style.fill = p.color;
      dot.removeAttribute('visibility');
    }
    const label = p.label ? ` · ${p.label}` : '';
    scrubEl.textContent = `${fmtDate(p.date)}${label} · ${Math.round(p.value).toLocaleString()} ${unit}`;
  }

  function endScrub() {
    scrubEl.textContent = '';
    const svg = chartEl.querySelector('svg');
    svg?.querySelector('.chart-scrub-line')?.setAttribute('visibility', 'hidden');
    svg?.querySelector('.chart-scrub-dot')?.setAttribute('visibility', 'hidden');
  }

  let scrubbing = false;
  chartEl.addEventListener('pointerdown', (e) => {
    scrubbing = true;
    chartEl.setPointerCapture?.(e.pointerId);
    scrubAt(e.clientX);
  });
  chartEl.addEventListener('pointermove', (e) => {
    if (scrubbing) scrubAt(e.clientX);
  });
  for (const ev of ['pointerup', 'pointercancel']) {
    chartEl.addEventListener(ev, () => { scrubbing = false; endScrub(); });
  }

  update();
}

function fmtDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Renders the chart SVG and returns { html, geom } where geom carries the
 * pixel-space points (each tagged with its series label/color + data), so the
 * scrubber can map a finger position back to a date/value/series. geom is
 * null when there's nothing to scrub.
 *
 * @param {Array<Array<{date,value}>>} perSeries  period-filtered points, one
 *        array per entry in `series` (same order)
 */
function buildChart(perSeries, series, unit) {
  const W = 400, H = 200;
  const pad = { top: 16, right: 14, bottom: 14, left: 52 };  // room for full y labels like 12,500
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const all = perSeries.flat();
  if (all.length === 0) {
    return { html: `<svg viewBox="0 0 ${W} ${H}"><text x="${W / 2}" y="${H / 2}" text-anchor="middle" class="chart-axis-label">No data in range</text></svg>`, geom: null };
  }
  if (all.length === 1) {
    const only = all[0];
    const color = series[perSeries.findIndex((pts) => pts.length > 0)]?.color || 'var(--accent)';
    const x = pad.left + innerW / 2;
    const y = pad.top + innerH / 2;
    return { html: `<svg viewBox="0 0 ${W} ${H}"><circle cx="${x}" cy="${y}" r="4" class="chart-point" style="fill: ${color};"/><text x="${x}" y="${y - 10}" text-anchor="middle" class="chart-axis-label">${Math.round(only.value).toLocaleString()} ${unit}</text></svg>`, geom: null };
  }

  const xs = all.map((d) => d.date);
  const ys = all.map((d) => d.value);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const maxY = Math.max(...ys), minY = Math.min(...ys);
  const yRange = Math.max(maxY - minY, 1);
  const yMin = Math.max(0, minY - yRange * 0.12);
  const yMax = maxY + yRange * 0.12;

  const xScale = (x) => pad.left + ((x - minX) / Math.max(maxX - minX, 1)) * innerW;
  const yScale = (y) => pad.top + innerH - ((y - yMin) / (yMax - yMin)) * innerH;

  const ticks = 4;
  const fmt = (v) => Math.round(v).toLocaleString();
  const yLabels = Array.from({ length: ticks + 1 }, (_, i) => {
    const val = yMin + ((yMax - yMin) * i) / ticks;
    const y = yScale(val);
    return `<text x="${pad.left - 6}" y="${y + 3}" text-anchor="end" class="chart-axis-label">${fmt(val)}</text>`;
  }).join('');
  const grid = Array.from({ length: ticks + 1 }, (_, i) => {
    const y = pad.top + (innerH * i) / ticks;
    return `<line x1="${pad.left}" x2="${W - pad.right}" y1="${y}" y2="${y}" class="chart-axis-line"/>`;
  }).join('');

  const scrubPts = [];
  const marks = perSeries.map((pts, si) => {
    const s = series[si];
    const pixelPts = pts.map((d) => ({ x: xScale(d.date), y: yScale(d.value) }));
    pts.forEach((d, i) => scrubPts.push({
      ...pixelPts[i], date: d.date, value: d.value, label: s.label, color: s.color,
    }));
    if (pixelPts.length === 0) return '';
    // A series with a single point in range still shows as a dot on the line chart.
    if (pixelPts.length === 1) {
      return `<circle cx="${pixelPts[0].x}" cy="${pixelPts[0].y}" r="3.5" class="chart-point" style="fill: ${s.color};"/>`;
    }
    return `<path d="${smoothPath(pixelPts)}" class="chart-line" style="stroke: ${s.color};"/>`;
  }).join('');

  const html = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      ${grid}
      ${yLabels}
      ${marks}
      <line class="chart-scrub-line" y1="${pad.top}" y2="${pad.top + innerH}" x1="0" x2="0" visibility="hidden"/>
      <circle class="chart-scrub-dot" r="4.5" visibility="hidden"/>
    </svg>
  `;
  return { html, geom: { pts: scrubPts } };
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
