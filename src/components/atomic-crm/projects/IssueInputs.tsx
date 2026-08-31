import { required } from "ra-core";
import { useWatch } from "react-hook-form";
import { DateInput } from "@/components/admin/date-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../root/ConfigurationContext";

export const IssueInputs = () => {
  const { issueStatuses, issuePriorities } = useConfigurationContext();
  // Sprints are scoped to one project -- read the issue's own project_id
  // (set as a defaultValue on create, present on the record on edit)
  // straight off the live form, same useWatch pattern already used for
  // EmployeeInputs.tsx's department->designation dependent dropdown.
  const projectId = useWatch({ name: "project_id" });
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
      {projectId != null && (
        <div className="flex gap-4">
          <ReferenceInput
            source="sprint_id"
            reference="sprints"
            filter={{ project_id: projectId }}
          >
            <AutocompleteInput
              label="resources.issues.fields.sprint_id"
              helperText={false}
            />
          </ReferenceInput>
          <ReferenceInput
            source="milestone_id"
            reference="milestones"
            filter={{ project_id: projectId }}
          >
            <AutocompleteInput
              label="resources.issues.fields.milestone_id"
              helperText={false}
            />
          </ReferenceInput>
        </div>
      )}
      <div className="flex gap-4">
        <DateInput
          source="start_date"
          label="resources.issues.fields.start_date"
          helperText={false}
        />
        <DateInput source="due_date" helperText={false} />
      </div>
    </div>
  );
};
