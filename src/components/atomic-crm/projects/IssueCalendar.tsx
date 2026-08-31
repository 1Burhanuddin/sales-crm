import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { Issue, Project } from "../types";

const WEEKDAY_COUNT = 7;

// issuePriorities (see defaultConfiguration.ts) is just {value, label} --
// no color field to key off of, so this is a small fixed palette local
// to the calendar, same approach as PmDashboard.tsx's STATUS_COLORS.
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#d03b3b",
  high: "#c98500",
  medium: "#2a78d6",
  low: "#8a8a8a",
};

export const IssueCalendar = () => {
  const translate = useTranslate();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const { data: issues, isPending: issuesPending } = useGetList<Issue>(
    "issues",
    {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "due_date", order: "ASC" },
      filter: { "due_date@not.is": null },
    },
  );
  const { data: projects, isPending: projectsPending } = useGetList<Project>(
    "projects",
    { pagination: { page: 1, perPage: 200 } },
  );

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects ?? []) map.set(String(p.id), p.name);
    return map;
  }, [projects]);

  const issuesByDay = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of issues ?? []) {
      if (!issue.due_date) continue;
      const key = issue.due_date;
      const bucket = map.get(key);
      if (bucket) bucket.push(issue);
      else map.set(key, [issue]);
    }
    return map;
  }, [issues]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const isPending = issuesPending || projectsPending;

  return (
    <div className="mt-2 flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {translate("crm.pm.calendar.title", { _: "Due Date Calendar" })}
        </h1>
        <Link to="/pm" className="text-sm text-primary hover:underline">
          {translate("crm.pm.dashboard.view_projects", {
            _: "View all projects",
          })}
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">
            {format(month, "MMMM yyyy")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMonth(startOfMonth(new Date()))}
            >
              {translate("crm.pm.calendar.today", { _: "Today" })}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden border">
              {days.slice(0, WEEKDAY_COUNT).map((day) => (
                <div
                  key={`hdr-${day.toISOString()}`}
                  className="bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground text-center"
                >
                  {format(day, "EEE")}
                </div>
              ))}
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayIssues = issuesByDay.get(key) ?? [];
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "bg-card min-h-24 p-1.5 flex flex-col gap-1",
                      !isSameMonth(day, month) && "bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs w-5 h-5 flex items-center justify-center rounded-full",
                        isToday(day) &&
                          "bg-primary text-primary-foreground font-semibold",
                        !isSameMonth(day, month) && "text-muted-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {dayIssues.slice(0, 3).map((issue) => (
                        <Link
                          key={issue.id}
                          to={`/projects/${issue.project_id}/issues/${issue.id}/show`}
                          className="block"
                        >
                          <Badge
                            variant="outline"
                            className="w-full justify-start truncate text-[10px] font-normal px-1.5 py-0"
                            style={{
                              borderColor: issue.priority
                                ? PRIORITY_COLORS[issue.priority]
                                : undefined,
                            }}
                            title={`${issue.title} — ${projectNameById.get(String(issue.project_id)) ?? ""}`}
                          >
                            {issue.title}
                          </Badge>
                        </Link>
                      ))}
                      {dayIssues.length > 3 && (
                        <span className="text-[10px] text-muted-foreground px-1.5">
                          +{dayIssues.length - 3}{" "}
                          {translate("crm.pm.calendar.more", { _: "more" })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

IssueCalendar.path = "/pm/calendar";
