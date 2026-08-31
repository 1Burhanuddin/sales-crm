import { Pin } from "lucide-react";
import { useDataProvider, useNotify, useRecordContext, useRedirect } from "ra-core";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { PersonalNote } from "../types";

export const PersonalNoteCard = () => {
  const record = useRecordContext<PersonalNote>();
  const redirect = useRedirect();
  const dataProvider = useDataProvider();
  const notify = useNotify();
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
      ? record.checklist_items.slice(0, 5)
      : undefined;

  return (
    <Card
      className="min-h-[150px] flex flex-col justify-between p-3 gap-2 cursor-pointer hover:shadow-md transition-shadow"
      style={record.color ? { backgroundColor: record.color } : undefined}
      onClick={() => redirect(`/personal_notes/${record.id}`)}
    >
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-sm font-medium line-clamp-1 flex-1">
          {record.title}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={togglePin}
        >
          <Pin
            className={`w-3.5 h-3.5 ${record.pinned ? "fill-current" : ""}`}
          />
        </Button>
      </div>

      {checklistPreview ? (
        <ul className="text-xs space-y-1">
          {checklistPreview.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span
                className={`w-3 h-3 rounded-sm border shrink-0 ${item.checked ? "bg-foreground/70" : ""}`}
              />
              <span
                className={item.checked ? "line-through text-muted-foreground" : ""}
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        record.content && (
          <p className="text-xs text-muted-foreground line-clamp-5 whitespace-pre-line">
            {record.content}
          </p>
        )
      )}
    </Card>
  );
};
