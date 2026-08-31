import { Pin } from "lucide-react";
import {
  useDataProvider,
  useGetMany,
  useNotify,
  useRecordContext,
  useRedirect,
} from "ra-core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Markdown } from "../misc/Markdown";
import type { PersonalNote, Tag } from "../types";

export const PersonalNoteCard = () => {
  const record = useRecordContext<PersonalNote>();
  const redirect = useRedirect();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const { data: tags } = useGetMany<Tag>(
    "tags",
    { ids: record?.tags },
    { enabled: !!record?.tags && record.tags.length > 0 },
  );
  if (!record) return null;

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    dataProvider
      .update("personal_notes", {
        id: record.id,
        data: { pinned: !record.pinned },
        previousData: record,
      })
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  const checklistPreview =
    record.type === "checklist"
      ? record.checklist_items.slice(0, 6)
      : undefined;

  const toggleChecklistItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const checklist_items = record.checklist_items.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item,
    );
    dataProvider
      .update("personal_notes", {
        id: record.id,
        data: { checklist_items },
        previousData: record,
      })
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  return (
    <Card
      className={cn(
        "break-inside-avoid mb-3 flex flex-col justify-between p-4 gap-2 cursor-pointer",
        "border-black/5 shadow-sm hover:shadow-md transition-shadow",
      )}
      style={{ backgroundColor: record.color || undefined }}
      onClick={() => redirect(`/personal_notes/${record.id}`)}
    >
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-mono font-semibold text-sm leading-snug flex-1">
          {record.title}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 -mt-1 -mr-1"
          onClick={togglePin}
        >
          <Pin
            className={`w-3.5 h-3.5 ${record.pinned ? "fill-current" : ""}`}
          />
        </Button>
      </div>

      {checklistPreview ? (
        <ul className="text-sm space-y-1.5">
          {checklistPreview.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => toggleChecklistItem(e, i)}
                className={cn(
                  "w-3.5 h-3.5 rounded-[3px] border border-current/40 shrink-0",
                  item.checked && "bg-current/60",
                )}
              />
              <span
                className={cn(
                  "leading-tight",
                  item.checked && "line-through opacity-50",
                )}
              >
                {item.text}
              </span>
            </li>
          ))}
          {record.checklist_items.length > 6 && (
            <li className="text-xs text-muted-foreground pl-5.5">
              +{record.checklist_items.length - 6} more
            </li>
          )}
        </ul>
      ) : (
        record.content && (
          <Markdown className="text-sm leading-snug line-clamp-6 [&_ul]:my-0 [&_ol]:my-0 [&_p]:my-0">
            {record.content}
          </Markdown>
        )
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-[10px] font-normal text-black/70 bg-black/5"
            >
              #{tag.name}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
};
