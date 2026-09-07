import { Draggable } from "@hello-pangea/dnd";
import { RecordContextProvider, useRedirect } from "ra-core";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { Card, CardContent } from "@/components/ui/card";

import type { Assignment } from "../types";

export const AssignmentCard = ({
  assignment,
  index,
}: {
  assignment: Assignment;
  index: number;
}) => (
  <Draggable draggableId={String(assignment.id)} index={index}>
    {(provided, snapshot) => (
      <AssignmentCardContent provided={provided} snapshot={snapshot} assignment={assignment} />
    )}
  </Draggable>
);

const AssignmentCardContent = ({
  provided,
  snapshot,
  assignment,
}: {
  provided?: any;
  snapshot?: any;
  assignment: Assignment;
}) => {
  const redirect = useRedirect();
  return (
    <div
      className="cursor-pointer"
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      onClick={() =>
        redirect(`/assignments/${assignment.id}/show`, undefined, undefined, undefined, {
          _scrollToTop: false,
        })
      }
    >
      <RecordContextProvider value={assignment}>
        <Card
          className={`py-3 transition-all duration-200 ${
            snapshot?.isDragging
              ? "opacity-90 transform rotate-1 shadow-lg"
              : "shadow-sm hover:shadow-md"
          }`}
        >
          <CardContent className="px-3 flex flex-col gap-1">
            <p className="text-sm font-medium">{assignment.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <ReferenceField source="assignee_id" reference="sales" link={false} />
              {assignment.due_date && <DateField source="due_date" />}
            </p>
          </CardContent>
        </Card>
      </RecordContextProvider>
    </div>
  );
};
