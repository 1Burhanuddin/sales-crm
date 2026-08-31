import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import {
  useDataProvider,
  useGetIdentity,
  useListContext,
  useNotify,
  useRefresh,
} from "ra-core";

import type { LeaveRequest } from "../../types";
import { LeaveRequestColumn } from "./LeaveRequestColumn";
import { LEAVE_REQUEST_STATUSES } from "./leaveRequestStatuses";
import { getLeaveRequestsByStatus } from "./leaveRequestUtils";

export const LeaveRequestListContent = () => {
  const { data, isPending } = useListContext<LeaveRequest>();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const { identity } = useGetIdentity();
  const isAdmin = Boolean((identity as any)?.administrator);

  if (isPending) return null;

  const requestsByStatus = getLeaveRequestsByStatus(data ?? []);

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!isAdmin) return;
    const { destination, source } = result;
    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const request = requestsByStatus[source.droppableId][source.index];
    const newStatus = destination.droppableId as LeaveRequest["status"];
    const isDecided = newStatus === "approved" || newStatus === "rejected";

    dataProvider
      .update("leave_requests", {
        id: request.id,
        data: {
          status: newStatus,
          approved_by: isDecided ? identity?.id : null,
          approved_at: isDecided ? new Date().toISOString() : null,
        },
        previousData: request,
      })
      .then(() => refresh())
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4">
        {LEAVE_REQUEST_STATUSES.map((status) => (
          <LeaveRequestColumn
            key={status.value}
            status={status.value}
            requests={requestsByStatus[status.value]}
            draggable={isAdmin}
          />
        ))}
      </div>
    </DragDropContext>
  );
};
