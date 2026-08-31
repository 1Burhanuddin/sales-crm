import { useListContext, useTranslate, type Identifier } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import { Kanban, Plus, Table as TableIcon } from "lucide-react";
import { List } from "@/components/admin/list";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { useViewMode } from "../misc/useViewMode";
import { IssueCreate } from "./IssueCreate";
import { IssueEdit } from "./IssueEdit";
import { IssueListContent } from "./IssueListContent";
import { IssueShow } from "./IssueShow";
import { IssueTable } from "./IssueTable";

export const IssueBoard = ({ projectId }: { projectId: Identifier }) => {
  const [viewMode, setViewMode] = useViewMode<"kanban" | "table">(
    "issues-view-mode",
    "table",
  );
  const isKanban = viewMode === "kanban";

  return (
    <List
      resource="issues"
      filter={{ project_id: projectId }}
      title={false}
      sort={{ field: "index", order: "DESC" }}
      // Kanban needs every issue at once (split across status columns, not
      // pages), so it fetches a large flat batch with pagination hidden.
      // Table view behaves like every other list page in the app.
      perPage={isKanban ? 100 : 25}
      pagination={isKanban ? null : undefined}
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
  viewMode: "kanban" | "table";
  setViewMode: (mode: "kanban" | "table") => void;
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

  const { data, isPending } = useListContext();
  if (isPending) return null;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={viewMode}
          onValueChange={(value) =>
            value && setViewMode(value as "kanban" | "table")
          }
        >
          <ToggleGroupItem value="kanban" aria-label="Kanban view">
            <Kanban className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <TableIcon className="h-4 w-4" />
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
