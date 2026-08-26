import { Draggable } from "@hello-pangea/dnd";
import { useRedirect, RecordContextProvider } from "ra-core";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { SelectField } from "@/components/admin/select-field";
import { Card, CardContent } from "@/components/ui/card";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Issue } from "../types";

export const IssueCard = ({
  issue,
  index,
}: {
  issue: Issue;
  index: number;
}) => {
  if (!issue) return null;

  return (
    <Draggable draggableId={String(issue.id)} index={index}>
      {(provided, snapshot) => (
        <IssueCardContent
          provided={provided}
          snapshot={snapshot}
          issue={issue}
        />
      )}
    </Draggable>
  );
};

export const IssueCardContent = ({
  provided,
  snapshot,
  issue,
}: {
  provided?: any;
  snapshot?: any;
  issue: Issue;
}) => {
  const { issuePriorities } = useConfigurationContext();
  const redirect = useRedirect();
  const handleClick = () => {
    redirect(
      `/projects/${issue.project_id}/issues/${issue.id}/show`,
      undefined,
      undefined,
      undefined,
      { _scrollToTop: false },
    );
  };

  return (
    <div
      className="cursor-pointer"
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      onClick={handleClick}
    >
      <RecordContextProvider value={issue}>
        <Card
          className={`py-3 transition-all duration-200 ${
            snapshot?.isDragging
              ? "opacity-90 transform rotate-1 shadow-lg"
              : "shadow-sm hover:shadow-md"
          }`}
        >
          <CardContent className="px-3 flex flex-col gap-1">
            <p className="text-sm font-medium">{issue.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              {issue.priority && (
                <SelectField
                  source="priority"
                  choices={issuePriorities}
                  optionText="label"
                  optionValue="value"
                />
              )}
              {issue.assignee_id && (
                <ReferenceField
                  source="assignee_id"
                  reference="sales"
                  link={false}
                />
              )}
              {issue.due_date && <DateField source="due_date" />}
            </p>
          </CardContent>
        </Card>
      </RecordContextProvider>
    </div>
  );
};
