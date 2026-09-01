import { useGetList, useRecordContext } from "ra-core";
import { Badge } from "@/components/ui/badge";

import type { Issue } from "../types";

/** Sub-task done/total badge for kanban cards and table rows. Deferred
 * from #69 to avoid an N+1 -- every instance of this component (one per
 * row/card) fetches the *whole project's* issues with the same
 * {filter: {project_id}} params, so react-query's cache dedupes them
 * into exactly one network request per project per page load, not one
 * per row. Same "list already-fetched data, group client-side" idea as
 * SprintPanel.tsx/MilestonePanel.tsx's progress bars, just via a shared
 * query instead of prop-drilled data since this needs to work inside
 * DataTable.Col (a field component, not something the parent list can
 * pass extra props into per row). */
export const IssueSubtaskBadge = () => {
  const issue = useRecordContext<Issue>();
  const { data: projectIssues } = useGetList<Issue>(
    "issues",
    {
      filter: { project_id: issue?.project_id },
      pagination: { page: 1, perPage: 1000 },
    },
    { enabled: issue?.project_id != null },
  );

  if (!issue || issue.parent_id != null) return null;

  const children = (projectIssues ?? []).filter(
    (i) => i.parent_id === issue.id,
  );
  if (children.length === 0) return null;

  const done = children.filter((i) => i.status === "done").length;

  return (
    <Badge variant="outline" className="text-[10px] font-normal shrink-0">
      {done}/{children.length}
    </Badge>
  );
};
