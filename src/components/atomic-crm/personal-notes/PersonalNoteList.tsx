import { useState } from "react";
import { Plus } from "lucide-react";
import { FilterLiveForm, useListContext, useTranslate } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { useViewMode } from "../misc/useViewMode";
import { usePreferences } from "../preferences";
import { PersonalNoteGrid } from "./PersonalNoteGrid";
import {
  PersonalNoteCreatePage,
  PersonalNoteEditPage,
} from "./PersonalNoteFullPageEditor";
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

  // Opening a note (or creating one) replaces this whole view with its
  // own full page — sidebar and all — rather than overlaying a dialog on
  // top of the grid. A calmer, more spacious writing surface than a
  // cramped modal, and it means the note's own color can wash the entire
  // page instead of just a card.
  if (matchCreate) {
    return <PersonalNoteCreatePage />;
  }
  if (matchEdit?.params.id) {
    return <PersonalNoteEditPage id={matchEdit.params.id} />;
  }

  return (
    <div className="flex gap-6 mt-4">
      <PersonalNotesSidebar tab={tab} setTab={setTab} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <NotesSearchInput />
          <AddCrumbBar />
          <div className="flex-1" />
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
    </div>
  );
};

const NotesSearchInput = () => {
  const { noteCorners } = usePreferences();
  return (
    <FilterLiveForm>
      <SearchInput
        source="q"
        alwaysOn
        className="max-w-xl w-full"
        inputClassName={cn(
          "h-9 bg-muted border-none shadow-none dark:bg-muted pr-16",
          noteCorners === "square" ? "rounded-none" : "rounded-md",
        )}
        placeholder="Search notes…"
      />
    </FilterLiveForm>
  );
};

const AddCrumbBar = () => {
  const translate = useTranslate();
  const { noteCorners } = usePreferences();
  return (
    // Standard primary Button now (was a custom bg-card/text-muted-
    // foreground button, low-contrast and inconsistent with every other
    // "add" action in the app -- e.g. the empty state's own New Note
    // button already used the real primary color: white on dark mode,
    // black on light mode).
    <Button
      asChild
      size="sm"
      className={cn(
        "shrink-0 h-9",
        noteCorners === "square" && "rounded-none",
      )}
    >
      <Link to="/personal_notes/create">
        <Plus className="w-4 h-4" />
        {translate("resources.personal_notes.action.new", {
          _: "Add a note…",
        })}
      </Link>
    </Button>
  );
};
