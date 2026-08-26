// Server-side client for the Vercel Web Analytics query API.
// https://vercel.com/docs/analytics/web-analytics-api
//
// Reads production-only visit data for the site so it can be shown inside
// the Payload admin. Requires a Vercel access token (created at
// vercel.com/account/settings/tokens, scoped to the fonemstr team) in the
// VERCEL_API_TOKEN env var. Team and project IDs default to this site's
// Vercel project; they are identifiers, not secrets.

const API_BASE = "https://api.vercel.com/v1/query/web-analytics";

const TEAM_ID = process.env.VERCEL_TEAM_ID || "team_XZ1fwLA8f9KbIXmN1C3OQ0wz";
const PROJECT_ID = process.env.VERCEL_ANALYTICS_PROJECT_ID || "prj_j5U29s2MVsWf8EnArLqs1dGP7wGJ";

export type AnalyticsTotals = {
  pageviews: number;
  visitors: number;
};

export type AnalyticsTrendPoint = AnalyticsTotals & {
  timestamp: string;
};

export type AnalyticsBreakdownRow = AnalyticsTotals & {
  label: string;
};

export function analyticsToken(): string | undefined {
  return process.env.VERCEL_API_TOKEN || process.env.VERCEL_ANALYTICS_TOKEN || process.env.VERCEL_TOKEN;
}

export class AnalyticsApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function query<T>(endpoint: "aggregate" | "count", params: Record<string, string>): Promise<T> {
  const token = analyticsToken();
  if (!token) {
    throw new AnalyticsApiError(0, "No Vercel API token configured");
  }

  const search = new URLSearchParams({
    teamId: TEAM_ID,
    projectId: PROJECT_ID,
    ...params,
  });

  const res = await fetch(`${API_BASE}/visits/${endpoint}?${search}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const detail =
      res.status === 403
        ? "the token was rejected — it may be expired or missing access to the team"
        : res.status === 404
          ? "Web Analytics is not enabled for the project, or has no data yet"
          : await res.text().then((t) => t.slice(0, 200)).catch(() => res.statusText);
    throw new AnalyticsApiError(res.status, `Vercel Analytics API returned ${res.status}: ${detail}`);
  }

  const body = (await res.json()) as { data: T };
  return body.data;
}

function rangeParams(since: Date, until: Date): Record<string, string> {
  return { since: since.toISOString(), until: until.toISOString() };
}

// Totals are summed from the daily aggregate rather than the count
// endpoint: count returned zeros for ranged queries in practice, and
// summing days matches the dashboard's semantics anyway (visitor IDs
// reset daily, so range visitors = sum of daily visitors). It also
// keeps the stat tiles consistent with the chart drawn from the same
// rows.
export function sumTrend(trend: AnalyticsTrendPoint[]): AnalyticsTotals {
  return trend.reduce(
    (acc, point) => ({
      pageviews: acc.pageviews + point.pageviews,
      visitors: acc.visitors + point.visitors,
    }),
    { pageviews: 0, visitors: 0 },
  );
}

export async function getDailyTrend(since: Date, until: Date): Promise<AnalyticsTrendPoint[]> {
  const data = await query<Array<Partial<AnalyticsTrendPoint>>>("aggregate", {
    ...rangeParams(since, until),
    by: "day",
  });
  return data
    .filter((row): row is AnalyticsTrendPoint => typeof row.timestamp === "string")
    .map((row) => ({
      timestamp: row.timestamp,
      pageviews: row.pageviews ?? 0,
      visitors: row.visitors ?? 0,
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export async function getBreakdown(
  dimension: "requestPath" | "referrerHostname" | "deviceType" | "country",
  since: Date,
  until: Date,
  limit = 8,
): Promise<AnalyticsBreakdownRow[]> {
  const data = await query<Array<Record<string, unknown>>>("aggregate", {
    ...rangeParams(since, until),
    by: dimension,
    limit: String(limit),
  });
  return data.map((row) => ({
    label: String(row[dimension] ?? "") || "(none)",
    pageviews: typeof row.pageviews === "number" ? row.pageviews : 0,
    visitors: typeof row.visitors === "number" ? row.visitors : 0,
  }));
}
