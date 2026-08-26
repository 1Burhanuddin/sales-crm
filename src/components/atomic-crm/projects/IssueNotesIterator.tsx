import { useListContext } from "ra-core";
import { Fragment } from "react";
import { Separator } from "@/components/ui/separator";

import { InfinitePagination } from "../misc/InfinitePagination";
import type { IssueNote as IssueNoteType } from "../types";
import { IssueNote } from "./IssueNote";
import { IssueNoteCreate } from "./IssueNoteCreate";

export const IssueNotesIterator = () => {
  const { isPending, error, data = [] } = useListContext<IssueNoteType>();

  if (isPending || error) return null;

  return (
    <div className="mt-4">
      <IssueNoteCreate />
      {data.length > 0 && (
        <div className="mt-4 space-y-4">
          {data.map((note, index) => (
            <Fragment key={note.id}>
              <IssueNote note={note} />
              {index < data.length - 1 && <Separator />}
            </Fragment>
          ))}
        </div>
      )}
      <InfinitePagination />
    </div>
  );
};
