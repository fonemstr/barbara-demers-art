import type { AdminViewServerProps } from "payload";

import { DefaultTemplate } from "@payloadcms/next/templates";
import { redirect } from "next/navigation";
import Link from "next/link";
import React from "react";

import {
  AnalyticsApiError,
  analyticsToken,
  getBreakdown,
  getDailyTrend,
  getTotals,
  type AnalyticsBreakdownRow,
} from "@/lib/vercel-analytics";
import { AnalyticsTrendChart } from "./analytics-trend-chart";

const RANGES = [7, 30, 90] as const;

function formatCount(n: number): string {
  if (n >= 10000) {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  }
  return n.toLocaleString("en-US");
}

function StatTile({ label, value, prev, days }: { label: string; value: number; prev: number; days: number }) {
  const pct = prev > 0 ? Math.round(((value - prev) / prev) * 100) : null;
  return (
    <div className="av-tile">
      <div className="av-tile__label">{label}</div>
      <div className="av-tile__value">{formatCount(value)}</div>
      {pct !== null && pct !== 0 && (
        <div className={`av-tile__delta av-tile__delta--${pct > 0 ? "up" : "down"}`}>
          {pct > 0 ? "▲" : "▼"} {Math.abs(pct)}% vs prior {days} days
        </div>
      )}
    </div>
  );
}

function BarList({ title, rows }: { title: string; rows: AnalyticsBreakdownRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.visitors));
  return (
    <section className="av-card">
      <h2 className="av-card__title">{title}</h2>
      {rows.length === 0 ? (
        <p className="av-empty">No data in this period.</p>
      ) : (
        <ul className="av-bars">
          {rows.map((row) => (
            <li key={row.label} className="av-bars__row">
              <span className="av-bars__label" title={row.label}>
                {row.label}
              </span>
              <span className="av-bars__track">
                <span className="av-bars__bar" style={{ width: `${Math.max(1, (row.visitors / max) * 100)}%` }} />
              </span>
              <span className="av-bars__value">{formatCount(row.visitors)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SetupNotice() {
  return (
    <div className="av-card av-setup">
      <h2 className="av-card__title">One-time setup needed</h2>
      <p>
        This page reads traffic data from Vercel Web Analytics, which needs an API token. A site admin (Dave)
        can set it up in a couple of minutes:
      </p>
      <ol>
        <li>
          Create an access token at <strong>vercel.com → Account settings → Tokens</strong>, scoped to the
          fonemstr team.
        </li>
        <li>
          In the Vercel dashboard, open the <strong>barbara-demers-art</strong> project →{" "}
          <strong>Settings → Environment Variables</strong> and add <code>VERCEL_API_TOKEN</code> with that
          token for the Production environment.
        </li>
        <li>Redeploy the site. This page will start working on the next visit.</li>
      </ol>
    </div>
  );
}

export async function AnalyticsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult;
  const adminRoute = req.payload.config.routes.admin;

  if (!req.user) {
    redirect(`${adminRoute}/login?redirect=${encodeURIComponent(`${adminRoute}/analytics`)}`);
  }

  const rangeParam = Array.isArray(searchParams?.range) ? searchParams.range[0] : searchParams?.range;
  const days = RANGES.find((d) => String(d) === rangeParam) ?? 30;

  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);

  type AnalyticsData = {
    totals: Awaited<ReturnType<typeof getTotals>>;
    prevTotals: Awaited<ReturnType<typeof getTotals>>;
    trend: Awaited<ReturnType<typeof getDailyTrend>>;
    pages: AnalyticsBreakdownRow[];
    referrers: AnalyticsBreakdownRow[];
    countries: AnalyticsBreakdownRow[];
  };

  let data: AnalyticsData | null = null;
  let errorMessage: string | null = null;

  if (analyticsToken()) {
    try {
      const [totals, prevTotals, trend, pages, referrers, countries] = await Promise.all([
        getTotals(since, until),
        getTotals(prevSince, since),
        getDailyTrend(since, until),
        getBreakdown("requestPath", since, until),
        getBreakdown("referrerHostname", since, until),
        getBreakdown("country", since, until),
      ]);
      data = { totals, prevTotals, trend, pages, referrers, countries };
    } catch (err) {
      errorMessage =
        err instanceof AnalyticsApiError ? err.message : "Could not reach the Vercel Analytics API.";
    }
  }

  let content: React.ReactNode;

  if (!analyticsToken()) {
    content = <SetupNotice />;
  } else if (errorMessage !== null || data === null) {
    content = (
      <div className="av-card av-error" role="alert">
        <h2 className="av-card__title">Analytics unavailable</h2>
        <p>{errorMessage ?? "Could not reach the Vercel Analytics API."}</p>
        <p>Try reloading in a minute. If it keeps failing, the API token may need to be replaced.</p>
      </div>
    );
  } else {
    const { totals, prevTotals, trend, pages, referrers, countries } = data;
    content = (
        <>
          <div className="av-filters">
            {RANGES.map((d) => (
              <Link
                key={d}
                href={`${adminRoute}/analytics${d === 30 ? "" : `?range=${d}`}`}
                className={`av-filters__preset${d === days ? " av-filters__preset--active" : ""}`}
                aria-current={d === days ? "true" : undefined}
              >
                Last {d} days
              </Link>
            ))}
          </div>
          <div className="av-tiles">
            <StatTile label="Visitors" value={totals.visitors} prev={prevTotals.visitors} days={days} />
            <StatTile label="Page views" value={totals.pageviews} prev={prevTotals.pageviews} days={days} />
          </div>
          <section className="av-card">
            <h2 className="av-card__title">Daily traffic</h2>
            {trend.length === 0 ? (
              <p className="av-empty">No visits recorded in this period yet.</p>
            ) : (
              <AnalyticsTrendChart points={trend} />
            )}
          </section>
          <div className="av-grid">
            <BarList title="Top pages" rows={pages} />
            <BarList
              title="Referrers"
              rows={referrers.map((r) => (r.label === "(none)" ? { ...r, label: "Direct / none" } : r))}
            />
            <BarList title="Countries" rows={countries} />
          </div>
          <p className="av-footnote">Live site traffic only. Numbers refresh about every five minutes.</p>
        </>
    );
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <div className="gutter gutter--left gutter--right analytics-view">
        <h1 className="av-heading">Site analytics</h1>
        {content}
      </div>
    </DefaultTemplate>
  );
}
