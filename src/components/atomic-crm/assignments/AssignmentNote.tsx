import { CircleX, Edit, Save, Trash2 } from "lucide-react";
import {
  Form,
  useDelete,
  useGetIdentity,
  useNotify,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useState } from "react";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { RelativeDate } from "../misc/RelativeDate";
import { useGetSalesName } from "../sales/useGetSalesName";
import type { AssignmentNote as AssignmentNoteType } from "../types";
import { AssignmentNoteInputs } from "./AssignmentNoteInputs";

export const AssignmentNote = ({ note }: { note: AssignmentNoteType }) => {
  const [isHover, setHover] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const notify = useNotify();
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const isCurrentUser = note.sales_id === identity?.id;
  const isAdmin = Boolean((identity as any)?.administrator);
  // Matches assignment_notes' RLS exactly: update allows the comment's
  // own author or an admin, delete stays admin-only.
  const canEdit = isCurrentUser || isAdmin;
  const canDelete = isAdmin;
  const salesName = useGetSalesName(note.sales_id, { enabled: !isCurrentUser });

  const [update, { isPending }] = useUpdate();

  const [deleteNote] = useDelete("assignment_notes", undefined, {
    mutationMode: "undoable",
    onSuccess: () => {
      notify("resources.assignment_notes.deleted", {
        type: "info",
        undoable: true,
        messageArgs: { _: "Comment deleted" },
      });
    },
  });

  const handleDelete = () => {
    deleteNote("assignment_notes", { id: note.id, previousData: note });
  };

  const handleNoteUpdate: SubmitHandler<FieldValues> = (values) => {
    update(
      "assignment_notes",
      { id: note.id, data: values, previousData: note },
      { onSuccess: () => { setEditing(false); setHover(false); } },
    );
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="mb-4"
    >
      <div className="flex items-center space-x-4 w-full">
        <div className="inline-flex h-full items-center text-sm text-muted-foreground">
          {translate(
            isCurrentUser
              ? "resources.assignment_notes.you_added"
              : "resources.assignment_notes.author_added",
            { name: salesName },
          )}
        </div>
        <span className={isHover ? "visible" : "invisible"}>
          {canEdit && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(!isEditing)}
                    className="p-1 h-auto cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{translate("resources.notes.action.edit")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {canDelete && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="p-1 h-auto cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{translate("resources.notes.action.delete")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
        <div className="flex-1"></div>
        <span className="text-sm text-muted-foreground">
          <RelativeDate date={note.date} />
        </span>
      </div>
      {isEditing ? (
        <Form onSubmit={handleNoteUpdate} record={note} className="mt-1">
          <AssignmentNoteInputs />
          <div className="flex justify-end mt-2 space-x-4">
            <Button
              variant="ghost"
              onClick={() => { setEditing(false); setHover(false); }}
              type="button"
              className="cursor-pointer"
            >
              <CircleX className="w-4 h-4" />
              {translate("ra.action.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {translate("resources.notes.action.update")}
            </Button>
          </div>
        </Form>
      ) : (
        <div className="pt-2 text-sm max-w-150 whitespace-pre-line">
          {note.text}
        </div>
      )}
    </div>
  );
};
