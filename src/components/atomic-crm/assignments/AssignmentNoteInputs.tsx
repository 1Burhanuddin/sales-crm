import { required, useTranslate } from "ra-core";
import { TextInput } from "@/components/admin/text-input";

export const AssignmentNoteInputs = () => {
  const translate = useTranslate();
  return (
    <TextInput
      source="text"
      label={false}
      multiline
      helperText={false}
      placeholder={translate("resources.assignment_notes.inputs.add_note", {
        _: "Add a comment…",
      })}
      rows={2}
      validate={required()}
    />
  );
};
