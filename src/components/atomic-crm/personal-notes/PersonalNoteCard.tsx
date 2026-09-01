import { Bell, Pin, Users } from "lucide-react";
import { isPast } from "date-fns";
import {
  useDataProvider,
  useGetIdentity,
  useGetMany,
  useNotify,
  useRecordContext,
  useRedirect,
  useTranslate,
} from "ra-core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatRelativeDate } from "../misc/RelativeDate";
import { Markdown } from "../misc/Markdown";
import { usePreferences } from "../preferences";
import type { PersonalNote, Tag } from "../types";

export const PersonalNoteCard = () => {
  const record = useRecordContext<PersonalNote>();
  const redirect = useRedirect();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const { noteCorners } = usePreferences();
  const { data: tags } = useGetMany<Tag>(
    "tags",
    { ids: record?.tags },
    { enabled: !!record?.tags && record.tags.length > 0 },
  );
  if (!record) return null;

  const canEdit =
    record.sales_id === identity?.id || Boolean((identity as any)?.administrator);

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return;
    dataProvider
      .update("personal_notes", {
        id: record.id,
        data: { pinned: !record.pinned },
        previousData: record,
      })
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  // The pastel swatches in noteColors.ts are always light, so a card with
  // a custom color needs dark text regardless of the app's light/dark
  // theme -- the default Card component's text/muted/border colors are
  // theme-driven CSS variables (see index.css's --card-foreground etc.),
  // which in dark mode resolve to a near-white color meant for a dark
  // card background. Overriding those variables locally, rather than
  // hardcoding a color on each element, makes every themed descendant
  // (title, checklist text, "+N more", badges, blockquotes) read
  // correctly without hunting down each one individually.
  const hasCustomColor = Boolean(record.color);
  const colorOverrideVars = hasCustomColor
    ? ({
        "--card-foreground": "#2b2b2b",
        "--muted-foreground": "#5a5a5a",
        "--muted": "rgba(0,0,0,0.06)",
        "--border": "rgba(0,0,0,0.12)",
      } as React.CSSProperties)
    : undefined;

  const checklistPreview =
    record.type === "checklist"
      ? record.checklist_items.slice(0, 6)
      : undefined;

  const toggleChecklistItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!canEdit) return;
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
        "relative overflow-hidden break-inside-avoid mb-3 flex flex-col justify-between p-4 gap-2 cursor-pointer",
        "border-black/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200",
        noteCorners === "square" && "rounded-none",
      )}
      style={{ backgroundColor: record.color || undefined, ...colorOverrideVars }}
      onClick={() => redirect(`/personal_notes/${record.id}`)}
    >
      {hasCustomColor && (
        // A faint diagonal sheen on colored cards -- just enough to keep
        // a flat pastel from reading as a solid block of color, without
        // drawing attention to itself. Absolutely positioned + pointer-
        // events-none so it never interferes with clicks/drag. z-index
        // stays implicit (auto) -- the real content below is explicitly
        // z-10 so it always paints above this regardless of DOM order.
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.35), transparent 55%)",
          }}
        />
      )}
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-serif font-semibold text-base leading-snug flex-1">
            {record.title}
          </h3>
          <div className="flex items-center shrink-0 -mt-1 -mr-1">
            {!canEdit && (
              <span className="p-1.5 opacity-60" title="Shared with you">
                <Users className="w-3.5 h-3.5" />
              </span>
            )}
            {canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={togglePin}
              >
                <Pin
                  className={`w-3.5 h-3.5 ${record.pinned ? "fill-current" : ""}`}
                />
              </Button>
            )}
          </div>
        </div>

        {checklistPreview ? (
          <ul className="text-sm space-y-1.5">
            {checklistPreview.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => toggleChecklistItem(e, i)}
                  className={cn(
                    "w-3.5 h-3.5 rounded-[3px] border border-current/40 shrink-0 transition-colors",
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

        {record.remind_at && (
          <Badge
            variant={isPast(new Date(record.remind_at)) ? "destructive" : "outline"}
            className={cn(
              "self-start text-[10px] font-normal gap-1",
              hasCustomColor &&
                !isPast(new Date(record.remind_at)) &&
                "text-black/70 bg-black/5 border-black/10",
            )}
            title={translate("resources.personal_notes.fields.remind_at", {
              _: "Remind me",
            })}
          >
            <Bell className="w-2.5 h-2.5" />
            {formatRelativeDate(record.remind_at)}
          </Badge>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className={cn(
                  "text-[10px] font-normal",
                  hasCustomColor && "text-black/70 bg-black/5",
                )}
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
