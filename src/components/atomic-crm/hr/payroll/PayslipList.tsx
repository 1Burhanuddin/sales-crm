import { useTranslate } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { NumberField } from "@/components/admin/number-field";
import { ReferenceField } from "@/components/admin/reference-field";

import { TopToolbar } from "../../layout/TopToolbar";
import { useConfigurationContext } from "../../root/ConfigurationContext";

export const PayslipList = () => {
  const { currency } = useConfigurationContext();
  return (
    <List
      title={false}
      perPage={25}
      sort={{ field: "year", order: "DESC" }}
      actions={<PayslipListActions />}
    >
      <DataTable rowClick="show">
        <DataTable.Col label="resources.payslips.fields.employee_id">
          <ReferenceField source="employee_id" reference="employees" link={false} />
        </DataTable.Col>
        <DataTable.Col source="month" label="resources.payslips.fields.month" />
        <DataTable.Col source="year" label="resources.payslips.fields.year" />
        <DataTable.Col label="resources.payslips.fields.net_pay">
          <NumberField source="net_pay" options={{ style: "currency", currency }} />
        </DataTable.Col>
        <DataTable.Col source="status" label="resources.payslips.fields.status" />
      </DataTable>
    </List>
  );
};

const PayslipListActions = () => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ExportButton />
      <CreateButton
        label={translate("resources.payslips.action.new", {
          _: "New Payslip",
        })}
      />
    </TopToolbar>
  );
};
