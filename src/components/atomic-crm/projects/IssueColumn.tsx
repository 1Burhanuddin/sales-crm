import { Droppable } from "@hello-pangea/dnd";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Issue } from "../types";
import { findIssueStatusLabel } from "./issueUtils";
import { IssueCard } from "./IssueCard";

export const IssueColumn = ({
  status,
  issues,
}: {
  status: string;
  issues: Issue[];
}) => {
  const { issueStatuses } = useConfigurationContext();
  return (
    <div className="flex-1 pb-8 min-w-[220px]">
      <div className="flex flex-col items-center">
        <h3 className="text-base font-medium">
          {findIssueStatusLabel(issueStatuses, status)}
        </h3>
        <p className="text-sm text-muted-foreground">{issues.length}</p>
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
            {issues.map((issue, index) => (
              <IssueCard key={issue.id} issue={issue} index={index} />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
