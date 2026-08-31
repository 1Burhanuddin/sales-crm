import { Droppable } from "@hello-pangea/dnd";

import type { LeaveRequest } from "../../types";
import { LeaveRequestCard } from "./LeaveRequestCard";
import { findLeaveRequestStatusLabel } from "./leaveRequestUtils";

export const LeaveRequestColumn = ({
  status,
  requests,
  draggable,
}: {
  status: string;
  requests: LeaveRequest[];
  draggable: boolean;
}) => (
  <div className="flex-1 pb-8 min-w-[220px]">
    <div className="flex flex-col items-center">
      <h3 className="text-base font-medium">
        {findLeaveRequestStatusLabel(status)}
      </h3>
      <p className="text-sm text-muted-foreground">{requests.length}</p>
    </div>
    <Droppable droppableId={status} isDropDisabled={!draggable}>
      {(droppableProvided, snapshot) => (
        <div
          ref={droppableProvided.innerRef}
          {...droppableProvided.droppableProps}
          className={`flex flex-col rounded-2xl mt-2 gap-2 ${
            snapshot.isDraggingOver ? "bg-muted" : ""
          }`}
        >
          {requests.map((request, index) => (
            <LeaveRequestCard
              key={request.id}
              request={request}
              index={index}
              draggable={draggable}
            />
          ))}
          {droppableProvided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);
