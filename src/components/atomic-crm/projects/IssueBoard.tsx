import { useListContext, useTranslate, type Identifier } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import {
  GanttChartSquare,
  Kanban,
  Plus,
  Table as TableIcon,
} from "lucide-react";
import { List } from "@/components/admin/list";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { useViewMode } from "../misc/useViewMode";
import type { Issue } from "../types";
import { IssueCreate } from "./IssueCreate";
import { IssueEdit } from "./IssueEdit";
import { IssueListContent } from "./IssueListContent";
import { IssueShow } from "./IssueShow";
import { IssueTable } from "./IssueTable";
import { IssueTimeline } from "./IssueTimeline";

type ViewMode = "kanban" | "table" | "timeline";

export const IssueBoard = ({
  projectId,
  sprintId,
}: {
  projectId: Identifier;
  sprintId?: Identifier | null;
}) => {
  const [viewMode, setViewMode] = useViewMode<ViewMode>(
    "issues-view-mode",
    "table",
  );
  const isKanban = viewMode === "kanban";

  return (
    <List
      resource="issues"
      filter={
        sprintId != null
          ? { project_id: projectId, sprint_id: sprintId }
          : { project_id: projectId }
      }
      title={false}
      sort={{ field: "index", order: "DESC" }}
      // Kanban and timeline both need every issue at once (split across
      // status columns / plotted on one axis, not paged), so they fetch a
      // large flat batch with pagination hidden. Table view behaves like
      // every other list page in the app.
      perPage={viewMode === "table" ? 25 : 100}
      pagination={isKanban || viewMode === "timeline" ? null : undefined}
      actions={false}
      empty={false}
    >
      <IssueBoardLayout
        projectId={projectId}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    </List>
  );
};

const IssueBoardLayout = ({
  projectId,
  viewMode,
  setViewMode,
}: {
  projectId: Identifier;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}) => {
  const translate = useTranslate();
  const location = useLocation();
  const matchCreate = matchPath(
    "/projects/:id/issues/create",
    location.pathname,
  );
  const matchShow = matchPath(
    "/projects/:id/issues/:issueId/show",
    location.pathname,
  );
  const matchEdit = matchPath(
    "/projects/:id/issues/:issueId",
    location.pathname,
  );

  const { data, isPending } = useListContext<Issue>();
  if (isPending) return null;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
        >
          <ToggleGroupItem value="kanban" aria-label="Kanban view">
            <Kanban className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <TableIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="timeline" aria-label="Timeline view">
            <GanttChartSquare className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <Button asChild size="sm" className="gap-2">
          <Link to={`/projects/${projectId}/issues/create`}>
            <Plus className="h-4 w-4" />
            {translate("resources.issues.action.new", { _: "New Issue" })}
          </Link>
        </Button>
      </div>

      {!data?.length ? (
        <p className="text-sm text-muted-foreground">
          {translate("resources.issues.empty.description")}
        </p>
      ) : viewMode === "table" ? (
        <IssueTable />
      ) : viewMode === "timeline" ? (
        <IssueTimeline projectId={projectId} issues={data} />
      ) : (
        <IssueListContent projectId={projectId} />
      )}

      <IssueCreate open={!!matchCreate} projectId={projectId} />
      <IssueEdit
        open={!!matchEdit && !matchCreate}
        id={matchEdit?.params.issueId}
        projectId={projectId}
      />
      <IssueShow
        open={!!matchShow}
        id={matchShow?.params.issueId}
        projectId={projectId}
      />
    </div>
  );
};
