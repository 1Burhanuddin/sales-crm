import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Bell,
  BellOff,
  CheckSquare,
  Pin,
  PinOff,
  StickyNote,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  CreateBase,
  EditBase,
  Form,
  useDataProvider,
  useGetIdentity,
  useGetMany,
  useInput,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useTranslate,
} from "ra-core";
import { useWatch, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { DateTimeInput } from "@/components/admin/date-time-input";
import { DeleteButton } from "@/components/admin/delete-button";
import { FileInput } from "@/components/admin/file-input";
import { TextInput } from "@/components/admin/text-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { AttachmentField } from "../notes/AttachmentField";
import { validateNoteOrAttachmentRequired } from "../notes/noteModel";
import { Markdown } from "../misc/Markdown";
import { RelativeDate } from "../misc/RelativeDate";
import type { PersonalNote, Tag } from "../types";
import { ChecklistItemsInput } from "./ChecklistItemsInput";
import { noteColors } from "./noteColors";
import { PersonalNoteTagsEdit } from "./PersonalNoteTagsEdit";
import { PersonalNoteVersionHistory } from "./PersonalNoteVersionHistory";
import { ShareDialog } from "./ShareDialog";

/** A note's own color washes the whole page, not just its card, the same
 * readable-text override PersonalNoteCard.tsx uses. Reads the *live form
 * value* (not the saved record) via useWatch so picking a new color
 * repaints the page immediately, and so it works identically in create
 * mode, where there's no saved record to read a color off yet. */
const useColorWashStyle = (): React.CSSProperties => {
  const color = useWatch({ name: "color" });
  if (!color) return {};
  return {
    backgroundColor: color,
    "--card-foreground": "#2b2b2b",
    "--muted-foreground": "#5a5a5a",
    "--muted": "rgba(0,0,0,0.06)",
    "--border": "rgba(0,0,0,0.12)",
  } as React.CSSProperties;
};

export const PersonalNoteEditPage = ({ id }: { id: string }) => {
  return (
    <EditBase
      id={id}
      resource="personal_notes"
      mutationMode="pessimistic"
      redirect={false}
    >
      <EditPageBody />
    </EditBase>
  );
};

const EditPageBody = () => {
  const { identity } = useGetIdentity();
  const record = useRecordContext<PersonalNote>();
  if (!record) return null;

  const canEdit =
    record.sales_id === identity?.id ||
    Boolean((identity as any)?.administrator);

  return (
    <Form>
      <PageShell
        header={<EditHeader canEdit={canEdit} />}
        footer={canEdit && <SaveFooter />}
      >
        {canEdit ? <NoteFields /> : <ReadOnlyNote record={record} />}
      </PageShell>
    </Form>
  );
};

export const PersonalNoteCreatePage = () => {
  const redirect = useRedirect();
  return (
    <CreateBase
      resource="personal_notes"
      mutationOptions={{ onSuccess: () => redirect("/personal_notes") }}
    >
      <Form defaultValues={{ type: "note" }}>
        <PageShell header={<CreateHeader />} footer={<SaveFooter />}>
          <NoteFields autoFocus />
        </PageShell>
      </Form>
    </CreateBase>
  );
};

const PageShell = ({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) => {
  const washStyle = useColorWashStyle();
  return (
    <div className="min-h-[calc(100vh-3.5rem)] -m-4 transition-colors" style={washStyle}>
      <div className="mx-auto max-w-3xl px-6 md:px-10 pb-24 pt-4">
        {header}
        {children}
      </div>
      {footer}
    </div>
  );
};

const BackButton = () => {
  const redirect = useRedirect();
  const translate = useTranslate();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
      onClick={() => redirect("/personal_notes")}
    >
      <ArrowLeft className="w-4 h-4" />
      {translate("resources.personal_notes.name", { smart_count: 2 })}
    </Button>
  );
};

const CreateHeader = () => (
  <div className="flex items-center justify-between mb-6">
    <BackButton />
  </div>
);

const EditHeader = ({ canEdit }: { canEdit: boolean }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();
  const record = useRecordContext<PersonalNote>();
  if (!record) return null;

  const patch = (data: Partial<PersonalNote>) => {
    dataProvider
      .update("personal_notes", { id: record.id, data, previousData: record })
      .then(() => refresh())
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  const moveToTrash = () => {
    dataProvider
      .update("personal_notes", {
        id: record.id,
        data: { deleted_at: new Date().toISOString() },
        previousData: record,
      })
      .then(() => redirect("/personal_notes"))
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <BackButton />
      {canEdit ? (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {translate("resources.personal_notes.edited", { _: "Edited" })}{" "}
            <RelativeDate date={record.updated_at} />
          </span>
          <div className="flex items-center gap-0.5">
            {!record.deleted_at ? (
              <>
                <ShareDialog />
                <PersonalNoteVersionHistory />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => patch({ pinned: !record.pinned })}
                  title={translate(
                    record.pinned
                      ? "resources.personal_notes.action.unpin"
                      : "resources.personal_notes.action.pin",
                    { _: record.pinned ? "Unpin" : "Pin" },
                  )}
                >
                  {record.pinned ? (
                    <PinOff className="w-4 h-4" />
                  ) : (
                    <Pin className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    patch({
                      archived_at: record.archived_at
                        ? null
                        : new Date().toISOString(),
                    })
                  }
                  title={translate(
                    record.archived_at
                      ? "resources.personal_notes.action.unarchive"
                      : "resources.personal_notes.action.archive",
                    { _: record.archived_at ? "Unarchive" : "Archive" },
                  )}
                >
                  {record.archived_at ? (
                    <ArchiveRestore className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={moveToTrash}
                  title={translate("resources.personal_notes.action.trash", {
                    _: "Move to trash",
                  })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => patch({ deleted_at: null })}
                >
                  <Undo2 className="w-4 h-4" />
                  {translate("resources.personal_notes.action.restore", {
                    _: "Restore",
                  })}
                </Button>
                <DeleteButton redirect="/personal_notes" />
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const SaveFooter = () => {
  const translate = useTranslate();
  const redirect = useRedirect();
  const { formState } = useFormContext();
  return (
    <div className="sticky bottom-0 inset-x-0 border-t bg-background/80 backdrop-blur-sm px-6 md:px-10 py-3 flex justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={() => redirect("/personal_notes")}
      >
        {translate("ra.action.cancel")}
      </Button>
      <Button type="submit" disabled={formState.isSubmitting}>
        {translate("ra.action.save")}
      </Button>
    </div>
  );
};

const NoteFields = ({ autoFocus }: { autoFocus?: boolean }) => {
  const translate = useTranslate();
  const type: "note" | "checklist" = useWatch({ name: "type" }) ?? "note";

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        source="title"
        label={false}
        placeholder={translate("resources.personal_notes.title_placeholder", {
          _: "Title",
        })}
        helperText={false}
        inputClassName="h-auto border-none shadow-none bg-transparent px-0 text-3xl md:text-4xl font-serif font-semibold placeholder:text-muted-foreground/50 focus-visible:ring-0"
        autoFocus={autoFocus}
      />

      <TypeToggle />

      {type === "checklist" ? (
        <ChecklistItemsInput />
      ) : (
        <TextInput
          source="content"
          label={false}
          placeholder={translate("resources.personal_notes.content_placeholder", {
            _: "Take a note… (markdown supported: - bullets, **bold**, etc.)",
          })}
          multiline
          rows={16}
          helperText={false}
          inputClassName="border-none shadow-none bg-transparent px-0 text-base leading-7 resize-none focus-visible:ring-0"
          validate={validateNoteOrAttachmentRequired}
        />
      )}

      <div className="flex flex-col gap-3 pt-4 mt-2 border-t">
        <ColorSwatchInput />
        <ReminderInput />
        <PersonalNoteTagsEdit />
        <FileInput
          source="attachments"
          label="resources.personal_notes.fields.attachments"
          multiple
        >
          <AttachmentField source="src" title="title" target="_blank" />
        </FileInput>
      </div>
    </div>
  );
};

const TypeToggle = () => {
  const translate = useTranslate();
  const { setValue } = useFormContext();
  const type: "note" | "checklist" = useWatch({ name: "type" }) ?? "note";
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={type}
      onValueChange={(value) => value && setValue("type", value)}
      className="self-start"
    >
      <ToggleGroupItem value="note" className="gap-1.5">
        <StickyNote className="w-3.5 h-3.5" />
        {translate("resources.personal_notes.type.note", { _: "Note" })}
      </ToggleGroupItem>
      <ToggleGroupItem value="checklist" className="gap-1.5">
        <CheckSquare className="w-3.5 h-3.5" />
        {translate("resources.personal_notes.type.checklist", {
          _: "Checklist",
        })}
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

const ColorSwatchInput = () => {
  const translate = useTranslate();
  const { field } = useInput({ source: "color" });
  return (
    <div className="flex items-center flex-wrap gap-2">
      <span className="text-xs text-muted-foreground mr-1">
        {translate("resources.personal_notes.fields.color", { _: "Color" })}
      </span>
      <button
        type="button"
        onClick={() => field.onChange(null)}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] bg-background",
          !field.value ? "border-primary" : "border-transparent",
        )}
        title={translate("resources.personal_notes.no_color", {
          _: "No color",
        })}
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

const ReminderInput = () => {
  const translate = useTranslate();
  const { setValue } = useFormContext();
  // Read-only watch, not a second useInput -- DateTimeInput below already
  // owns the controlled registration for this field; a second useInput
  // here would just be a redundant competing registration for the same
  // source when all this needs is "does it currently have a value".
  const remindAt = useWatch({ name: "remind_at" });
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Bell className="w-3.5 h-3.5" />
        {translate("resources.personal_notes.fields.remind_at", {
          _: "Remind me",
        })}
      </span>
      <DateTimeInput
        source="remind_at"
        label={false}
        helperText={false}
        className="h-8 text-xs w-auto"
      />
      {remindAt && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setValue("remind_at", null, { shouldDirty: true })}
          title={translate("resources.personal_notes.action.clear_reminder", {
            _: "Clear reminder",
          })}
        >
          <BellOff className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

const ReadOnlyNote = ({ record }: { record: PersonalNote }) => {
  const translate = useTranslate();
  const { data: tags } = useGetMany<Tag>(
    "tags",
    { ids: record.tags },
    { enabled: !!record.tags && record.tags.length > 0 },
  );

  return (
    <div className="flex flex-col gap-4">
      {record.title && (
        <h1 className="text-3xl md:text-4xl font-serif font-semibold">
          {record.title}
        </h1>
      )}
      {record.type === "checklist" ? (
        <ul className="text-base space-y-2">
          {record.checklist_items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={cn(
                  "w-4 h-4 rounded-[3px] border border-current/40 shrink-0",
                  item.checked && "bg-current/60",
                )}
              />
              <span className={item.checked ? "line-through opacity-50" : ""}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        record.content && (
          <Markdown className="text-base leading-7">{record.content}</Markdown>
        )
      )}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-4 mt-2 border-t">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {translate("resources.personal_notes.shared_read_only", {
          _: "Shared with you — view only.",
        })}
      </p>
    </div>
  );
};
