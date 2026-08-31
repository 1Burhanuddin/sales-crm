import { useTranslate } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";

import { TopToolbar } from "../../layout/TopToolbar";

const filters = [<SearchInput source="q" alwaysOn />];

export const EmployeeList = () => {
  return (
    <List
      title={false}
      perPage={25}
      filters={filters}
      sort={{ field: "first_name", order: "ASC" }}
      actions={<EmployeeListActions />}
    >
      <DataTable rowClick="show">
        <DataTable.Col source="first_name" />
        <DataTable.Col source="last_name" />
        <DataTable.Col source="department" />
        <DataTable.Col source="designation" />
        <DataTable.Col source="employment_type" />
        <DataTable.Col source="status" />
        <DataTable.Col label="resources.employees.fields.date_of_joining">
          <DateField source="date_of_joining" />
        </DataTable.Col>
      </DataTable>
    </List>
  );
};

const EmployeeListActions = () => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ExportButton />
      <CreateButton
        label={translate("resources.employees.action.new", {
          _: "New Employee",
        })}
      />
    </TopToolbar>
  );
};
