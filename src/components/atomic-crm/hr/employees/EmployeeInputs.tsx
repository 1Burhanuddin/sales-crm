import { required, useTranslate } from "ra-core";
import { useWatch } from "react-hook-form";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { DateInput } from "@/components/admin/date-input";
import { NumberInput } from "@/components/admin/number-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../../root/ConfigurationContext";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-muted-foreground mt-2 first:mt-0">
    {children}
  </h3>
);

export const EmployeeInputs = ({
  isAdmin,
  showEmployeeCode = false,
}: {
  isAdmin: boolean;
  /** Only true on Edit -- employee_code is auto-generated on create, never
   * asked for on that form. Read-only even here; it's a stable id, not
   * something to casually retype. */
  showEmployeeCode?: boolean;
}) => {
  const translate = useTranslate();
  const { departments, designations, employmentTypes, employeeStatuses } =
    useConfigurationContext();
  const selectedDepartment = useWatch({ name: "department" });
  const availableDesignations = designations.filter(
    (d) => !d.department || d.department === selectedDepartment,
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>
        {translate("resources.employees.sections.basic", { _: "Basic Info" })}
      </SectionTitle>
      <div className="flex gap-4">
        <TextInput
          source="first_name"
          validate={required()}
          helperText={false}
          className="flex-1"
        />
        <TextInput
          source="last_name"
          validate={required()}
          helperText={false}
          className="flex-1"
        />
      </div>
      <div className="flex gap-4">
        <TextInput source="email" helperText={false} className="flex-1" />
        <TextInput source="phone" helperText={false} className="flex-1" />
      </div>
      <div className="flex gap-4">
        <DateInput source="date_of_birth" helperText={false} className="flex-1" />
        <TextInput source="address" helperText={false} className="flex-1" />
      </div>
      <div className="flex gap-4">
        <TextInput
          source="emergency_contact_name"
          helperText={false}
          className="flex-1"
        />
        <TextInput
          source="emergency_contact_phone"
          helperText={false}
          className="flex-1"
        />
      </div>

      <SectionTitle>
        {translate("resources.employees.sections.employment", {
          _: "Employment",
        })}
      </SectionTitle>
      {showEmployeeCode && (
        <TextInput
          source="employee_code"
          readOnly
          helperText={false}
        />
      )}
      <div className="flex gap-4">
        <SelectInput
          source="department"
          choices={departments}
          optionText="label"
          optionValue="value"
          readOnly={!isAdmin}
          helperText={false}
          className="flex-1"
        />
        <SelectInput
          source="designation"
          choices={availableDesignations}
          optionText="label"
          optionValue="value"
          readOnly={!isAdmin}
          helperText={
            selectedDepartment
              ? false
              : "resources.employees.fields.designation_helper"
          }
          className="flex-1"
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
          className="flex-1"
        />
        <SelectInput
          source="status"
          choices={employeeStatuses}
          optionText="label"
          optionValue="value"
          readOnly={!isAdmin}
          helperText={false}
          className="flex-1"
        />
      </div>
      <div className="flex gap-4">
        <DateInput
          source="date_of_joining"
          readOnly={!isAdmin}
          helperText={false}
          className="flex-1"
        />
        <DateInput
          source="date_of_leaving"
          readOnly={!isAdmin}
          helperText={false}
          className="flex-1"
        />
      </div>
      <ReferenceInput source="sales_id" reference="sales">
        <AutocompleteInput
          label="resources.employees.fields.sales_id"
          readOnly={!isAdmin}
          helperText={false}
        />
      </ReferenceInput>

      <SectionTitle>
        {translate("resources.employees.sections.past_employment", {
          _: "Past Employment",
        })}
      </SectionTitle>
      <div className="flex gap-4">
        <TextInput
          source="previous_employer"
          helperText={false}
          className="flex-1"
        />
        <TextInput
          source="previous_designation"
          helperText={false}
          className="flex-1"
        />
      </div>
      <div className="flex gap-4">
        <NumberInput
          source="total_experience_years"
          step={0.5}
          helperText={false}
          className="flex-1"
        />
        <TextInput
          source="qualification"
          helperText={false}
          className="flex-1"
        />
      </div>

      <SectionTitle>
        {translate("resources.employees.sections.bank", {
          _: "Bank Details",
        })}
      </SectionTitle>
      <div className="flex gap-4">
        <TextInput source="bank_name" helperText={false} className="flex-1" />
        <TextInput
          source="bank_account_name"
          helperText={false}
          className="flex-1"
        />
      </div>
      <div className="flex gap-4">
        <TextInput
          source="bank_account_number"
          helperText={false}
          className="flex-1"
        />
        <TextInput source="bank_ifsc" helperText={false} className="flex-1" />
      </div>

      <SectionTitle>
        {translate("resources.employees.sections.background", {
          _: "Background",
        })}
      </SectionTitle>
      <TextInput source="background" multiline rows={3} helperText={false} />
    </div>
  );
};
