"use client";

import React from "react";

export type TrendPoint = {
  timestamp: string;
  visitors: number;
  pageviews: number;
};

const SERIES = [
  { key: "visitors", label: "Visitors", colorVar: "var(--av-series-1)" },
  { key: "pageviews", label: "Page views", colorVar: "var(--av-series-2)" },
] as const;

const MARGIN = { top: 12, right: 84, bottom: 26, left: 46 };
const HEIGHT = 240;

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatCount(n: number): string {
  if (n >= 10000) {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  }
  return n.toLocaleString("en-US");
}

// Round the axis max up to 1/2/5 × 10^k so tick values come out clean.
function niceMax(rawMax: number): number {
  if (rawMax <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rawMax)));
  for (const m of [1, 2, 4, 5, 10]) {
    if (m * pow >= rawMax) return m * pow;
  }
  return 10 * pow;
}

export function AnalyticsTrendChart({ points }: { points: TrendPoint[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(640);
  const [active, setActive] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(320, w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const yMax = niceMax(Math.max(1, ...points.map((p) => Math.max(p.visitors, p.pageviews))));
  const x = (i: number) => MARGIN.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => MARGIN.top + plotH - (v / yMax) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(yMax * t));

  const linePath = (key: (typeof SERIES)[number]["key"]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join("");

  const pointFromEvent = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return null;
    const px = clientX - rect.left - MARGIN.left;
    const step = points.length === 1 ? plotW : plotW / (points.length - 1);
    return Math.min(points.length - 1, Math.max(0, Math.round(px / step)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 1 : -1;
      setActive((prev) => Math.min(points.length - 1, Math.max(0, (prev ?? points.length - 1) + delta)));
    } else if (e.key === "Escape") {
      setActive(null);
    }
  };

  if (points.length === 0) return null;

  const last = points.length - 1;
  // Direct-label the line endpoints, but only when the two labels don't
  // collide; the legend and tooltip carry identity either way.
  const endLabelsSeparated = Math.abs(y(points[last].visitors) - y(points[last].pageviews)) >= 16;
  const activePoint = active === null ? null : points[active];
  const tooltipLeft = active === null ? 0 : Math.min(Math.max(x(active) - 70, 8), width - 158);

  return (
    <div className="av-trend">
      <div className="av-trend__legend" aria-hidden="true">
        {SERIES.map((s) => (
          <span key={s.key} className="av-trend__legend-item">
            <span className="av-trend__line-key" style={{ background: s.colorVar }} />
            {s.label}
          </span>
        ))}
      </div>
      <div
        ref={containerRef}
        className="av-trend__plot"
        role="application"
        aria-label="Daily visitors and page views. Use left and right arrow keys to read values."
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerMove={(e) => setActive(pointFromEvent(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((prev) => prev ?? points.length - 1)}
        onBlur={() => setActive(null)}
      >
        <svg width={width} height={HEIGHT} role="img">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(t)}
                y2={y(t)}
                className={t === 0 ? "av-trend__baseline" : "av-trend__grid"}
              />
              <text x={MARGIN.left - 8} y={y(t) + 3.5} textAnchor="end" className="av-trend__tick">
                {formatCount(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const showLabel =
              points.length <= 7 || i === 0 || i === last || i % Math.ceil(points.length / 5) === 0;
            return showLabel ? (
              <text key={p.timestamp} x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="av-trend__tick">
                {formatDay(p.timestamp)}
              </text>
            ) : null;
          })}
          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={MARGIN.top} y2={MARGIN.top + plotH} className="av-trend__crosshair" />
          )}
          {SERIES.map((s) => (
            <path key={s.key} d={linePath(s.key)} fill="none" stroke={s.colorVar} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {SERIES.map((s) => (
            <g key={s.key}>
              <circle cx={x(last)} cy={y(points[last][s.key])} r={4} fill={s.colorVar} className="av-trend__marker" />
              {activePoint && active !== last && (
                <circle cx={x(active!)} cy={y(activePoint[s.key])} r={4} fill={s.colorVar} className="av-trend__marker" />
              )}
              {endLabelsSeparated && (
                <text x={x(last) + 10} y={y(points[last][s.key]) + 3.5} className="av-trend__end-label">
                  {formatCount(points[last][s.key])}
                </text>
              )}
            </g>
          ))}
        </svg>
        {activePoint && (
          <div className="av-trend__tooltip" style={{ left: tooltipLeft }} role="status">
            <div className="av-trend__tooltip-date">{formatDay(activePoint.timestamp)}</div>
            {SERIES.map((s) => (
              <div key={s.key} className="av-trend__tooltip-row">
                <span className="av-trend__line-key" style={{ background: s.colorVar }} />
                <strong>{formatCount(activePoint[s.key])}</strong>
                <span>{s.label.toLowerCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <details className="av-table-details">
        <summary>View as table</summary>
        <table className="av-table">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Visitors</th>
              <th scope="col">Page views</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.timestamp}>
                <td>{formatDay(p.timestamp)}</td>
                <td>{p.visitors.toLocaleString("en-US")}</td>
                <td>{p.pageviews.toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
