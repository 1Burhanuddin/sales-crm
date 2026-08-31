import { CheckSquare, StickyNote } from "lucide-react";
import { useInput } from "ra-core";
import { useFormContext, useWatch } from "react-hook-form";
import { FileInput } from "@/components/admin/file-input";
import { TextInput } from "@/components/admin/text-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { AttachmentField } from "../notes/AttachmentField";
import { validateNoteOrAttachmentRequired } from "../notes/noteModel";
import { ChecklistItemsInput } from "./ChecklistItemsInput";
import { noteColors } from "./noteColors";

export const PersonalNoteInputs = () => {
  const type: "note" | "checklist" = useWatch({ name: "type" }) ?? "note";

  return (
    <div className="flex flex-col gap-3">
      <TextInput
        source="title"
        label={false}
        placeholder="Title"
        helperText={false}
      />
      <TypeToggle />
      {type === "checklist" ? (
        <ChecklistItemsInput />
      ) : (
        <TextInput
          source="content"
          label={false}
          placeholder="Take a note… (markdown supported: - bullets, **bold**, etc.)"
          multiline
          rows={4}
          helperText={false}
          validate={validateNoteOrAttachmentRequired}
        />
      )}
      <ColorSwatchInput />
      <FileInput
        source="attachments"
        label="resources.personal_notes.fields.attachments"
        multiple
      >
        <AttachmentField source="src" title="title" target="_blank" />
      </FileInput>
    </div>
  );
};

const TypeToggle = () => {
  const { setValue } = useFormContext();
  const type: "note" | "checklist" = useWatch({ name: "type" }) ?? "note";
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={type}
      onValueChange={(value) => value && setValue("type", value)}
    >
      <ToggleGroupItem value="note" className="gap-1.5">
        <StickyNote className="w-3.5 h-3.5" />
        Note
      </ToggleGroupItem>
      <ToggleGroupItem value="checklist" className="gap-1.5">
        <CheckSquare className="w-3.5 h-3.5" />
        Checklist
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

const ColorSwatchInput = () => {
  const { field } = useInput({ source: "color" });
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => field.onChange(null)}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px]",
          !field.value ? "border-primary" : "border-transparent",
        )}
        title="No color"
      >
        ✕
      </button>
      {noteColors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => field.onChange(color)}
          className={cn(
            "w-6 h-6 rounded-full border-2",
            field.value === color ? "border-primary" : "border-transparent",
          )}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
};
