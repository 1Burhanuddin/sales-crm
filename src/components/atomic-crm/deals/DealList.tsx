import { useGetIdentity, useListContext, useTranslate } from "ra-core";
import { matchPath, useLocation } from "react-router";
import { Kanban, Table as TableIcon } from "lucide-react";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceInput } from "@/components/admin/reference-input";
import { FilterButton } from "@/components/admin/filter-form";
import { SearchInput } from "@/components/admin/search-input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

import { TopToolbar } from "../layout/TopToolbar";
import { useViewMode } from "../misc/useViewMode";
import { DealArchivedList } from "./DealArchivedList";
import { DealCreate } from "./DealCreate";
import { DealEdit } from "./DealEdit";
import { DealEmpty } from "./DealEmpty";
import { DealListContent } from "./DealListContent";
import { DealShow } from "./DealShow";
import { DealTable } from "./DealTable";
import { OnlyMineInput } from "./OnlyMineInput";

const DealList = () => {
  const { identity } = useGetIdentity();
  const translate = useTranslate();
  const [viewMode, setViewMode] = useViewMode<"kanban" | "table">(
    "deals-view-mode",
    "kanban",
  );

  if (!identity) return null;

  const dealFilters = [
    <SearchInput source="q" alwaysOn />,
    <ReferenceInput source="company_id" reference="companies">
      <AutocompleteInput
        label={false}
        placeholder={translate("resources.deals.fields.company_id")}
      />
    </ReferenceInput>,
    <OnlyMineInput source="sales_id" alwaysOn />,
  ];

  return (
    <List
      perPage={100}
      filter={{ "archived_at@is": null }}
      title={false}
      sort={{ field: "index", order: "DESC" }}
      filters={dealFilters}
      actions={<DealActions viewMode={viewMode} setViewMode={setViewMode} />}
      pagination={null}
    >
      <DealLayout viewMode={viewMode} />
    </List>
  );
};

const DealLayout = ({ viewMode }: { viewMode: "kanban" | "table" }) => {
  const location = useLocation();
  const matchCreate = matchPath("/deals/create", location.pathname);
  const matchShow = matchPath("/deals/:id/show", location.pathname);
  const matchEdit = matchPath("/deals/:id", location.pathname);

  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;
  if (!data?.length && !hasFilters)
    return (
      <>
        <DealEmpty>
          <DealShow open={!!matchShow} id={matchShow?.params.id} />
          <DealArchivedList />
        </DealEmpty>
      </>
    );

  return (
    <div className="w-full">
      {viewMode === "table" ? <DealTable /> : <DealListContent />}
      <DealArchivedList />
      <DealCreate open={!!matchCreate} />
      <DealEdit open={!!matchEdit && !matchCreate} id={matchEdit?.params.id} />
      <DealShow open={!!matchShow} id={matchShow?.params.id} />
    </div>
  );
};

const DealActions = ({
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
      onValueChange={(value) => value && setViewMode(value as "kanban" | "table")}
    >
      <ToggleGroupItem value="kanban" aria-label="Kanban view">
        <Kanban className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view">
        <TableIcon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
    <FilterButton />
    <ExportButton />
    <CreateButton label="resources.deals.action.new" />
  </TopToolbar>
);

export default DealList;
