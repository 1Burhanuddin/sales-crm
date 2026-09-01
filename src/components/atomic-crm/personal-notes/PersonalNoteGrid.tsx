import { isPast } from "date-fns";
import { NotebookPen } from "lucide-react";
import { RecordContextProvider, useListContext, useTranslate } from "ra-core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { PersonalNote } from "../types";
import { PersonalNoteCard } from "./PersonalNoteCard";

export const PersonalNoteGrid = () => {
  const { data, isPending } = useListContext<PersonalNote>();
  const translate = useTranslate();
  if (isPending) return <LoadingSkeleton />;

  if (data?.length === 0) {
    return <EmptyState />;
  }

  // A note appears in exactly one section: a due/overdue reminder is the
  // most actionable signal, so it takes priority over pinned even if a
  // note is both -- then pinned, then everything else. No separate
  // dismiss/snooze mechanism for reminders in this pass; clearing the
  // date on the note itself is how one leaves this section.
  const due = (data ?? []).filter(
    (n) => n.remind_at && isPast(new Date(n.remind_at)),
  );
  const dueIds = new Set(due.map((n) => n.id));
  const pinned = (data ?? []).filter((n) => n.pinned && !dueIds.has(n.id));
  const pinnedIds = new Set(pinned.map((n) => n.id));
  const others = (data ?? []).filter(
    (n) => !dueIds.has(n.id) && !pinnedIds.has(n.id),
  );

  return (
    <div className="flex flex-col gap-2">
      {due.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wide text-destructive mb-2">
            {translate("resources.personal_notes.reminders_due", {
              _: "Reminders",
            })}
          </h4>
          <MasonryColumns notes={due} />
        </div>
      )}
      {pinned.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            {translate("resources.personal_notes.pinned", { _: "Pinned" })}
          </h4>
          <MasonryColumns notes={pinned} />
        </div>
      )}
      {(due.length > 0 || pinned.length > 0) && others.length > 0 && (
        <h4 className="text-xs uppercase tracking-wide text-muted-foreground mt-2 mb-2">
          {translate("resources.personal_notes.others", { _: "Others" })}
        </h4>
      )}
      <MasonryColumns notes={others} />
    </div>
  );
};

const MasonryColumns = ({ notes }: { notes: PersonalNote[] }) => (
  <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
    {notes.map((record) => (
      <RecordContextProvider key={record.id} value={record}>
        <PersonalNoteCard />
      </RecordContextProvider>
    ))}
  </div>
);

const EmptyState = () => {
  const translate = useTranslate();
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-20">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted">
        <NotebookPen className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-semibold">
          {translate("resources.personal_notes.empty.title", {
            _: "No notes found",
          })}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {translate("resources.personal_notes.empty.description", {
            _: "It seems your note list is empty.",
          })}
        </p>
      </div>
      <Button asChild size="sm" className="mt-1">
        <Link to="/personal_notes/create">
          {translate("resources.personal_notes.action.new", {
            _: "New Note",
          })}
        </Link>
      </Button>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
    {[36, 28, 44, 32, 24, 40, 30, 26].map((h, i) => (
      <Skeleton
        key={i}
        className="break-inside-avoid mb-3 rounded-xl w-full"
        style={{ height: `${h * 4}px` }}
      />
    ))}
  </div>
);
