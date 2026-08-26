import { required } from "ra-core";
import { DateInput } from "@/components/admin/date-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../root/ConfigurationContext";

export const IssueInputs = () => {
  const { issueStatuses, issuePriorities } = useConfigurationContext();
  return (
    <div className="flex flex-col gap-4">
      <TextInput source="title" validate={required()} helperText={false} />
      <TextInput source="description" multiline rows={3} helperText={false} />
      <div className="flex gap-4">
        <SelectInput
          source="status"
          choices={issueStatuses}
          optionText="label"
          optionValue="value"
          validate={required()}
          helperText={false}
        />
        <SelectInput
          source="priority"
          choices={issuePriorities}
          optionText="label"
          optionValue="value"
          helperText={false}
        />
      </div>
      <ReferenceInput source="assignee_id" reference="sales">
        <AutocompleteInput
          label="resources.issues.fields.assignee_id"
          helperText={false}
        />
      </ReferenceInput>
      <DateInput source="due_date" helperText={false} />
    </div>
  );
};
