import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { SelectField } from "@/components/admin/select-field";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { IssueSubtaskBadge } from "./IssueSubtaskBadge";

export const IssueTable = () => {
  const { issueStatuses, issuePriorities } = useConfigurationContext();

  return (
    <DataTable
      rowClick={(id, _resource, record) =>
        `/projects/${record.project_id}/issues/${id}/show`
      }
    >
      <DataTable.Col source="title" cellClassName="max-w-[280px] truncate" />
      <DataTable.Col label={false} cellClassName="w-16">
        <IssueSubtaskBadge />
      </DataTable.Col>
      <DataTable.Col label="resources.issues.fields.status">
        <SelectField
          source="status"
          choices={issueStatuses}
          optionValue="value"
          optionText="label"
        />
      </DataTable.Col>
      <DataTable.Col label="resources.issues.fields.priority">
        <SelectField
          source="priority"
          choices={issuePriorities}
          optionValue="value"
          optionText="label"
        />
      </DataTable.Col>
      <DataTable.Col label="resources.issues.fields.assignee_id">
        <ReferenceField source="assignee_id" reference="sales" link={false} />
      </DataTable.Col>
      <DataTable.Col label="resources.issues.fields.due_date">
        <DateField source="due_date" />
      </DataTable.Col>
    </DataTable>
  );
};
