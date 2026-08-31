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
import { Plus } from "lucide-react";
import type { SubmitHandler } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateInput } from "@/components/admin/date-input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { cn } from "@/lib/utils";

import type { Issue, Sprint } from "../types";

const SPRINT_STATUS_VALUES = ["planned", "active", "completed"] as const;

/** Sprint list + progress for one project, sitting above the issue board.
 * Selecting a sprint filters the board below it to just that sprint's
 * issues; selecting it again (or "All issues") clears the filter. */
export const SprintPanel = ({
  projectId,
  selectedSprintId,
  onSelectSprint,
}: {
  projectId: Identifier;
  selectedSprintId: Identifier | null;
  onSelectSprint: (id: Identifier | null) => void;
}) => {
  const translate = useTranslate();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: sprints, isPending: sprintsPending } = useGetList<Sprint>(
    "sprints",
    {
      filter: { project_id: projectId },
      sort: { field: "start_date", order: "DESC" },
      pagination: { page: 1, perPage: 100 },
    },
  );
  // Lightweight, status+sprint_id only would be ideal, but this app's
  // dataProvider doesn't support field projection -- perPage cap keeps it
  // bounded the same way IssueBoard's own kanban/timeline fetches do.
  const { data: issues } = useGetList<Issue>("issues", {
    filter: { project_id: projectId },
    pagination: { page: 1, perPage: 1000 },
  });

  if (sprintsPending) return null;
  if (!sprints || sprints.length === 0) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {translate("resources.sprints.empty", {
            _: "No sprints yet for this project.",
          })}
        </p>
        <NewSprintButton
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
          {translate("resources.sprints.name", { smart_count: 2 })}
        </h3>
        <NewSprintButton
          projectId={projectId}
          open={createOpen}
          setOpen={setCreateOpen}
        />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {selectedSprintId != null && (
          <button
            type="button"
            onClick={() => onSelectSprint(null)}
            className="shrink-0 text-xs text-primary hover:underline self-center"
          >
            {translate("resources.sprints.show_all", { _: "Show all issues" })}
          </button>
        )}
        {sprints.map((sprint) => {
          const sprintIssues = (issues ?? []).filter(
            (i) => i.sprint_id === sprint.id,
          );
          const done = sprintIssues.filter((i) => i.status === "done").length;
          const total = sprintIssues.length;
          const pct = total > 0 ? (done / total) * 100 : 0;
          const isSelected = selectedSprintId === sprint.id;

          return (
            <Card
              key={sprint.id}
              className={cn(
                "shrink-0 w-56 cursor-pointer transition-colors",
                isSelected && "border-primary",
              )}
              onClick={() => onSelectSprint(isSelected ? null : sprint.id)}
            >
              <CardContent className="p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {sprint.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] shrink-0",
                      sprint.status === "active" &&
                        "border-primary text-primary",
                    )}
                  >
                    {translate(`resources.sprints.status.${sprint.status}`, {
                      _: sprint.status,
                    })}
                  </Badge>
                </div>
                {(sprint.start_date || sprint.end_date) && (
                  <span className="text-xs text-muted-foreground">
                    {sprint.start_date ?? "—"} → {sprint.end_date ?? "—"}
                  </span>
                )}
                <div className="h-1.5 rounded-sm bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {translate("resources.sprints.progress", {
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

const NewSprintButton = ({
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
  const statusChoices = SPRINT_STATUS_VALUES.map((value) => ({
    value,
    label: translate(`resources.sprints.status.${value}`, { _: value }),
  }));

  const onSubmit: SubmitHandler<any> = async (data) => {
    try {
      await dataProvider.create("sprints", {
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
        {translate("resources.sprints.action.new", { _: "New Sprint" })}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>
            {translate("resources.sprints.action.new", { _: "New Sprint" })}
          </DialogTitle>
          <Form
            onSubmit={onSubmit}
            defaultValues={{ status: "planned" }}
            className="flex flex-col gap-4"
          >
            <TextInput source="name" validate={required()} helperText={false} />
            <div className="flex gap-4">
              <DateInput source="start_date" helperText={false} />
              <DateInput source="end_date" helperText={false} />
            </div>
            <SelectInput
              source="status"
              choices={statusChoices}
              optionText="label"
              optionValue="value"
              helperText={false}
            />
            <div className="flex justify-end">
              <Button type="submit">
                {translate("ra.action.save")}
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
