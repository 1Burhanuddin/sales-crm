import { useRecordContext, useTranslate } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { NumberField } from "@/components/admin/number-field";
import { SearchInput } from "@/components/admin/search-input";
import { SelectField } from "@/components/admin/select-field";
import { Badge } from "@/components/ui/badge";

import { TopToolbar } from "../layout/TopToolbar";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { RecurringExpense } from "../types";
import { SCOPE_CHOICES } from "./scope";

const filters = [<SearchInput source="q" alwaysOn />];

export const RecurringExpenseList = () => {
  const { transactionCategories, currency } = useConfigurationContext();

  return (
    <List
      title={false}
      perPage={50}
      filters={filters}
      sort={{ field: "due_day", order: "ASC" }}
      actions={<RecurringExpenseListActions />}
    >
      <DataTable rowClick="edit">
        <DataTable.Col source="name" />
        <DataTable.Col label="resources.recurring_expenses.fields.amount">
          <NumberField source="amount" options={{ style: "currency", currency }} />
        </DataTable.Col>
        <DataTable.Col
          source="due_day"
          label="resources.recurring_expenses.fields.due_day"
        />
        <DataTable.Col label="resources.recurring_expenses.fields.category">
          <SelectField
            source="category"
            choices={transactionCategories}
            optionValue="value"
            optionText="label"
          />
        </DataTable.Col>
        <DataTable.Col label="resources.recurring_expenses.fields.scope">
          <SelectField
            source="scope"
            choices={SCOPE_CHOICES}
            optionValue="value"
            optionText="label"
          />
        </DataTable.Col>
        <DataTable.Col label="resources.recurring_expenses.fields.active">
          <ActiveField />
        </DataTable.Col>
      </DataTable>
    </List>
  );
};

// DataTable.Col can't take a render-prop function as children directly --
// needs a real field component reading the record via context.
const ActiveField = () => {
  const translate = useTranslate();
  const record = useRecordContext<RecurringExpense>();
  if (!record) return null;
  return record.active ? (
    <Badge variant="outline">
      {translate("resources.recurring_expenses.status.active", { _: "Active" })}
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground">
      {translate("resources.recurring_expenses.status.inactive", { _: "Inactive" })}
    </Badge>
  );
};

const RecurringExpenseListActions = () => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ExportButton />
      <CreateButton
        label={translate("resources.recurring_expenses.action.create", {
          _: "Add Recurring Expense",
        })}
      />
    </TopToolbar>
  );
};
