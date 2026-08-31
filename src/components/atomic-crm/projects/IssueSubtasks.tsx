import { useState } from "react";
import {
  useDataProvider,
  useGetIdentity,
  useGetList,
  useNotify,
  useRefresh,
  useTranslate,
  type Identifier,
} from "ra-core";
import { Plus } from "lucide-react";
import { Link } from "react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Issue } from "../types";

/** Checklist of child issues on a parent issue's detail page. Checking a
 * sub-task sets its status to 'done' (and back to the project's first
 * status when unchecked) -- a lightweight progress affordance, not a
 * replacement for opening the sub-task's own full status/priority/etc. */
export const IssueSubtasks = ({
  issue,
  projectId,
}: {
  issue: Issue;
  projectId: Identifier;
}) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const { identity } = useGetIdentity();
  const { issueStatuses } = useConfigurationContext();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: subtasks, isPending } = useGetList<Issue>("issues", {
    filter: { parent_id: issue.id },
    sort: { field: "created_at", order: "ASC" },
    pagination: { page: 1, perPage: 200 },
  });

  // Parent issues shouldn't themselves be nested (keep sub-tasks flat,
  // one level deep) -- issues already tagged as someone else's sub-task
  // don't get their own checklist here.
  if (issue.parent_id != null) return null;
  if (isPending) return null;

  const done = (subtasks ?? []).filter((t) => t.status === "done").length;
  const total = subtasks?.length ?? 0;

  const toggle = async (subtask: Issue) => {
    const isDone = subtask.status === "done";
    try {
      await dataProvider.update("issues", {
        id: subtask.id,
        data: { status: isDone ? (issueStatuses[0]?.value ?? "todo") : "done" },
        previousData: subtask,
      });
      refresh();
    } catch {
      notify("ra.notification.http_error", { type: "error" });
    }
  };

  const addSubtask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      await dataProvider.create("issues", {
        data: {
          title,
          project_id: projectId,
          parent_id: issue.id,
          sales_id: identity?.id,
          status: issueStatuses[0]?.value ?? "todo",
          index: 0,
        },
      });
      setNewTitle("");
      refresh();
    } catch {
      notify("ra.notification.http_error", { type: "error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="m-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground tracking-wide">
          {translate("resources.issues.subtasks.title", { _: "Sub-tasks" })}
        </span>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {translate("resources.issues.subtasks.progress", {
              done,
              total,
              _: `${done}/${total} done`,
            })}
          </span>
        )}
      </div>

      {total > 0 && (
        <ul className="flex flex-col gap-1.5 mb-2">
          {subtasks!.map((subtask) => (
            <li key={subtask.id} className="flex items-center gap-2">
              <Checkbox
                checked={subtask.status === "done"}
                onCheckedChange={() => toggle(subtask)}
              />
              <Link
                to={`/projects/${projectId}/issues/${subtask.id}/show`}
                className={`text-sm hover:underline flex-1 truncate ${
                  subtask.status === "done"
                    ? "line-through text-muted-foreground"
                    : ""
                }`}
              >
                {subtask.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSubtask();
            }
          }}
          placeholder={translate("resources.issues.subtasks.add_placeholder", {
            _: "Add a sub-task…",
          })}
          className="h-8 text-sm"
          disabled={adding}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0"
          onClick={addSubtask}
          disabled={adding || !newTitle.trim()}
        >
          {translate("ra.action.add")}
        </Button>
      </div>
    </div>
  );
};
