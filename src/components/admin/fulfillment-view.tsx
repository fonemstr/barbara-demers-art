import type { AdminViewServerProps } from "payload";

import { DefaultTemplate } from "@payloadcms/next/templates";
import { redirect } from "next/navigation";
import Link from "next/link";
import React from "react";

import { getBudderleePostSettings, getSignupSchedule } from "@/lib/budderlee-post";
import { getIssueOverviews, getSubscriberCounts, type IssueOverview } from "@/lib/budderlee-post-fulfillment";
import { ConfirmSubmit } from "./confirm-submit";

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  printer: "At the printer",
  ready: "Ready to ship",
  shipped: "Shipped",
};

function monthLabel(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function dateLabel(iso: string | null) {
  if (!iso) return "not yet";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
}

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function IssueRow({ issue, adminRoute }: { issue: IssueOverview; adminRoute: string }) {
  const total = issue.pending + issue.shipped + issue.skipped;
  const listed = issue.shippingListGeneratedAt !== null;
  return (
    <tr>
      <td>
        <Link href={`${adminRoute}/collections/issues/${issue.id}`}>
          <strong>{monthLabel(issue.mailingMonth)}</strong>
        </Link>
        <div className="fv-muted">{issue.title.split(" · ")[1] ?? ""}</div>
      </td>
      <td>{STATUS_LABEL[issue.status] ?? issue.status}</td>
      <td>
        {listed ? (
          <>
            <Link href={`${adminRoute}/collections/shipments?where[issue][equals]=${issue.id}`}>{total} on the list</Link>
            <div className="fv-muted">
              {issue.pending} pending · {issue.shipped} shipped{issue.skipped ? ` · ${issue.skipped} skipped` : ""}
            </div>
            <div className="fv-muted">generated {dateLabel(issue.shippingListGeneratedAt)}</div>
          </>
        ) : (
          <span className="fv-muted">not generated yet</span>
        )}
      </td>
      <td className="fv-actions">
        <form method="post" action="/api/post/fulfillment/generate">
          <input type="hidden" name="issue" value={issue.id} />
          <button type="submit" className="btn btn--style-secondary btn--size-small">
            {listed ? "Add new signups" : "Generate shipping list"}
          </button>
        </form>
        {listed && (
          <a className="btn btn--style-secondary btn--size-small" href={`/api/post/fulfillment/csv?issue=${issue.id}`}>
            Download CSV
          </a>
        )}
        {listed && issue.pending > 0 && (
          <form method="post" action="/api/post/fulfillment/ship-all">
            <input type="hidden" name="issue" value={issue.id} />
            <ConfirmSubmit
              className="btn btn--style-primary btn--size-small"
              message={`Mark all ${issue.pending} pending packages for ${monthLabel(issue.mailingMonth)} as shipped? This counts a package for each subscriber and can't be undone from here.`}
            >
              Mark all shipped
            </ConfirmSubmit>
          </form>
        )}
      </td>
    </tr>
  );
}

export async function FulfillmentView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult;
  const adminRoute = req.payload.config.routes.admin;

  if (!req.user) {
    redirect(`${adminRoute}/login?redirect=${encodeURIComponent(`${adminRoute}/fulfillment`)}`);
  }

  const ok = first(searchParams?.ok);
  const error = first(searchParams?.error);

  const [settings, counts, issues] = await Promise.all([
    getBudderleePostSettings(),
    getSubscriberCounts(req.payload),
    getIssueOverviews(req.payload),
  ]);
  const schedule = getSignupSchedule(settings.cutoffDay);
  const shippable = counts.active + (settings.includePastDue ? counts.past_due : 0);

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
      <div className="gutter gutter--left gutter--right fulfillment-view">
        <h1 className="fv-heading">The Budderlee Post · Fulfillment</h1>

        {ok && <div className="fv-banner fv-banner--ok" role="status">{ok}</div>}
        {error && <div className="fv-banner fv-banner--error" role="alert">{error}</div>}

        <div className="fv-tiles">
          <div className="fv-tile">
            <div className="fv-tile__label">Shipping next mailing</div>
            <div className="fv-tile__value">{shippable}</div>
            <div className="fv-muted">
              {counts.active} active{settings.includePastDue ? ` + ${counts.past_due} past due` : ""} · cap {settings.subscriberCap}
            </div>
          </div>
          <div className="fv-tile">
            <div className="fv-tile__label">First charge pending</div>
            <div className="fv-tile__value">{counts.trialing}</div>
            <div className="fv-muted">signed up after the cutoff; ship the mailing after next</div>
          </div>
          <div className="fv-tile">
            <div className="fv-tile__label">Paused · Canceled</div>
            <div className="fv-tile__value">{counts.paused} · {counts.canceled}</div>
            <div className="fv-muted">not on the list</div>
          </div>
          <div className="fv-tile">
            <div className="fv-tile__label">Next cutoff</div>
            <div className="fv-tile__value">{schedule.chargesNow ? `the ${settings.cutoffDay}th` : schedule.chargeDateLabel}</div>
            <div className="fv-muted">for the {schedule.firstMailingLabel} mailing</div>
          </div>
        </div>

        <section className="fv-card">
          <h2 className="fv-card__title">Issues</h2>
          {issues.length === 0 ? (
            <p className="fv-muted">
              No issues yet. <Link href={`${adminRoute}/collections/issues/create`}>Create the first one</Link> with its mailing month and resident.
            </p>
          ) : (
            <div className="fv-table-wrap">
              <table className="fv-table">
                <thead>
                  <tr>
                    <th>Mailing</th>
                    <th>Status</th>
                    <th>Shipping list</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} adminRoute={adminRoute} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="fv-muted fv-footnote">
            <Link href={`${adminRoute}/collections/issues/create`}>New issue</Link> · <Link href={`${adminRoute}/collections/subscribers`}>Subscribers</Link> ·{" "}
            <Link href={`${adminRoute}/globals/budderlee-post`}>Settings</Link>
          </p>
        </section>

        <section className="fv-card">
          <h2 className="fv-card__title">The month, in order</h2>
          <ol className="fv-steps">
            <li><strong>1st to the {settings.cutoffDay}th.</strong> Write the issue: story, recipe, sticker. Signups accumulate.</li>
            <li><strong>On the {settings.cutoffDay}th.</strong> Generate the shipping list. It snapshots every shipping subscriber and their address, marks who gets a welcome note (first package) and who gets the Founding Member sticker. Download the CSV for the label tool and order prints for that count.</li>
            <li><strong>Before mailing.</strong> New signups since the cutoff go on next month&rsquo;s list. If someone must be added or left off, open the Shipments list: set a row to Skipped, or press Add new signups.</li>
            <li><strong>Mailing week.</strong> Pack from the CSV. Press Mark all shipped, or tick rows one by one in Shipments. Each shipped row counts a package for that subscriber.</li>
          </ol>
        </section>
      </div>
    </DefaultTemplate>
  );
}
