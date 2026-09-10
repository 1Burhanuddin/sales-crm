import { addWeeks, format, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCreate,
  useGetIdentity,
  useGetList,
  useNotify,
  useTranslate,
  useUpdate,
  type Identifier,
} from "ra-core";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import type { Assignment, WeeklyPlan } from "../types";
import { DailyReviewSection } from "./DailyReviewSection";
import { WeekDayCard } from "./WeekDayCard";
import { getWeekDays, getWeekStart, toDateKey } from "./weekUtils";

export const WeeklyPlannerPage = () => {
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const weekDays = getWeekDays(weekStart);
  const weekStartKey = toDateKey(weekStart);
  const weekEndKey = toDateKey(weekDays[6]);

  const {
    data: weekAssignments,
    isPending: assignmentsPending,
    refetch: refetchWeek,
  } = useGetList<Assignment>(
    "assignments",
    {
      pagination: { page: 1, perPage: 200 },
      sort: { field: "due_date", order: "ASC" },
      filter: identity
        ? {
            assignee_id: identity.id,
            "due_date@gte": weekStartKey,
            "due_date@lte": weekEndKey,
          }
        : undefined,
    },
    { enabled: !!identity },
  );

  const { data: waiting, refetch: refetchWaiting } = useGetList<Assignment>(
    "assignments",
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: "due_date", order: "ASC" },
      filter: identity
        ? {
            assignee_id: identity.id,
            "blocked_on@not.is": null,
            "status@neq": "done",
          }
        : undefined,
    },
    { enabled: !!identity },
  );

  const [update] = useUpdate<Assignment>();
  const notify = useNotify();

  const toggleDone = (assignment: Assignment) => {
    update(
      "assignments",
      {
        id: assignment.id,
        data: { status: assignment.status === "done" ? "todo" : "done" },
        previousData: assignment,
      },
      {
        onSuccess: () => {
          refetchWeek();
          refetchWaiting();
        },
        onError: () => notify("ra.notification.http_error", { type: "error" }),
      },
    );
  };

  const refetchAll = () => {
    refetchWeek();
    refetchWaiting();
  };

  const byDay = (day: Date) => {
    const key = toDateKey(day);
    return (weekAssignments ?? []).filter((a) => a.due_date === key);
  };

  const mustWin = (weekAssignments ?? []).filter((a) => a.priority === "high");
  const shouldWin = (weekAssignments ?? []).filter(
    (a) => a.priority === "medium",
  );

  return (
    <div className="mt-2 flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {translate("crm.weekly_planner.title", { _: "My Week" })}
        </h1>
        <Link to="/assignments" className="text-sm text-primary hover:underline">
          {translate("crm.weekly_planner.view_all_tasks", {
            _: "View all tasks",
          })}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {format(weekStart, "MMM d")} – {format(weekDays[6], "MMM d, yyyy")}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(getWeekStart(new Date()))}
          >
            {translate("crm.weekly_planner.this_week", { _: "This week" })}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekStart((w) => subWeeks(w, 1))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {identity && (
        <WeeklyFocusCard salesId={identity.id} weekStartKey={weekStartKey} />
      )}

      {assignmentsPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        identity && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {weekDays.map((day) => (
              <WeekDayCard
                key={toDateKey(day)}
                date={day}
                assignments={byDay(day)}
                assigneeId={identity.id}
                onToggleDone={toggleDone}
                onCreated={refetchAll}
              />
            ))}
          </div>
        )
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreboardCard
          title={translate("crm.weekly_planner.must_win", { _: "Must win" })}
          assignments={mustWin}
          onToggleDone={toggleDone}
          emptyLabel={translate("crm.weekly_planner.no_high_priority", {
            _: "No high-priority tasks this week",
          })}
        />
        <ScoreboardCard
          title={translate("crm.weekly_planner.should_win", {
            _: "Should win",
          })}
          assignments={shouldWin}
          onToggleDone={toggleDone}
          emptyLabel={translate("crm.weekly_planner.no_medium_priority", {
            _: "No medium-priority tasks this week",
          })}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {translate("crm.weekly_planner.waiting_on", { _: "Waiting on" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(waiting ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              {translate("crm.weekly_planner.nothing_waiting", {
                _: "Nothing marked as waiting on someone else",
              })}
            </p>
          )}
          {(waiting ?? []).map((a) => (
            <div key={a.id} className="flex items-start gap-2">
              <Checkbox
                className="mt-0.5"
                checked={a.status === "done"}
                onCheckedChange={() => toggleDone(a)}
              />
              <Link to={`/assignments/${a.id}/show`} className="flex-1 min-w-0">
                <p className="text-sm">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.blocked_on}</p>
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>

      {identity && <DailyReviewSection salesId={identity.id} />}
    </div>
  );
};

const ScoreboardCard = ({
  title,
  assignments,
  onToggleDone,
  emptyLabel,
}: {
  title: string;
  assignments: Assignment[];
  onToggleDone: (assignment: Assignment) => void;
  emptyLabel: string;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      {assignments.length === 0 && (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
      {assignments.map((a) => (
        <div key={a.id} className="flex items-center gap-2">
          <Checkbox
            checked={a.status === "done"}
            onCheckedChange={() => onToggleDone(a)}
          />
          <Link
            to={`/assignments/${a.id}/show`}
            className={
              a.status === "done"
                ? "text-sm line-through text-muted-foreground"
                : "text-sm"
            }
          >
            {a.title}
          </Link>
        </div>
      ))}
    </CardContent>
  </Card>
);

/** The week's free-text focus/goals/constraints note -- one row per
 * user per week, get-or-create on save (see budgets' CategoryBudgetRow
 * for the same pattern this mirrors). Filtered by sales_id explicitly,
 * not just relying on RLS -- an admin's select/update policy isn't
 * scoped to their own rows, so without this an admin's save could
 * silently overwrite another user's weekly focus note. */
const WeeklyFocusCard = ({
  salesId,
  weekStartKey,
}: {
  salesId: Identifier;
  weekStartKey: string;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const { data: matches, refetch } = useGetList<WeeklyPlan>("weekly_plans", {
    pagination: { page: 1, perPage: 1 },
    filter: { sales_id: salesId, week_start: weekStartKey },
  });
  const existing = matches?.[0];
  const [focus, setFocus] = useState(existing?.focus ?? "");
  const [update] = useUpdate<WeeklyPlan>();
  const [create] = useCreate<WeeklyPlan>();
  const [saving, setSaving] = useState(false);
  // Synchronous guard, not just `saving` state -- see CategoryBudgetRow
  // (AccountsDashboard.tsx) for why a state update alone can't close a
  // fast double-save race against this get-or-create pattern.
  const savingRef = useRef(false);

  // Sync local textarea state when a different week's record loads --
  // but not on every keystroke, so this keys off existing.id rather
  // than existing.focus.
  useEffect(() => {
    setFocus(existing?.focus ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const handleSave = () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const save = existing
      ? update("weekly_plans", {
          id: existing.id,
          data: { focus },
          previousData: existing,
        })
      : create("weekly_plans", { data: { week_start: weekStartKey, focus } });
    save
      .then(() => {
        notify("crm.weekly_planner.focus.saved", { _: "Saved" });
        refetch();
      })
      .catch(() => notify("ra.notification.http_error", { type: "error" }))
      .finally(() => {
        savingRef.current = false;
        setSaving(false);
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          {translate("crm.weekly_planner.focus.title", {
            _: "This week's focus",
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Textarea
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          rows={4}
          placeholder={translate("crm.weekly_planner.focus.placeholder", {
            _: "Goals, constraints, priorities for this week…",
          })}
        />
        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={saving}>
            {translate("ra.action.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

