import { required } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { DateInput } from "@/components/admin/date-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { PRIORITY_CHOICES, STATUS_CHOICES } from "./choices";

export const AssignmentInputs = () => (
  <div className="flex flex-col gap-4">
    <TextInput source="title" validate={required()} helperText={false} />
    <TextInput
      source="description"
      multiline
      rows={3}
      helperText={false}
    />
    <ReferenceInput source="assignee_id" reference="sales">
      <AutocompleteInput
        label="resources.assignments.fields.assignee_id"
        validate={required()}
        helperText={false}
      />
    </ReferenceInput>
    <div className="flex gap-4">
      <SelectInput
        source="status"
        choices={STATUS_CHOICES}
        validate={required()}
        helperText={false}
      />
      <SelectInput
        source="priority"
        choices={PRIORITY_CHOICES}
        helperText={false}
      />
      <DateInput source="due_date" helperText={false} />
    </div>
  </div>
);
