import { Archive, ArchiveRestore, Pin, PinOff, Trash2, Undo2 } from "lucide-react";
import {
  EditBase,
  Form,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useTranslate,
} from "ra-core";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { FormToolbar } from "../layout/FormToolbar";
import type { PersonalNote } from "../types";
import { PersonalNoteInputs } from "./PersonalNoteInputs";
import { PersonalNoteTagsEdit } from "./PersonalNoteTagsEdit";

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
            <EditHeader />
            <Form>
              <PersonalNoteInputs />
              <div className="mt-3">
                <PersonalNoteTagsEdit />
              </div>
              <FormToolbar />
            </Form>
          </EditBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const EditHeader = () => {
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
        <div className="flex gap-1">
          {!record.deleted_at ? (
            <>
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
      <Separator className="mt-2" />
    </DialogTitle>
  );
};
