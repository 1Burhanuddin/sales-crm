import { useTranslate } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceField } from "@/components/admin/reference-field";
import { SelectField } from "@/components/admin/select-field";

import { TopToolbar } from "../../layout/TopToolbar";
import { useConfigurationContext } from "../../root/ConfigurationContext";

export const AttendanceList = () => {
  const { attendanceStatuses } = useConfigurationContext();
  return (
    <List
      title={false}
      perPage={25}
      sort={{ field: "date", order: "DESC" }}
      actions={<AttendanceListActions />}
    >
      <DataTable rowClick="edit">
        <DataTable.Col label="resources.attendance_records.fields.employee_id">
          <ReferenceField source="employee_id" reference="employees" link={false} />
        </DataTable.Col>
        <DataTable.Col label="resources.attendance_records.fields.date">
          <DateField source="date" />
        </DataTable.Col>
        <DataTable.Col label="resources.attendance_records.fields.status">
          <SelectField
            source="status"
            choices={attendanceStatuses}
            optionValue="value"
            optionText="label"
          />
        </DataTable.Col>
        <DataTable.Col
          source="check_in"
          label="resources.attendance_records.fields.check_in"
        />
        <DataTable.Col
          source="check_out"
          label="resources.attendance_records.fields.check_out"
        />
      </DataTable>
    </List>
  );
};

const AttendanceListActions = () => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ExportButton />
      <CreateButton
        label={translate("resources.attendance_records.action.new", {
          _: "Log Attendance",
        })}
      />
    </TopToolbar>
  );
};
