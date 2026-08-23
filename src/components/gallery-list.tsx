"use client";

import { useEffect, useMemo, useState } from "react";
import type { Painting } from "@/data/paintings";
import { SUBJECT_GROUP_LABELS, type SubjectGroup } from "@/data/subject-groups";
import { PaintingCard } from "@/components/painting-card";
import { cn } from "@/lib/utils";

type Filter = "all" | SubjectGroup;

/**
 * Gallery with a client-side subject-group chip filter. Paintings are
 * pre-fetched on the server and passed in; chips just narrow the list.
 *
 * Reads `?group=<subjectGroup>` once after mount so editorial blocks on the
 * home page can deep-link in. Deliberately NOT `useSearchParams` — that would
 * bail the whole list out of server rendering, leaving crawlers and link
 * previews an empty page. Chip clicks update the URL via
 * `history.replaceState` (no router round-trip), keeping links shareable.
 */
export function GalleryList({
  paintings,
  groups,
}: {
  paintings: Painting[];
  groups: SubjectGroup[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("group");
    if (param && (groups as string[]).includes(param)) {
      setFilter(param as SubjectGroup);
    }
    // Deep-link is read once on mount; chips own the state afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFilter = (next: Filter) => {
    setFilter(next);
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (next === "all") {
      params.delete("group");
    } else {
      params.set("group", next);
    }
    const query = params.toString();
    const url = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;
    window.history.replaceState(null, "", url);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: paintings.length };
    for (const g of groups) c[g] = paintings.filter((p) => p.subjectGroup === g).length;
    return c;
  }, [paintings, groups]);

  const filtered =
    filter === "all"
      ? paintings
      : paintings.filter((p) => p.subjectGroup === filter);

  const chipBase =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-[160ms] ease-[cubic-bezier(.22,1,.36,1)] cursor-pointer";

  return (
    <>
      {/* Filter chips — "love notes" per DESIGN.md §5 */}
      <div className="sticky top-[72px] z-20 -mx-6 px-6 py-4 mb-10 backdrop-blur-xl bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter by subject"
        >
          <Chip
            active={filter === "all"}
            onClick={() => updateFilter("all")}
            className={chipBase}
          >
            All work
            <Count value={counts.all} active={filter === "all"} />
          </Chip>
          {groups.map((g) => (
            <Chip
              key={g}
              active={filter === g}
              onClick={() => updateFilter(g)}
              className={chipBase}
            >
              {SUBJECT_GROUP_LABELS[g]}
              <Count value={counts[g]} active={filter === g} />
            </Chip>
          ))}
        </div>
      </div>

      {/* Grid — staggered offsets break the perfect 3-column cadence */}
      {filtered.length === 0 ? (
        <p className="text-on-surface-muted py-20 text-center">
          Nothing in this corner of the studio yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
          {filtered.map((painting, i) => (
            <div
              key={painting.slug}
              className={cn(
                "transition-transform",
                // Gentle vertical stagger — every 3rd column offset
                i % 3 === 1 && "lg:mt-12",
                i % 3 === 2 && "lg:mt-6"
              )}
            >
              <PaintingCard painting={painting} priority={i < 2} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Chip({
  active,
  className,
  onClick,
  children,
}: {
  active: boolean;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        className,
        active
          ? "bg-on-surface text-surface"
          : "bg-surface-container-lowest text-on-surface-muted hover:text-on-surface hover:bg-surface-container"
      )}
    >
      {children}
    </button>
  );
}

function Count({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      className={cn(
        "tabular-nums text-[12px] rounded-full px-1.5 py-0 min-w-[18px] text-center",
        active
          ? "bg-surface/20 text-surface"
          : "bg-surface-container text-on-surface-subtle"
      )}
    >
      {value}
    </span>
  );
}
