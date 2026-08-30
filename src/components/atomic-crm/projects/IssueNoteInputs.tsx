import { useTranslate } from "ra-core";
import { TextInput } from "@/components/admin/text-input";
import { FileInput } from "@/components/admin/file-input";
import { DateTimeInput } from "@/components/admin/date-time-input";

import { AttachmentField } from "../notes/AttachmentField";
import { getCurrentDate } from "../notes/utils";
import { validateNoteOrAttachmentRequired } from "../notes/noteModel";

export const IssueNoteInputs = () => {
  const translate = useTranslate();
  return (
    <div className="space-y-2">
      <TextInput
        source="text"
        label={false}
        multiline
        helperText={false}
        placeholder={translate("resources.issue_notes.inputs.add_note")}
        rows={2}
        validate={validateNoteOrAttachmentRequired}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateTimeInput
          source="date"
          label="resources.issue_notes.fields.date"
          helperText={false}
          defaultValue={getCurrentDate()}
        />
      </div>
      <FileInput
        source="attachments"
        label="resources.issue_notes.fields.attachments"
        multiple
      >
        <AttachmentField source="src" title="title" target="_blank" />
      </FileInput>
    </div>
  );
};
