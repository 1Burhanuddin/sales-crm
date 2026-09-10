import { required } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { DateInput } from "@/components/admin/date-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { PRIORITY_CHOICES, STATUS_CHOICES, TIME_BLOCK_CHOICES } from "./choices";

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
        className="flex-1"
      />
      <SelectInput
        source="priority"
        choices={PRIORITY_CHOICES}
        helperText={false}
        className="flex-1"
      />
      <DateInput
        source="due_date"
        helperText={false}
        className="flex-1 min-w-32"
      />
    </div>
    <div className="flex gap-4">
      <SelectInput
        source="time_block"
        label="resources.assignments.fields.time_block"
        choices={TIME_BLOCK_CHOICES}
        helperText={false}
        className="flex-1"
      />
      <TextInput
        source="blocked_on"
        label="resources.assignments.fields.blocked_on"
        helperText="resources.assignments.fields.blocked_on_helper"
        className="flex-1"
      />
    </div>
  </div>
);
