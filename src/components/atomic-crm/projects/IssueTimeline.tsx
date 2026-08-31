import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Identifier } from "ra-core";
import { useTranslate } from "ra-core";
import { Link } from "react-router";
import { useMemo } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Issue } from "../types";

// Small fixed palette, same reasoning as IssueCalendar.tsx -- the config
// choices are just {value, label}, no color field to key off of.
const STATUS_COLORS: Record<string, string> = {
  todo: "#8a8a8a",
  "in-progress": "#2a78d6",
  "in-review": "#c98500",
  done: "#0ca30c",
};

/** Gantt-style bar per issue, positioned along a date axis spanning every
 * dated issue in the project. An issue needs at least a due_date to place
 * on the timeline (undated issues aren't shown here -- they're still
 * visible in the board/table views). One with only a due_date (no
 * start_date) renders as a single-day marker rather than a bar. */
export const IssueTimeline = ({
  projectId,
  issues,
}: {
  projectId: Identifier;
  issues: Issue[];
}) => {
  const translate = useTranslate();
  const { issueStatuses } = useConfigurationContext();

  const dated = useMemo(
    () => issues.filter((i) => i.due_date),
    [issues],
  );

  const { rangeStart, totalDays } = useMemo(() => {
    if (dated.length === 0) return { rangeStart: new Date(), totalDays: 1 };
    const starts = dated.map((i) =>
      parseISO(i.start_date ?? i.due_date!),
    );
    const ends = dated.map((i) => parseISO(i.due_date!));
    const min = starts.concat(ends).reduce((a, b) => (a < b ? a : b));
    const max = starts.concat(ends).reduce((a, b) => (a > b ? a : b));
    return {
      rangeStart: min,
      totalDays: Math.max(1, differenceInCalendarDays(max, min) + 1),
    };
  }, [dated]);

  const today = new Date();
  const todayOffset = differenceInCalendarDays(today, rangeStart);
  const todayPct =
    todayOffset >= 0 && todayOffset <= totalDays
      ? (todayOffset / totalDays) * 100
      : null;

  const statusLabel = useMemo(() => {
    const map = new Map(issueStatuses.map((s) => [s.value, s.label]));
    return (v: string) => map.get(v) ?? v;
  }, [issueStatuses]);

  if (dated.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {translate("resources.issues.timeline.empty", {
          _: "No issues with a due date yet -- the timeline needs at least one to draw an axis.",
        })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex text-xs text-muted-foreground px-2">
        <span className="w-48 shrink-0" />
        <div className="flex-1 flex justify-between">
          <span>{format(rangeStart, "MMM d, yyyy")}</span>
          <span>
            {format(
              new Date(rangeStart.getTime() + (totalDays - 1) * 86400000),
              "MMM d, yyyy",
            )}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 rounded-md border p-2">
        {dated.map((issue) => {
          const startOffset = differenceInCalendarDays(
            parseISO(issue.start_date ?? issue.due_date!),
            rangeStart,
          );
          const endOffset = differenceInCalendarDays(
            parseISO(issue.due_date!),
            rangeStart,
          );
          const leftPct = (startOffset / totalDays) * 100;
          const widthPct = Math.max(
            (1 / totalDays) * 100,
            ((endOffset - startOffset + 1) / totalDays) * 100,
          );
          const color = STATUS_COLORS[issue.status] ?? "#8a8a8a";

          return (
            <div key={issue.id} className="flex items-center">
              <Link
                to={`/projects/${projectId}/issues/${issue.id}/show`}
                className="w-48 shrink-0 pr-2 text-sm truncate hover:underline"
                title={issue.title}
              >
                {issue.title}
              </Link>
              <div className="flex-1 relative h-6">
                {todayPct != null && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-destructive/60"
                    style={{ left: `${todayPct}%` }}
                  />
                )}
                <Link
                  to={`/projects/${projectId}/issues/${issue.id}/show`}
                  className="absolute top-1 h-4 rounded-sm min-w-1.5 hover:opacity-80 transition-opacity"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    backgroundColor: color,
                  }}
                  title={`${issue.title} — ${statusLabel(issue.status)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
