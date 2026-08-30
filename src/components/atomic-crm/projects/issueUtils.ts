import type { ConfigurationContextValue } from "../root/ConfigurationContext";
import type { Issue } from "../types";

export type IssuesByStatus = Record<Issue["status"], Issue[]>;

export const findIssueStatusLabel = (
  issueStatuses: ConfigurationContextValue["issueStatuses"],
  statusValue: string,
) => {
  const issueStatus = issueStatuses.find((s) => s.value === statusValue);
  return issueStatus?.label;
};

export const getIssuesByStatus = (
  unorderedIssues: Issue[],
  issueStatuses: ConfigurationContextValue["issueStatuses"],
) => {
  if (!issueStatuses) return {};
  const issuesByStatus: Record<Issue["status"], Issue[]> =
    unorderedIssues.reduce(
      (acc, issue) => {
        // if issue has a status that does not exist in configuration, assign it to the first status
        const status = issueStatuses.find((s) => s.value === issue.status)
          ? issue.status
          : issueStatuses[0].value;
        acc[status].push(issue);
        return acc;
      },
      issueStatuses.reduce(
        (obj, status) => ({ ...obj, [status.value]: [] }),
        {} as Record<Issue["status"], Issue[]>,
      ),
    );
  // order each column by index
  issueStatuses.forEach((status) => {
    issuesByStatus[status.value] = issuesByStatus[status.value].sort(
      (recordA: Issue, recordB: Issue) => recordA.index - recordB.index,
    );
  });
  return issuesByStatus;
};
