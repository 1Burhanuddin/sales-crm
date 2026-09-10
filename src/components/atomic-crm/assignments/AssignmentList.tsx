import { useRecordContext, useTranslate } from "ra-core";
import { Kanban, Table as TableIcon } from "lucide-react";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { TopToolbar } from "../layout/TopToolbar";
import { useViewMode } from "../misc/useViewMode";
import type { Assignment } from "../types";
import { AssignmentBoard } from "./AssignmentBoard";
import { STATUS_CHOICES, TIME_BLOCK_CHOICES } from "./choices";

const filters = [
  <SearchInput source="q" alwaysOn />,
  <ReferenceInput source="assignee_id" reference="sales">
    <AutocompleteInput
      label="resources.assignments.fields.assignee_id"
      popoverClassName="min-w-64"
    />
  </ReferenceInput>,
  <SelectInput source="status" choices={STATUS_CHOICES} label="resources.assignments.fields.status" />,
  <SelectInput
    source="time_block"
    choices={TIME_BLOCK_CHOICES}
    label="resources.assignments.fields.time_block"
  />,
];

export const AssignmentList = () => {
  const [viewMode, setViewMode] = useViewMode<"kanban" | "table">(
    "assignments-view-mode",
    "table",
  );
  const isKanban = viewMode === "kanban";

  return (
    <List
      title={false}
      filters={filters}
      sort={{ field: "due_date", order: "ASC" }}
      actions={<AssignmentListActions viewMode={viewMode} setViewMode={setViewMode} />}
      // Kanban needs every matching assignment at once (split across
      // status columns, not paged), same reasoning as IssueBoard.
      perPage={isKanban ? 100 : 50}
      pagination={isKanban ? null : undefined}
    >
      {isKanban ? (
        <AssignmentBoard />
      ) : (
        <DataTable rowClick="show">
          <DataTable.Col source="title" />
          <DataTable.Col label="resources.assignments.fields.assignee_id">
            <ReferenceField source="assignee_id" reference="sales" link={false} />
          </DataTable.Col>
          <DataTable.Col label="resources.assignments.fields.status">
            <StatusField />
          </DataTable.Col>
          <DataTable.Col label="resources.assignments.fields.priority">
            <PriorityField />
          </DataTable.Col>
          <DataTable.Col label="resources.assignments.fields.due_date">
            <DateField source="due_date" />
          </DataTable.Col>
          <DataTable.Col label="resources.assignments.fields.time_block">
            <TimeBlockField />
          </DataTable.Col>
          <DataTable.Col label="resources.assignments.fields.sales_id">
            <ReferenceField source="sales_id" reference="sales" link={false} />
          </DataTable.Col>
        </DataTable>
      )}
    </List>
  );
};

const STATUS_VARIANT: Record<string, "outline" | "default" | "secondary"> = {
  todo: "outline",
  in_progress: "default",
  done: "secondary",
};

// DataTable.Col can't take a render-prop function as children directly --
// needs a real field component reading the record via context.
const StatusField = () => {
  const translate = useTranslate();
  const record = useRecordContext<Assignment>();
  if (!record) return null;
  return (
    <Badge variant={STATUS_VARIANT[record.status] ?? "outline"}>
      {translate(`resources.assignments.status.${record.status}`)}
    </Badge>
  );
};

const PriorityField = () => {
  const translate = useTranslate();
  const record = useRecordContext<Assignment>();
  if (!record?.priority) return null;
  return (
    <span className="text-sm text-muted-foreground">
      {translate(`resources.assignments.priority.${record.priority}`)}
    </span>
  );
};

const TimeBlockField = () => {
  const translate = useTranslate();
  const record = useRecordContext<Assignment>();
  if (!record?.time_block) return null;
  return (
    <span className="text-sm text-muted-foreground">
      {translate(`resources.assignments.time_block.${record.time_block}`)}
    </span>
  );
};

const AssignmentListActions = ({
  viewMode,
  setViewMode,
}: {
  viewMode: "kanban" | "table";
  setViewMode: (mode: "kanban" | "table") => void;
}) => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={viewMode}
        onValueChange={(value) => value && setViewMode(value as "kanban" | "table")}
      >
        <ToggleGroupItem value="kanban" aria-label="Kanban view">
          <Kanban className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view">
          <TableIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <ExportButton />
      <CreateButton
        label={translate("resources.assignments.action.create", {
          _: "New task",
        })}
      />
    </TopToolbar>
  );
};
