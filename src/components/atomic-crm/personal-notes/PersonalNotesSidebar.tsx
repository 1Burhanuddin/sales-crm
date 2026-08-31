import { Archive, NotebookText, Trash2 } from "lucide-react";
import { useTranslate } from "ra-core";
import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useTags } from "../tags/useTags";

type Tab = "notes" | "archived" | "trash";

export const PersonalNotesSidebar = ({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
}) => {
  const translate = useTranslate();
  const { data: tags } = useTags({ perPage: 100 });

  const navItems: { id: Tab; label: string; icon: typeof NotebookText }[] = [
    { id: "notes", label: "resources.personal_notes.tabs.notes", icon: NotebookText },
    { id: "archived", label: "resources.personal_notes.tabs.archived", icon: Archive },
    { id: "trash", label: "resources.personal_notes.tabs.trash", icon: Trash2 },
  ];

  return (
    <aside className="w-56 shrink-0 flex flex-col gap-1 pr-4 border-r">
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            type="button"
            variant={tab === id ? "secondary" : "ghost"}
            className="justify-start gap-2"
            onClick={() => setTab(id)}
          >
            <Icon className="w-4 h-4" />
            {translate(label, { _: id[0].toUpperCase() + id.slice(1) })}
          </Button>
        ))}
      </nav>

      {tags && tags.length > 0 && (
        <>
          <h4 className="text-xs uppercase tracking-wide text-muted-foreground mt-4 mb-1 px-2">
            {translate("resources.tags.name", { smart_count: 2, _: "Tags" })}
          </h4>
          <div className="flex flex-col gap-0.5">
            {tags.map((tag) => (
              <ToggleFilterButton
                key={tag.id}
                className="justify-start gap-2"
                value={{ "tags@cs": `{${tag.id}}` }}
                label={
                  <span className="flex items-center gap-2">
                    <span
                      className={cn("w-2.5 h-2.5 rounded-full shrink-0")}
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </span>
                }
              />
            ))}
          </div>
        </>
      )}
    </aside>
  );
};
