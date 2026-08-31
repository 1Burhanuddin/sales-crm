import { useTranslate } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { NumberField } from "@/components/admin/number-field";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SearchInput } from "@/components/admin/search-input";
import { SelectField } from "@/components/admin/select-field";
import { SelectInput } from "@/components/admin/select-input";

import { TopToolbar } from "../layout/TopToolbar";
import { useConfigurationContext } from "../root/ConfigurationContext";

export const TransactionList = () => {
  const { transactionCategories, currency } = useConfigurationContext();
  const filters = [
    <SearchInput source="q" alwaysOn />,
    <SelectInput
      source="category"
      choices={transactionCategories}
      optionText="label"
      optionValue="value"
      label={false}
      placeholder="Category"
    />,
    <ReferenceInput source="statement_import_id" reference="statement_imports">
      <AutocompleteInput label={false} placeholder="Statement" />
    </ReferenceInput>,
  ];

  return (
    <List
      title={false}
      perPage={25}
      filters={filters}
      sort={{ field: "date", order: "DESC" }}
      actions={<TransactionListActions />}
    >
      <DataTable rowClick="edit">
        <DataTable.Col label="resources.transactions.fields.date">
          <DateField source="date" />
        </DataTable.Col>
        <DataTable.Col
          source="description"
          cellClassName="max-w-[360px] truncate"
        />
        <DataTable.Col label="resources.transactions.fields.category">
          <SelectField
            source="category"
            choices={transactionCategories}
            optionValue="value"
            optionText="label"
          />
        </DataTable.Col>
        <DataTable.Col label="resources.transactions.fields.amount">
          <NumberField source="amount" options={{ style: "currency", currency }} />
        </DataTable.Col>
        <DataTable.Col source="source" label="resources.transactions.fields.source" />
      </DataTable>
    </List>
  );
};

const TransactionListActions = () => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ExportButton />
      <CreateButton
        label={translate("resources.transactions.action.new", {
          _: "Add Transaction",
        })}
      />
    </TopToolbar>
  );
};
