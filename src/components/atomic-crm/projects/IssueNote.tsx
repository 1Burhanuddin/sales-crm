import { CircleX, Edit, Paperclip, Save, Trash2 } from "lucide-react";
import {
  Form,
  useDelete,
  useGetIdentity,
  useNotify,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useEffect, useRef, useState } from "react";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Markdown } from "../misc/Markdown";
import { RelativeDate } from "../misc/RelativeDate";
import { useGetSalesName } from "../sales/useGetSalesName";
import type { AttachmentNote, IssueNote as IssueNoteType } from "../types";
import { IssueNoteInputs } from "./IssueNoteInputs";

export const IssueNote = ({ note }: { note: IssueNoteType }) => {
  const [isHover, setHover] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  const [isTruncated, setTruncated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const notify = useNotify();
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const isCurrentUser = note.sales_id === identity?.id;
  const salesName = useGetSalesName(note.sales_id, { enabled: !isCurrentUser });

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setTruncated(el.scrollHeight > el.clientHeight);
    }
  }, [note.text]);

  const [update, { isPending }] = useUpdate();

  const [deleteNote] = useDelete("issue_notes", undefined, {
    mutationMode: "undoable",
    onSuccess: () => {
      notify("resources.issue_notes.deleted", {
        type: "info",
        undoable: true,
        messageArgs: { _: "Comment deleted" },
      });
    },
  });

  const handleDelete = () => {
    deleteNote("issue_notes", { id: note.id, previousData: note });
  };

  const handleNoteUpdate: SubmitHandler<FieldValues> = (values) => {
    update(
      "issue_notes",
      { id: note.id, data: values, previousData: note },
      {
        onSuccess: () => {
          setEditing(false);
          setHover(false);
        },
      },
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
              ? "resources.issue_notes.you_added"
              : "resources.issue_notes.author_added",
            { name: salesName },
          )}
        </div>
        <span className={`${isHover ? "visible" : "invisible"}`}>
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
        </span>
        <div className="flex-1"></div>
        <span className="text-sm text-muted-foreground">
          <RelativeDate date={note.date} />
        </span>
      </div>
      {isEditing ? (
        <Form onSubmit={handleNoteUpdate} record={note} className="mt-1">
          <IssueNoteInputs />
          <div className="flex justify-end mt-2 space-x-4">
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setHover(false);
              }}
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
        <div className="pt-2 text-sm max-w-150">
          {note.text && (
            <div
              ref={contentRef}
              className={cn(
                "overflow-hidden transition-[max-height] duration-300 ease-in-out",
                isExpanded ? "max-h-[5000px]" : "max-h-46",
              )}
            >
              <Markdown>{note.text}</Markdown>
            </div>
          )}
          {isTruncated && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!isExpanded);
              }}
              className="text-primary text-sm mt-1 underline hover:no-underline cursor-pointer"
            >
              {isExpanded
                ? translate("crm.common.show_less")
                : translate("crm.common.read_more")}
            </button>
          )}
          {note.attachments && <IssueNoteAttachments note={note} />}
        </div>
      )}
    </div>
  );
};

const IssueNoteAttachments = ({ note }: { note: IssueNoteType }) => {
  if (!note.attachments || note.attachments.length === 0) return null;

  const imageAttachments = note.attachments.filter((a: AttachmentNote) =>
    a.type?.startsWith("image/"),
  );
  const otherAttachments = note.attachments.filter(
    (a: AttachmentNote) => !a.type?.startsWith("image/"),
  );

  return (
    <div className="mt-2 flex flex-col gap-2">
      {imageAttachments.length > 0 && (
        <div className="grid grid-cols-4 gap-8">
          {imageAttachments.map((attachment: AttachmentNote, index: number) => (
            <a
              key={index}
              href={attachment.src}
              title={attachment.title}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={attachment.src}
                alt={attachment.title}
                className="w-[200px] h-[100px] object-cover cursor-pointer object-left border border-border"
              />
            </a>
          ))}
        </div>
      )}
      {otherAttachments.map((attachment: AttachmentNote, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          <a
            href={attachment.src}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
            onClick={(e) => e.stopPropagation()}
          >
            {attachment.title}
          </a>
        </div>
      ))}
    </div>
  );
};
