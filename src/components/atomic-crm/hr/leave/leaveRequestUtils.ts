import type { LeaveRequest } from "../../types";
import { LEAVE_REQUEST_STATUSES } from "./leaveRequestStatuses";

export type LeaveRequestsByStatus = Record<string, LeaveRequest[]>;

export const getLeaveRequestsByStatus = (
  requests: LeaveRequest[],
): LeaveRequestsByStatus => {
  const byStatus: LeaveRequestsByStatus = LEAVE_REQUEST_STATUSES.reduce(
    (acc, status) => ({ ...acc, [status.value]: [] }),
    {} as LeaveRequestsByStatus,
  );
  requests.forEach((request) => {
    const status = byStatus[request.status]
      ? request.status
      : LEAVE_REQUEST_STATUSES[0].value;
    byStatus[status].push(request);
  });
  Object.keys(byStatus).forEach((status) => {
    byStatus[status] = byStatus[status].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  });
  return byStatus;
};

export const findLeaveRequestStatusLabel = (status: string) =>
  LEAVE_REQUEST_STATUSES.find((s) => s.value === status)?.label ?? status;
