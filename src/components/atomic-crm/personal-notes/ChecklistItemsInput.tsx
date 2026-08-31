import { ArrayInput } from "@/components/admin/array-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { TextInput } from "@/components/admin/text-input";

// Same structural pattern as hr/payroll/SalaryLineItemsInput.tsx — an
// ArrayInput+SimpleFormIterator of paired inputs, swapping label+amount for
// checked+text.
export const ChecklistItemsInput = () => (
  <ArrayInput source="checklist_items" label={false} helperText={false}>
    <SimpleFormIterator inline>
      <BooleanInput source="checked" label={false} helperText={false} />
      <TextInput
        source="text"
        label={false}
        placeholder="List item"
        helperText={false}
        className="flex-1"
      />
    </SimpleFormIterator>
  </ArrayInput>
);
