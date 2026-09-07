import { Droppable } from "@hello-pangea/dnd";
import { useTranslate } from "ra-core";

import type { Assignment, AssignmentStatus } from "../types";
import { AssignmentCard } from "./AssignmentCard";

export const AssignmentColumn = ({
  status,
  assignments,
}: {
  status: AssignmentStatus;
  assignments: Assignment[];
}) => {
  const translate = useTranslate();
  return (
    <div className="flex-1 pb-8 min-w-[220px]">
      <div className="flex flex-col items-center">
        <h3 className="text-base font-medium">
          {translate(`resources.assignments.status.${status}`)}
        </h3>
        <p className="text-sm text-muted-foreground">{assignments.length}</p>
      </div>
      <Droppable droppableId={status}>
        {(droppableProvided, snapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`flex flex-col rounded-2xl mt-2 gap-2 ${
              snapshot.isDraggingOver ? "bg-muted" : ""
            }`}
          >
            {assignments.map((assignment, index) => (
              <AssignmentCard key={assignment.id} assignment={assignment} index={index} />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
