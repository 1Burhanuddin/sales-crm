import { Archive, ArchiveRestore, Pin, PinOff, Trash2, Undo2 } from "lucide-react";
import {
  EditBase,
  Form,
  useDataProvider,
  useGetIdentity,
  useGetMany,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useTranslate,
} from "ra-core";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { FormToolbar } from "../layout/FormToolbar";
import { Markdown } from "../misc/Markdown";
import type { PersonalNote, Tag } from "../types";
import { PersonalNoteInputs } from "./PersonalNoteInputs";
import { PersonalNoteTagsEdit } from "./PersonalNoteTagsEdit";
import { PersonalNoteVersionHistory } from "./PersonalNoteVersionHistory";
import { ShareDialog } from "./ShareDialog";

export const PersonalNoteEdit = ({
  open,
  id,
}: {
  open: boolean;
  id?: string;
}) => {
  const redirect = useRedirect();
  const handleClose = () => redirect("/personal_notes");

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="lg:max-w-lg p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        {id ? (
          <EditBase
            id={id}
            resource="personal_notes"
            mutationMode="pessimistic"
            redirect={false}
          >
            <PersonalNoteEditBody />
          </EditBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const PersonalNoteEditBody = () => {
  const { identity } = useGetIdentity();
  const record = useRecordContext<PersonalNote>();
  if (!record) return null;

  const canEdit =
    record.sales_id === identity?.id || Boolean((identity as any)?.administrator);

  return (
    <>
      <EditHeader canEdit={canEdit} />
      {canEdit ? (
        <Form>
          <PersonalNoteInputs />
          <div className="mt-3">
            <PersonalNoteTagsEdit />
          </div>
          <FormToolbar />
        </Form>
      ) : (
        <ReadOnlyBody record={record} />
      )}
    </>
  );
};

const ReadOnlyBody = ({ record }: { record: PersonalNote }) => {
  const translate = useTranslate();
  const { data: tags } = useGetMany<Tag>(
    "tags",
    { ids: record.tags },
    { enabled: !!record.tags && record.tags.length > 0 },
  );

  return (
    <div className="flex flex-col gap-3">
      {record.title && <h2 className="text-lg font-semibold">{record.title}</h2>}
      {record.type === "checklist" ? (
        <ul className="text-sm space-y-1.5">
          {record.checklist_items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={cn(
                  "w-3.5 h-3.5 rounded-[3px] border border-current/40 shrink-0",
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
        record.content && <Markdown className="text-sm">{record.content}</Markdown>
      )}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-[10px] font-normal"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </Badge>
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
    <DialogTitle className="pb-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-normal text-muted-foreground">
          {translate("resources.personal_notes.name", { smart_count: 1 })}
        </span>
        {canEdit ? (
          <div className="flex gap-1">
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
        ) : null}
      </div>
      <Separator className="mt-2" />
    </DialogTitle>
  );
};
