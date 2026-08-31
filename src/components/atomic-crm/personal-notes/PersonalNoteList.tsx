import { useState } from "react";
import { useListContext, useTranslate } from "ra-core";
import { matchPath, useLocation } from "react-router";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { CreateButton } from "@/components/admin/create-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";

import { TopToolbar } from "../layout/TopToolbar";
import { useViewMode } from "../misc/useViewMode";
import { PersonalNoteCreate } from "./PersonalNoteCreate";
import { PersonalNoteEdit } from "./PersonalNoteEdit";
import { PersonalNoteGrid } from "./PersonalNoteGrid";
import { PersonalNoteTable } from "./PersonalNoteTable";

type Tab = "notes" | "archived" | "trash";

const filtersForTab = (tab: Tab) => {
  if (tab === "archived") {
    return { "archived_at@not.is": null, "deleted_at@is": null };
  }
  if (tab === "trash") {
    return { "deleted_at@not.is": null };
  }
  return { "archived_at@is": null, "deleted_at@is": null };
};

export const PersonalNoteList = () => {
  const [tab, setTab] = useState<Tab>("notes");
  const [viewMode, setViewMode] = useViewMode<"grid" | "table">(
    "personal-notes-view-mode",
    "grid",
  );

  return (
    <List
      title={false}
      perPage={100}
      pagination={null}
      filter={filtersForTab(tab)}
      filters={[<SearchInput source="q" alwaysOn />]}
      sort={{ field: "updated_at", order: "DESC" }}
      actions={
        <PersonalNoteActions
          tab={tab}
          setTab={setTab}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      }
    >
      <PersonalNoteLayout viewMode={viewMode} />
    </List>
  );
};

const PersonalNoteLayout = ({ viewMode }: { viewMode: "grid" | "table" }) => {
  const location = useLocation();
  const matchCreate = matchPath("/personal_notes/create", location.pathname);
  const matchEdit = matchPath("/personal_notes/:id", location.pathname);
  const { isPending } = useListContext();
  if (isPending) return null;

  return (
    <div className="w-full">
      {viewMode === "table" ? <PersonalNoteTable /> : <PersonalNoteGrid />}
      <PersonalNoteCreate open={!!matchCreate} />
      <PersonalNoteEdit
        open={!!matchEdit && !matchCreate}
        id={matchEdit?.params.id}
      />
    </div>
  );
};

const PersonalNoteActions = ({
  tab,
  setTab,
  viewMode,
  setViewMode,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
}) => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <div className="flex gap-1 mr-2">
        {(["notes", "archived", "trash"] as const).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={tab === t ? "default" : "ghost"}
            onClick={() => setTab(t)}
          >
            {translate(`resources.personal_notes.tabs.${t}`, {
              _: t[0].toUpperCase() + t.slice(1),
            })}
          </Button>
        ))}
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={viewMode}
        onValueChange={(value) => value && setViewMode(value as "grid" | "table")}
      >
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <LayoutGrid className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view">
          <TableIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      <CreateButton
        label={translate("resources.personal_notes.action.new", {
          _: "New Note",
        })}
      />
    </TopToolbar>
  );
};
