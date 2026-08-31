import { RecordContextProvider, useListContext, useTranslate } from "ra-core";

import type { PersonalNote } from "../types";
import { PersonalNoteCard } from "./PersonalNoteCard";

export const PersonalNoteGrid = () => {
  const { data, isPending } = useListContext<PersonalNote>();
  const translate = useTranslate();
  if (isPending) return null;

  const pinned = data?.filter((n) => n.pinned) ?? [];
  const others = data?.filter((n) => !n.pinned) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {pinned.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            {translate("resources.personal_notes.pinned", { _: "Pinned" })}
          </h4>
          <NoteGridSection notes={pinned} />
        </div>
      )}
      {pinned.length > 0 && others.length > 0 && (
        <h4 className="text-xs uppercase tracking-wide text-muted-foreground -mb-4">
          {translate("resources.personal_notes.others", { _: "Others" })}
        </h4>
      )}
      <NoteGridSection notes={others} />
      {data?.length === 0 && (
        <div className="p-2 text-muted-foreground">
          {translate("resources.personal_notes.empty.title", {
            _: "No notes found",
          })}
        </div>
      )}
    </div>
  );
};

const NoteGridSection = ({ notes }: { notes: PersonalNote[] }) => (
  <div
    className="w-full gap-3 grid"
    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
  >
    {notes.map((record) => (
      <RecordContextProvider key={record.id} value={record}>
        <PersonalNoteCard />
      </RecordContextProvider>
    ))}
  </div>
);
