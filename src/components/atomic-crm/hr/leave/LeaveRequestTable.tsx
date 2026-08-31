import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { SelectField } from "@/components/admin/select-field";

import { useConfigurationContext } from "../../root/ConfigurationContext";
import { LEAVE_REQUEST_STATUSES } from "./leaveRequestStatuses";

export const LeaveRequestTable = () => {
  const { leaveTypes } = useConfigurationContext();

  return (
    <DataTable rowClick="show">
      <DataTable.Col label="resources.leave_requests.fields.employee_id">
        <ReferenceField source="employee_id" reference="employees" link={false} />
      </DataTable.Col>
      <DataTable.Col label="resources.leave_requests.fields.leave_type">
        <SelectField
          source="leave_type"
          choices={leaveTypes}
          optionValue="value"
          optionText="label"
        />
      </DataTable.Col>
      <DataTable.Col label="resources.leave_requests.fields.from_date">
        <DateField source="from_date" />
      </DataTable.Col>
      <DataTable.Col label="resources.leave_requests.fields.to_date">
        <DateField source="to_date" />
      </DataTable.Col>
      <DataTable.Col source="days" label="resources.leave_requests.fields.days" />
      <DataTable.Col label="resources.leave_requests.fields.status">
        <SelectField
          source="status"
          choices={LEAVE_REQUEST_STATUSES as unknown as { value: string; label: string }[]}
          optionValue="value"
          optionText="label"
        />
      </DataTable.Col>
    </DataTable>
  );
};
