import { format, isToday } from "date-fns";
import { Plus } from "lucide-react";
import { useCreate, useNotify, useTranslate, type Identifier } from "ra-core";
import { useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { TIME_BLOCK_CHOICES, TIME_BLOCK_ORDER } from "../assignments/choices";
import type { Assignment } from "../types";

/** One day of the My Week grid: that day's tasks (checkable, sorted by
 * time block) plus a quick-add row so several tasks can be dropped in
 * without opening the full Assignment form each time. */
export const WeekDayCard = ({
  date,
  assignments,
  assigneeId,
  onToggleDone,
  onCreated,
}: {
  date: Date;
  assignments: Assignment[];
  assigneeId: Identifier;
  onToggleDone: (assignment: Assignment) => void;
  onCreated: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [create, { isPending }] = useCreate();
  const [title, setTitle] = useState("");
  const [timeBlock, setTimeBlock] = useState<string>("");

  const sorted = [...assignments].sort((a, b) => {
    const aOrder = a.time_block ? TIME_BLOCK_ORDER[a.time_block] ?? 999 : 999;
    const bOrder = b.time_block ? TIME_BLOCK_ORDER[b.time_block] ?? 999 : 999;
    return aOrder - bOrder;
  });

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed || isPending) return;
    create(
      "assignments",
      {
        data: {
          title: trimmed,
          status: "todo",
          due_date: format(date, "yyyy-MM-dd"),
          time_block: timeBlock || null,
          assignee_id: assigneeId,
        },
      },
      {
        onSuccess: () => {
          setTitle("");
          setTimeBlock("");
          onCreated();
        },
        onError: () => notify("ra.notification.http_error", { type: "error" }),
      },
    );
  };

  return (
    <Card className={cn("py-0 gap-0", isToday(date) && "border-primary")}>
      <CardHeader className="px-3 py-2.5 border-b">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>{format(date, "EEE")}</span>
          <span className="text-xs text-muted-foreground font-normal">
            {format(date, "MMM d")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-2.5 flex flex-col gap-2">
        {sorted.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">
            {translate("crm.weekly_planner.day.empty", { _: "No tasks yet" })}
          </p>
        )}
        {sorted.map((assignment) => (
          <div key={assignment.id} className="flex items-start gap-2">
            <Checkbox
              className="mt-0.5"
              checked={assignment.status === "done"}
              onCheckedChange={() => onToggleDone(assignment)}
            />
            <Link
              to={`/assignments/${assignment.id}/show`}
              className="flex-1 min-w-0"
            >
              <p
                className={cn(
                  "text-sm leading-tight",
                  assignment.status === "done" &&
                    "line-through text-muted-foreground",
                )}
              >
                {assignment.title}
              </p>
              {assignment.time_block && (
                <Badge variant="outline" className="mt-1 text-[10px]">
                  {translate(
                    `resources.assignments.time_block.${assignment.time_block}`,
                  )}
                </Badge>
              )}
            </Link>
          </div>
        ))}

        <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={translate("crm.weekly_planner.day.add_placeholder", {
              _: "Add a task…",
            })}
            className="h-8 text-sm"
          />
          <div className="flex gap-1.5">
            <Select value={timeBlock} onValueChange={setTimeBlock}>
              <SelectTrigger size="sm" className="h-8 flex-1 text-xs">
                <SelectValue
                  placeholder={translate(
                    "resources.assignments.fields.time_block",
                    { _: "Time block" },
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {TIME_BLOCK_CHOICES.map((choice) => (
                  <SelectItem key={choice.id} value={choice.id}>
                    {translate(choice.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!title.trim() || isPending}
              className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50"
              aria-label={translate("crm.weekly_planner.day.add", {
                _: "Add task",
              })}
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
