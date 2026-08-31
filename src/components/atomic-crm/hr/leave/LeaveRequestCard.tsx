import { Draggable } from "@hello-pangea/dnd";
import { RecordContextProvider, useRedirect } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { Card, CardContent } from "@/components/ui/card";

import { useConfigurationContext } from "../../root/ConfigurationContext";
import type { LeaveRequest } from "../../types";

export const LeaveRequestCard = ({
  request,
  index,
  draggable,
}: {
  request: LeaveRequest;
  index: number;
  draggable: boolean;
}) => {
  if (!draggable) {
    return <LeaveRequestCardContent request={request} />;
  }
  return (
    <Draggable draggableId={String(request.id)} index={index}>
      {(provided, snapshot) => (
        <LeaveRequestCardContent
          request={request}
          provided={provided}
          snapshot={snapshot}
        />
      )}
    </Draggable>
  );
};

const LeaveRequestCardContent = ({
  request,
  provided,
  snapshot,
}: {
  request: LeaveRequest;
  provided?: any;
  snapshot?: any;
}) => {
  const { leaveTypes } = useConfigurationContext();
  const redirect = useRedirect();
  const handleClick = () =>
    redirect(
      `/leave_requests/${request.id}/show`,
      undefined,
      undefined,
      undefined,
      { _scrollToTop: false },
    );
  const typeLabel =
    leaveTypes.find((t) => t.value === request.leave_type)?.label ??
    request.leave_type;

  return (
    <div
      className="cursor-pointer"
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      onClick={handleClick}
    >
      <RecordContextProvider value={request}>
        <Card
          className={`py-3 transition-all duration-200 ${
            snapshot?.isDragging
              ? "opacity-90 transform rotate-1 shadow-lg"
              : "shadow-sm hover:shadow-md"
          }`}
        >
          <CardContent className="px-3 flex flex-col gap-1">
            <p className="text-sm font-medium">
              <ReferenceField
                source="employee_id"
                reference="employees"
                link={false}
              />
            </p>
            <p className="text-xs text-muted-foreground">
              {typeLabel} · {request.days ?? "?"} day
              {request.days === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-muted-foreground">
              {request.from_date} → {request.to_date}
            </p>
          </CardContent>
        </Card>
      </RecordContextProvider>
    </div>
  );
};
