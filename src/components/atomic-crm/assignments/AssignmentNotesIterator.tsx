import { useListContext } from "ra-core";
import { Fragment } from "react";
import { Separator } from "@/components/ui/separator";

import { InfinitePagination } from "../misc/InfinitePagination";
import type { AssignmentNote as AssignmentNoteType } from "../types";
import { AssignmentNote } from "./AssignmentNote";
import { AssignmentNoteCreate } from "./AssignmentNoteCreate";

export const AssignmentNotesIterator = () => {
  const { isPending, error, data = [] } = useListContext<AssignmentNoteType>();

  if (isPending || error) return null;

  return (
    <div className="mt-4">
      <AssignmentNoteCreate />
      {data.length > 0 && (
        <div className="mt-4 space-y-4">
          {data.map((note, index) => (
            <Fragment key={note.id}>
              <AssignmentNote note={note} />
              {index < data.length - 1 && <Separator />}
            </Fragment>
          ))}
        </div>
      )}
      <InfinitePagination />
    </div>
  );
};
