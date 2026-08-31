import { useState } from "react";
import {
  Form,
  required,
  useDataProvider,
  useGetIdentity,
  useGetList,
  useNotify,
  useRefresh,
  useTranslate,
  type Identifier,
} from "ra-core";
import { isPast, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import type { SubmitHandler } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateInput } from "@/components/admin/date-input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TextInput } from "@/components/admin/text-input";
import { cn } from "@/lib/utils";

import type { Issue, Milestone } from "../types";

/** Milestone list + progress for one project. Unlike a sprint (a date
 * range grouping issues into a work cycle), a milestone is a single
 * due-date target -- issues can be tagged to one, and its card shows
 * what fraction of them are done. Selecting one filters the issue board
 * below it, same interaction as SprintPanel. */
export const MilestonePanel = ({
  projectId,
  selectedMilestoneId,
  onSelectMilestone,
}: {
  projectId: Identifier;
  selectedMilestoneId: Identifier | null;
  onSelectMilestone: (id: Identifier | null) => void;
}) => {
  const translate = useTranslate();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: milestones, isPending: milestonesPending } =
    useGetList<Milestone>("milestones", {
      filter: { project_id: projectId },
      sort: { field: "due_date", order: "ASC" },
      pagination: { page: 1, perPage: 100 },
    });
  const { data: issues } = useGetList<Issue>("issues", {
    filter: { project_id: projectId },
    pagination: { page: 1, perPage: 1000 },
  });

  if (milestonesPending) return null;
  if (!milestones || milestones.length === 0) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {translate("resources.milestones.empty", {
            _: "No milestones yet for this project.",
          })}
        </p>
        <NewMilestoneButton
          projectId={projectId}
          open={createOpen}
          setOpen={setCreateOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {translate("resources.milestones.name", { smart_count: 2 })}
        </h3>
        <NewMilestoneButton
          projectId={projectId}
          open={createOpen}
          setOpen={setCreateOpen}
        />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {selectedMilestoneId != null && (
          <button
            type="button"
            onClick={() => onSelectMilestone(null)}
            className="shrink-0 text-xs text-primary hover:underline self-center"
          >
            {translate("resources.milestones.show_all", {
              _: "Show all issues",
            })}
          </button>
        )}
        {milestones.map((milestone) => {
          const milestoneIssues = (issues ?? []).filter(
            (i) => i.milestone_id === milestone.id,
          );
          const done = milestoneIssues.filter(
            (i) => i.status === "done",
          ).length;
          const total = milestoneIssues.length;
          const pct = total > 0 ? (done / total) * 100 : 0;
          const isSelected = selectedMilestoneId === milestone.id;
          const isOverdue =
            !!milestone.due_date &&
            isPast(parseISO(milestone.due_date)) &&
            (total === 0 || done < total);

          return (
            <Card
              key={milestone.id}
              className={cn(
                "shrink-0 w-56 cursor-pointer transition-colors",
                isSelected && "border-primary",
              )}
              onClick={() =>
                onSelectMilestone(isSelected ? null : milestone.id)
              }
            >
              <CardContent className="p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {milestone.name}
                  </span>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-[10px] shrink-0">
                      {translate("resources.milestones.overdue", {
                        _: "Overdue",
                      })}
                    </Badge>
                  )}
                </div>
                {milestone.due_date && (
                  <span className="text-xs text-muted-foreground">
                    {translate("resources.milestones.due", {
                      _: "Due",
                    })}{" "}
                    {milestone.due_date}
                  </span>
                )}
                <div className="h-1.5 rounded-sm bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {translate("resources.milestones.progress", {
                    done,
                    total,
                    _: `${done}/${total} done`,
                  })}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const NewMilestoneButton = ({
  projectId,
  open,
  setOpen,
}: {
  projectId: Identifier;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const refresh = useRefresh();

  const onSubmit: SubmitHandler<any> = async (data) => {
    try {
      await dataProvider.create("milestones", {
        data: { ...data, project_id: projectId, sales_id: identity?.id },
      });
      setOpen(false);
      refresh();
    } catch {
      notify("ra.notification.http_error", { type: "error" });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        {translate("resources.milestones.action.new", { _: "New Milestone" })}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>
            {translate("resources.milestones.action.new", {
              _: "New Milestone",
            })}
          </DialogTitle>
          <Form onSubmit={onSubmit} className="flex flex-col gap-4">
            <TextInput source="name" validate={required()} helperText={false} />
            <TextInput
              source="description"
              multiline
              rows={2}
              helperText={false}
            />
            <DateInput source="due_date" helperText={false} />
            <div className="flex justify-end">
              <Button type="submit">{translate("ra.action.save")}</Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
