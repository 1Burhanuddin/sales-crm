import { TextInput } from "@/components/admin/text-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { ReferenceInput } from "@/components/admin/reference-input";

export const LeadInputs = () => (
  <div className="flex flex-col gap-4">
    <div className="flex gap-4">
      <TextInput source="first_name" className="flex-1" />
      <TextInput source="last_name" className="flex-1" />
    </div>
    <TextInput source="company_name" />
    <div className="flex gap-4">
      <TextInput source="email" className="flex-1" />
      <TextInput source="phone" className="flex-1" />
    </div>
    <TextInput source="title" />
    <TextInput source="source" helperText="resources.leads.fields.source_helper" />
    <ReferenceInput source="assignee_id" reference="sales">
      <AutocompleteInput optionText={(s) => `${s.first_name} ${s.last_name}`} />
    </ReferenceInput>
    <TextInput source="notes" multiline rows={3} />
  </div>
);
