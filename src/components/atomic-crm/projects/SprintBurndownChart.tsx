import { ResponsiveLine } from "@nivo/line";
import { eachDayOfInterval, endOfDay, format, parseISO, startOfDay } from "date-fns";
import { useGetList, useTranslate } from "ra-core";
import { useMemo } from "react";

import type { Issue, IssueStatusHistory, Sprint } from "../types";

/** Ideal-line vs actual-remaining-open-count burndown, using
 * issue_status_history (added in #87 specifically for this -- #67's
 * sprint progress bar could only ever show the current state, not a
 * trend over the sprint's duration). */
export const SprintBurndownChart = ({
  sprint,
  issues,
}: {
  sprint: Sprint;
  issues: Issue[];
}) => {
  const translate = useTranslate();

  // Fetches the whole project's status history (a plain project_id
  // equality filter, not an issue_id "in" list -- see the migration's
  // own comment for why) and narrows to this sprint's issues client-side,
  // same "fetch once per project, filter client-side" shape already used
  // by SprintPanel.tsx/MilestonePanel.tsx/IssueSubtaskBadge.tsx.
  const { data: history, isPending } = useGetList<IssueStatusHistory>(
    "issue_status_history",
    {
      filter: { project_id: sprint.project_id },
      pagination: { page: 1, perPage: 1000 },
    },
    { enabled: !!sprint.start_date && !!sprint.end_date },
  );

  const chartData = useMemo(() => {
    if (!sprint.start_date || !sprint.end_date || !history || issues.length === 0) {
      return null;
    }
    const start = startOfDay(parseISO(sprint.start_date));
    const end = startOfDay(parseISO(sprint.end_date));
    if (end < start) return null;

    const issueIds = new Set(issues.map((i) => String(i.id)));
    const historyByIssue = new Map<string, IssueStatusHistory[]>();
    for (const h of history) {
      const key = String(h.issue_id);
      if (!issueIds.has(key)) continue;
      const arr = historyByIssue.get(key);
      if (arr) arr.push(h);
      else historyByIssue.set(key, [h]);
    }
    for (const arr of historyByIssue.values()) {
      arr.sort(
        (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
      );
    }

    const days = eachDayOfInterval({ start, end });
    const total = issues.length;

    const actual = days.map((day) => {
      const cutoff = endOfDay(day);
      let openCount = 0;
      for (const issue of issues) {
        const entries = historyByIssue.get(String(issue.id));
        if (!entries) continue;
        // Latest entry at or before this day's cutoff -- entries are
        // sorted ascending, so the last one that still qualifies is it.
        let latest: IssueStatusHistory | undefined;
        for (const entry of entries) {
          if (new Date(entry.changed_at) > cutoff) break;
          latest = entry;
        }
        if (latest && latest.to_status !== "done") openCount += 1;
      }
      return { x: format(day, "MMM d"), y: openCount };
    });

    const ideal = days.map((day, i) => ({
      x: format(day, "MMM d"),
      y: Math.max(
        0,
        total - (total / Math.max(1, days.length - 1)) * i,
      ),
    }));

    return [
      {
        id: translate("resources.sprints.burndown.ideal", { _: "Ideal" }),
        data: ideal,
      },
      {
        id: translate("resources.sprints.burndown.actual", { _: "Actual" }),
        data: actual,
      },
    ];
  }, [sprint, issues, history, translate]);

  if (!sprint.start_date || !sprint.end_date) {
    return (
      <p className="text-xs text-muted-foreground">
        {translate("resources.sprints.burndown.needs_dates", {
          _: "Set a start and end date on this sprint to see a burndown chart.",
        })}
      </p>
    );
  }

  if (isPending || !chartData) return null;

  return (
    <div className="h-64">
      <ResponsiveLine
        data={chartData}
        margin={{ top: 20, right: 90, bottom: 30, left: 30 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: "auto" }}
        colors={["#8a8a8a", "#2a78d6"]}
        lineWidth={2}
        pointSize={5}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointColor="var(--color-background)"
        useMesh
        enableGridX={false}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          style: {
            ticks: { text: { fill: "var(--color-muted-foreground)" } },
          },
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          style: {
            ticks: { text: { fill: "var(--color-muted-foreground)" } },
          },
        }}
        legends={[
          {
            anchor: "right",
            direction: "column",
            translateX: 80,
            itemWidth: 70,
            itemHeight: 20,
            symbolSize: 8,
            itemTextColor: "var(--color-muted-foreground)",
          },
        ]}
        tooltip={({ point }) => (
          <div className="p-2 bg-secondary rounded shadow text-xs text-secondary-foreground">
            <strong>{String(point.data.x)}</strong> — {String(point.seriesId)}:{" "}
            {String(point.data.y)}
          </div>
        )}
      />
    </div>
  );
};
