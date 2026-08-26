import { useTranslate } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceField } from "@/components/admin/reference-field";
import { SearchInput } from "@/components/admin/search-input";

import { TopToolbar } from "../layout/TopToolbar";

const filters = [<SearchInput source="q" alwaysOn />];

export const ProjectList = () => {
  const translate = useTranslate();
  return (
    <List
      title={false}
      perPage={25}
      filters={filters}
      sort={{ field: "created_at", order: "DESC" }}
      actions={<ProjectListActions />}
    >
      <DataTable rowClick="show">
        <DataTable.Col source="name" cellClassName="max-w-[240px] truncate" />
        <DataTable.Col
          source="description"
          cellClassName="max-w-[320px] truncate"
        />
        <DataTable.Col
          source="nb_issues"
          label="resources.projects.fields.nb_issues"
        />
        <DataTable.Col label="resources.projects.fields.created_at">
          <DateField source="created_at" />
        </DataTable.Col>
        <DataTable.Col label="Owner">
          <ReferenceField source="sales_id" reference="sales" link={false} />
        </DataTable.Col>
      </DataTable>
    </List>
  );
};

const ProjectListActions = () => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ExportButton />
      <CreateButton
        label={translate("resources.projects.action.new", {
          _: "New Project",
        })}
      />
    </TopToolbar>
  );
};
