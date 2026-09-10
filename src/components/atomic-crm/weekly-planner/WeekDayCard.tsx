import { format, isToday } from "date-fns";
import { Plus } from "lucide-react";
import { useCreate, useNotify, useTranslate, type Identifier } from "ra-core";
import { useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

/** One day of the My Week agenda: a full-width row (not a narrow grid
 * column -- task titles are sentence-length, so a 7-across grid just
 * forces them into an 8-line wrap; a stacked agenda, same shape as the
 * source planner's own day cards, gives them room). Tasks sorted by
 * time block, with a quick-add row so several can be dropped in
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
  const doneCount = sorted.filter((a) => a.status === "done").length;

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
      <CardHeader className="px-4 py-3 border-b flex flex-row items-baseline gap-2">
        <span className="text-sm font-semibold">{format(date, "EEEE")}</span>
        <span className="text-xs text-muted-foreground">
          {format(date, "MMM d")}
        </span>
        {sorted.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {doneCount}/{sorted.length}
          </span>
        )}
      </CardHeader>
      <CardContent className="px-4 py-3 flex flex-col gap-2.5">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground py-1">
            {translate("crm.weekly_planner.day.empty", { _: "No tasks yet" })}
          </p>
        )}
        {sorted.map((assignment) => (
          <div key={assignment.id} className="flex items-center gap-2.5">
            <Checkbox
              checked={assignment.status === "done"}
              onCheckedChange={() => onToggleDone(assignment)}
            />
            <Link
              to={`/assignments/${assignment.id}/show`}
              className="flex-1 min-w-0 flex items-center gap-2"
            >
              <p
                className={cn(
                  "text-sm leading-snug",
                  assignment.status === "done" &&
                    "line-through text-muted-foreground",
                )}
              >
                {assignment.title}
              </p>
              {assignment.time_block && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] font-normal text-muted-foreground"
                >
                  {translate(
                    `resources.assignments.time_block.${assignment.time_block}`,
                  )}
                </Badge>
              )}
            </Link>
          </div>
        ))}

        <div className="flex gap-2 mt-1 pt-2.5 border-t">
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
            className="h-8 text-sm flex-1"
          />
          <Select value={timeBlock} onValueChange={setTimeBlock}>
            <SelectTrigger size="sm" className="h-8 w-48 text-xs">
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
      </CardContent>
    </Card>
  );
};
