import { useGetIdentity, useListContext, useTranslate } from "ra-core";
import { matchPath, useLocation } from "react-router";
import { Kanban, Table as TableIcon } from "lucide-react";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { TopToolbar } from "../../layout/TopToolbar";
import { useViewMode } from "../../misc/useViewMode";
import { LeaveRequestCreate } from "./LeaveRequestCreate";
import { LeaveRequestEdit } from "./LeaveRequestEdit";
import { LeaveRequestListContent } from "./LeaveRequestListContent";
import { LeaveRequestShow } from "./LeaveRequestShow";
import { LeaveRequestTable } from "./LeaveRequestTable";

export const LeaveRequestList = () => {
  const { identity } = useGetIdentity();
  const [viewMode, setViewMode] = useViewMode<"kanban" | "table">(
    "leave-requests-view-mode",
    "kanban",
  );

  if (!identity) return null;

  return (
    <List
      perPage={100}
      title={false}
      sort={{ field: "created_at", order: "DESC" }}
      actions={
        <LeaveRequestActions viewMode={viewMode} setViewMode={setViewMode} />
      }
      pagination={null}
    >
      <LeaveRequestLayout viewMode={viewMode} />
    </List>
  );
};

const LeaveRequestLayout = ({
  viewMode,
}: {
  viewMode: "kanban" | "table";
}) => {
  const location = useLocation();
  const matchCreate = matchPath("/leave_requests/create", location.pathname);
  const matchShow = matchPath(
    "/leave_requests/:id/show",
    location.pathname,
  );
  const matchEdit = matchPath("/leave_requests/:id", location.pathname);

  const translate = useTranslate();
  const { data, isPending } = useListContext();
  if (isPending) return null;

  return (
    <div className="w-full">
      {viewMode === "table" ? (
        <LeaveRequestTable />
      ) : (
        <LeaveRequestListContent />
      )}
      {!data?.length && (
        <p className="text-center text-sm text-muted-foreground mt-8">
          {translate("resources.leave_requests.empty.title", {
            _: "No leave requests found",
          })}
        </p>
      )}
      <LeaveRequestCreate open={!!matchCreate} />
      <LeaveRequestEdit
        open={!!matchEdit && !matchCreate}
        id={matchEdit?.params.id}
      />
      <LeaveRequestShow open={!!matchShow} id={matchShow?.params.id} />
    </div>
  );
};

const LeaveRequestActions = ({
  viewMode,
  setViewMode,
}: {
  viewMode: "kanban" | "table";
  setViewMode: (mode: "kanban" | "table") => void;
}) => (
  <TopToolbar>
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
    <ExportButton />
    <CreateButton label="resources.leave_requests.action.new" />
  </TopToolbar>
);
