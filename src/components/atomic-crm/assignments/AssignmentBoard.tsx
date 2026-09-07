import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import { useDataProvider, useListContext, useNotify, type Identifier } from "ra-core";
import { useState } from "react";

import type { Assignment, AssignmentStatus } from "../types";
import { AssignmentColumn } from "./AssignmentColumn";

const STATUSES: AssignmentStatus[] = ["todo", "in_progress", "done"];

// Simpler than IssueListContent's kanban -- assignments have no explicit
// `index` column for precise in-column ordering, so a drop only ever
// changes `status`; within a column, cards render in whatever order the
// list query returned (due_date).
export const AssignmentBoard = () => {
  const { data: assignments, refetch } = useListContext<Assignment>();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  // Applied on top of the fetched data so a drop shows in its new column
  // immediately, instead of snapping back until the update round-trips
  // and refetch() completes.
  const [statusOverrides, setStatusOverrides] = useState<
    Record<Identifier, AssignmentStatus>
  >({});

  const byStatus: Record<AssignmentStatus, Assignment[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  for (const a of assignments ?? []) {
    const status = statusOverrides[a.id] ?? a.status;
    (byStatus[status] ?? byStatus.todo).push(a);
  }

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const assignment = (assignments ?? []).find((a) => String(a.id) === draggableId);
    if (!assignment) return;

    const newStatus = destination.droppableId as AssignmentStatus;
    setStatusOverrides((prev) => ({ ...prev, [assignment.id]: newStatus }));

    dataProvider
      .update("assignments", {
        id: assignment.id,
        data: { status: newStatus },
        previousData: assignment,
      })
      .then(() => {
        refetch();
      })
      .catch(() => {
        setStatusOverrides((prev) => {
          const next = { ...prev };
          delete next[assignment.id];
          return next;
        });
        notify("ra.notification.http_error", { type: "error" });
      });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {STATUSES.map((status) => (
          <AssignmentColumn key={status} status={status} assignments={byStatus[status]} />
        ))}
      </div>
    </DragDropContext>
  );
};
