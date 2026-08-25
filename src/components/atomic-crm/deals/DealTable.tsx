import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { NumberField } from "@/components/admin/number-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { SelectField } from "@/components/admin/select-field";

import { useConfigurationContext } from "../root/ConfigurationContext";

export const DealTable = () => {
  const { dealStages, currency } = useConfigurationContext();

  return (
    <DataTable rowClick="show">
      <DataTable.Col source="name" />
      <DataTable.Col label="resources.deals.fields.company_id">
        <ReferenceField source="company_id" reference="companies" link={false} />
      </DataTable.Col>
      <DataTable.Col label="resources.deals.fields.stage">
        <SelectField
          source="stage"
          choices={dealStages}
          optionValue="value"
          optionText="label"
        />
      </DataTable.Col>
      <DataTable.Col label="resources.deals.fields.amount">
        <NumberField
          source="amount"
          options={{ style: "currency", currency }}
        />
      </DataTable.Col>
      <DataTable.Col label="resources.deals.fields.expected_closing_date">
        <DateField source="expected_closing_date" />
      </DataTable.Col>
      <DataTable.Col label="Sales Rep">
        <ReferenceField source="sales_id" reference="sales" link={false} />
      </DataTable.Col>
    </DataTable>
  );
};
