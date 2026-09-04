import { required, useGetIdentity } from "ra-core";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { TextInput } from "@/components/admin/text-input";

export const ProjectInputs = () => {
  // member_ids is admin-managed only (see protect_project_member_ids()).
  const { identity } = useGetIdentity();
  const isAdmin = Boolean(
    (identity as { administrator?: boolean } | undefined)?.administrator,
  );
  return (
    <div className="flex flex-col gap-4">
      <TextInput source="name" validate={required()} helperText={false} />
      <TextInput
        source="description"
        multiline
        rows={3}
        helperText={false}
      />
      {isAdmin && (
        <ReferenceArrayInput source="member_ids" reference="sales">
          <AutocompleteArrayInput
            label="resources.projects.fields.member_ids"
            optionText={(s) => `${s.first_name} ${s.last_name}`}
            helperText={false}
          />
        </ReferenceArrayInput>
      )}
    </div>
  );
};
