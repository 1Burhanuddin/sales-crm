import { required, useGetIdentity } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { DateInput } from "@/components/admin/date-input";
import { DateTimeInput } from "@/components/admin/date-time-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../../root/ConfigurationContext";

export const AttendanceInputs = () => {
  const { identity } = useGetIdentity();
  const { attendanceStatuses } = useConfigurationContext();
  const isAdmin = Boolean((identity as any)?.administrator);

  return (
    <div className="flex flex-col gap-4">
      <ReferenceInput source="employee_id" reference="employees">
        <AutocompleteInput
          label="resources.attendance_records.fields.employee_id"
          readOnly={!isAdmin}
          validate={required()}
          helperText={false}
        />
      </ReferenceInput>
      <div className="flex gap-4">
        <DateInput
          source="date"
          validate={required()}
          helperText={false}
        />
        <SelectInput
          source="status"
          choices={attendanceStatuses}
          optionText="label"
          optionValue="value"
          validate={required()}
          helperText={false}
        />
      </div>
      <div className="flex gap-4">
        <DateTimeInput source="check_in" helperText={false} />
        <DateTimeInput source="check_out" helperText={false} />
      </div>
      <TextInput source="notes" multiline rows={2} helperText={false} />
    </div>
  );
};
