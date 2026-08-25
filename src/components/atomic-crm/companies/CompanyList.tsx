import { useGetIdentity, useListContext, useTranslate } from "ra-core";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ListPagination } from "@/components/admin/list-pagination";
import { SortButton } from "@/components/admin/sort-button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { TopToolbar } from "../layout/TopToolbar";
import { useViewMode } from "../misc/useViewMode";
import { CompanyEmpty } from "./CompanyEmpty";
import { CompanyListFilter } from "./CompanyListFilter";
import { CompanyTable } from "./CompanyTable";
import { ImageList } from "./GridList";

export const CompanyList = () => {
  const { identity } = useGetIdentity();
  const [viewMode, setViewMode] = useViewMode<"grid" | "table">(
    "companies-view-mode",
    "table",
  );
  if (!identity) return null;
  return (
    <List
      title={false}
      perPage={25}
      sort={{ field: "name", order: "ASC" }}
      actions={
        <CompanyListActions viewMode={viewMode} setViewMode={setViewMode} />
      }
      pagination={<ListPagination rowsPerPageOptions={[10, 25, 50, 100]} />}
    >
      <CompanyListLayout viewMode={viewMode} />
    </List>
  );
};

const CompanyListLayout = ({ viewMode }: { viewMode: "grid" | "table" }) => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;
  if (!data?.length && !hasFilters) return <CompanyEmpty />;

  return (
    <div className="w-full flex flex-row gap-8">
      <CompanyListFilter />
      <div className="flex flex-col flex-1 gap-4">
        {viewMode === "table" ? <CompanyTable /> : <ImageList />}
      </div>
    </div>
  );
};

const CompanyListActions = ({
  viewMode,
  setViewMode,
}: {
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
}) => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={viewMode}
        onValueChange={(value) =>
          value && setViewMode(value as "grid" | "table")
        }
      >
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <LayoutGrid className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view">
          <TableIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <SortButton fields={["name", "created_at", "nb_contacts"]} />
      <ExportButton />
      <CreateButton
        label={translate("resources.companies.action.new", {
          _: "New Company",
        })}
      />
    </TopToolbar>
  );
};
