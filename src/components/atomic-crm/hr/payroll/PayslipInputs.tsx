import { required } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { NumberInput } from "@/components/admin/number-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";

import { SalaryLineItemsInput } from "./SalaryLineItemsInput";

const MONTH_CHOICES = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const PayslipInputs = () => (
  <div className="flex flex-col gap-4">
    <ReferenceInput source="employee_id" reference="employees">
      <AutocompleteInput
        label="resources.payslips.fields.employee_id"
        validate={required()}
        helperText={false}
      />
    </ReferenceInput>
    <div className="flex gap-4">
      <SelectInput
        source="month"
        choices={MONTH_CHOICES}
        optionText="label"
        optionValue="value"
        validate={required()}
        helperText={false}
      />
      <NumberInput source="year" validate={required()} helperText={false} />
    </div>
    <NumberInput source="basic" validate={required()} helperText={false} />
    <SalaryLineItemsInput source="allowances" label="Allowances" />
    <SalaryLineItemsInput source="deductions" label="Deductions" />
  </div>
);
