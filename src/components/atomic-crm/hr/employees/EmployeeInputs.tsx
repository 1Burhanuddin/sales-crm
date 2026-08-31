import { required, useGetIdentity } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { DateInput } from "@/components/admin/date-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../../root/ConfigurationContext";

export const EmployeeInputs = () => {
  const { identity } = useGetIdentity();
  const { departments, designations, employmentTypes, employeeStatuses } =
    useConfigurationContext();
  const isAdmin = Boolean((identity as any)?.administrator);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <TextInput
          source="first_name"
          validate={required()}
          helperText={false}
        />
        <TextInput
          source="last_name"
          validate={required()}
          helperText={false}
        />
      </div>
      <div className="flex gap-4">
        <TextInput source="email" helperText={false} />
        <TextInput source="phone" helperText={false} />
      </div>
      <TextInput
        source="employee_code"
        readOnly={!isAdmin}
        helperText={false}
      />
      <div className="flex gap-4">
        <SelectInput
          source="department"
          choices={departments}
          optionText="label"
          optionValue="value"
          readOnly={!isAdmin}
          helperText={false}
        />
        <SelectInput
          source="designation"
          choices={designations}
          optionText="label"
          optionValue="value"
          readOnly={!isAdmin}
          helperText={false}
        />
      </div>
      <div className="flex gap-4">
        <SelectInput
          source="employment_type"
          choices={employmentTypes}
          optionText="label"
          optionValue="value"
          readOnly={!isAdmin}
          helperText={false}
        />
        <SelectInput
          source="status"
          choices={employeeStatuses}
          optionText="label"
          optionValue="value"
          readOnly={!isAdmin}
          helperText={false}
        />
      </div>
      <div className="flex gap-4">
        <DateInput
          source="date_of_joining"
          readOnly={!isAdmin}
          helperText={false}
        />
        <DateInput
          source="date_of_leaving"
          readOnly={!isAdmin}
          helperText={false}
        />
      </div>
      <ReferenceInput source="sales_id" reference="sales">
        <AutocompleteInput
          label="resources.employees.fields.sales_id"
          readOnly={!isAdmin}
          helperText={false}
        />
      </ReferenceInput>
    </div>
  );
};
