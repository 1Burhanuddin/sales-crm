import { required, useGetIdentity } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { DateInput } from "@/components/admin/date-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../../root/ConfigurationContext";

export const LeaveRequestInputs = () => {
  const { identity } = useGetIdentity();
  const { leaveTypes } = useConfigurationContext();
  const isAdmin = Boolean((identity as any)?.administrator);

  return (
    <div className="flex flex-col gap-4">
      <ReferenceInput source="employee_id" reference="employees">
        <AutocompleteInput
          label="resources.leave_requests.fields.employee_id"
          readOnly={!isAdmin}
          validate={required()}
          helperText={false}
        />
      </ReferenceInput>
      <SelectInput
        source="leave_type"
        choices={leaveTypes}
        optionText="label"
        optionValue="value"
        validate={required()}
        helperText={false}
      />
      <div className="flex gap-4">
        <DateInput
          source="from_date"
          validate={required()}
          helperText={false}
        />
        <DateInput source="to_date" validate={required()} helperText={false} />
      </div>
      <TextInput source="reason" multiline rows={3} helperText={false} />
    </div>
  );
};
