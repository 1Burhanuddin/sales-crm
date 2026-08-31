import { History } from "lucide-react";
import {
  useDataProvider,
  useGetList,
  useNotify,
  useRecordContext,
  useRefresh,
  useTranslate,
} from "ra-core";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import type { PersonalNote, PersonalNoteVersion } from "../types";

export const PersonalNoteVersionHistory = () => {
  const translate = useTranslate();
  const record = useRecordContext<PersonalNote>();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const { data: versions, isPending } = useGetList<PersonalNoteVersion>(
    "personal_note_versions",
    {
      pagination: { page: 1, perPage: 20 },
      sort: { field: "created_at", order: "DESC" },
      filter: { note_id: record?.id },
    },
    { enabled: !!record },
  );

  if (!record) return null;

  const restore = (version: PersonalNoteVersion) => {
    dataProvider
      .update("personal_notes", {
        id: record.id,
        data: {
          title: version.title,
          content: version.content,
          type: version.type,
          checklist_items: version.checklist_items,
          tags: version.tags,
          color: version.color,
        },
        previousData: record,
      })
      .then(() => {
        notify("resources.personal_notes.version_restored", {
          _: "Version restored",
        });
        refresh();
      })
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" title={translate(
          "resources.personal_notes.action.history",
          { _: "Version history" },
        )}>
          <History className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <h4 className="text-sm font-medium mb-2">
          {translate("resources.personal_notes.action.history", {
            _: "Version history",
          })}
        </h4>
        {isPending && (
          <p className="text-xs text-muted-foreground">
            {translate("ra.message.loading", { _: "Loading…" })}
          </p>
        )}
        {!isPending && !versions?.length && (
          <p className="text-xs text-muted-foreground">
            {translate("resources.personal_notes.no_versions", {
              _: "No earlier versions yet.",
            })}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {versions?.map((version, i) => (
            <div key={version.id}>
              {i > 0 && <Separator className="my-2" />}
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(version.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm truncate">
                    {version.title || version.content || "—"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => restore(version)}
                >
                  {translate("resources.personal_notes.action.restore", {
                    _: "Restore",
                  })}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
