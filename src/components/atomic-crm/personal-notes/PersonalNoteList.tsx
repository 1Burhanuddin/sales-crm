import { useState } from "react";
import { Plus } from "lucide-react";
import { useListContext, useRedirect, useTranslate } from "ra-core";
import { matchPath, useLocation } from "react-router";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { useViewMode } from "../misc/useViewMode";
import { PersonalNoteCreate } from "./PersonalNoteCreate";
import { PersonalNoteEdit } from "./PersonalNoteEdit";
import { PersonalNoteGrid } from "./PersonalNoteGrid";
import { PersonalNotesSidebar } from "./PersonalNotesSidebar";
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
      actions={false}
      disableBreadcrumb
      perPage={100}
      pagination={null}
      filter={filtersForTab(tab)}
      filters={[
        <SearchInput
          key="q"
          source="q"
          alwaysOn
          className="h-11 rounded-full bg-muted border-none max-w-xl w-full"
          placeholder="Search notes…"
        />,
      ]}
      sort={{ field: "updated_at", order: "DESC" }}
      className="!my-0"
    >
      <PersonalNoteLayout
        tab={tab}
        setTab={setTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    </List>
  );
};

const PersonalNoteLayout = ({
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
  const location = useLocation();
  const matchCreate = matchPath("/personal_notes/create", location.pathname);
  const matchEdit = matchPath("/personal_notes/:id", location.pathname);
  const { isPending } = useListContext();

  return (
    <div className="flex gap-6 mt-4">
      <PersonalNotesSidebar tab={tab} setTab={setTab} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <AddCrumbBar />
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={viewMode}
            onValueChange={(value) =>
              value && setViewMode(value as "grid" | "table")
            }
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {!isPending &&
          (viewMode === "table" ? <PersonalNoteTable /> : <PersonalNoteGrid />)}
      </div>
      <PersonalNoteCreate open={!!matchCreate} />
      <PersonalNoteEdit
        open={!!matchEdit && !matchCreate}
        id={matchEdit?.params.id}
      />
    </div>
  );
};

const AddCrumbBar = () => {
  const translate = useTranslate();
  const redirect = useRedirect();
  return (
    <button
      type="button"
      onClick={() => redirect("/personal_notes/create")}
      className="flex-1 flex items-center gap-2 h-11 px-4 rounded-xl border bg-card text-sm text-muted-foreground hover:bg-muted transition-colors"
    >
      <Plus className="w-4 h-4" />
      {translate("resources.personal_notes.action.new", {
        _: "Add a note…",
      })}
    </button>
  );
};
