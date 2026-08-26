import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
import { useDataProvider, useListContext, type DataProvider } from "ra-core";
import { useEffect, useState } from "react";
import type { Identifier } from "ra-core";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Issue } from "../types";
import { IssueColumn } from "./IssueColumn";
import type { IssuesByStatus } from "./issueUtils";
import { getIssuesByStatus } from "./issueUtils";

export const IssueListContent = ({
  projectId,
}: {
  projectId: Identifier;
}) => {
  const { issueStatuses } = useConfigurationContext();
  const { data: unorderedIssues, isPending, refetch } = useListContext<Issue>();
  const dataProvider = useDataProvider();

  const [issuesByStatus, setIssuesByStatus] = useState<IssuesByStatus>(
    getIssuesByStatus([], issueStatuses),
  );

  useEffect(() => {
    if (unorderedIssues) {
      const newIssuesByStatus = getIssuesByStatus(
        unorderedIssues,
        issueStatuses,
      );
      if (!isEqual(newIssuesByStatus, issuesByStatus)) {
        setIssuesByStatus(newIssuesByStatus);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unorderedIssues]);

  if (isPending) return null;

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;
    const sourceIssue = issuesByStatus[sourceStatus][source.index]!;
    const destinationIssue = issuesByStatus[destinationStatus][
      destination.index
    ] ?? {
      status: destinationStatus,
      index: undefined, // undefined if dropped after the last item
    };

    // compute local state change synchronously
    setIssuesByStatus(
      updateIssueStatusLocal(
        sourceIssue,
        { status: sourceStatus, index: source.index },
        { status: destinationStatus, index: destination.index },
        issuesByStatus,
      ),
    );

    // persist the changes
    updateIssueStatus(sourceIssue, destinationIssue, projectId, dataProvider).then(
      () => {
        refetch();
      },
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {issueStatuses.map((status) => (
          <IssueColumn
            status={status.value}
            issues={issuesByStatus[status.value]}
            key={status.value}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

const updateIssueStatusLocal = (
  sourceIssue: Issue,
  source: { status: string; index: number },
  destination: {
    status: string;
    index?: number; // undefined if dropped after the last item
  },
  issuesByStatus: IssuesByStatus,
) => {
  if (source.status === destination.status) {
    // moving issue inside the same column
    const column = issuesByStatus[source.status];
    column.splice(source.index, 1);
    column.splice(destination.index ?? column.length + 1, 0, sourceIssue);
    return {
      ...issuesByStatus,
      [destination.status]: column,
    };
  } else {
    // moving issue across columns
    const sourceColumn = issuesByStatus[source.status];
    const destinationColumn = issuesByStatus[destination.status];
    sourceColumn.splice(source.index, 1);
    destinationColumn.splice(
      destination.index ?? destinationColumn.length + 1,
      0,
      sourceIssue,
    );
    return {
      ...issuesByStatus,
      [source.status]: sourceColumn,
      [destination.status]: destinationColumn,
    };
  }
};

const updateIssueStatus = async (
  source: Issue,
  destination: {
    status: string;
    index?: number; // undefined if dropped after the last item
  },
  projectId: Identifier,
  dataProvider: DataProvider,
) => {
  if (source.status === destination.status) {
    // moving issue inside the same column
    // Fetch all the issues in this status+project (because the list may be filtered, but we need to update even non-filtered issues)
    const { data: columnIssues } = await dataProvider.getList("issues", {
      sort: { field: "index", order: "ASC" },
      pagination: { page: 1, perPage: 100 },
      filter: { status: source.status, project_id: projectId },
    });
    const destinationIndex = destination.index ?? columnIssues.length + 1;

    if (source.index > destinationIndex) {
      await Promise.all([
        ...columnIssues
          .filter(
            (issue) =>
              issue.index >= destinationIndex && issue.index < source.index,
          )
          .map((issue) =>
            dataProvider.update("issues", {
              id: issue.id,
              data: { index: issue.index + 1 },
              previousData: issue,
            }),
          ),
        dataProvider.update("issues", {
          id: source.id,
          data: { index: destinationIndex },
          previousData: source,
        }),
      ]);
    } else {
      await Promise.all([
        ...columnIssues
          .filter(
            (issue) =>
              issue.index <= destinationIndex && issue.index > source.index,
          )
          .map((issue) =>
            dataProvider.update("issues", {
              id: issue.id,
              data: { index: issue.index - 1 },
              previousData: issue,
            }),
          ),
        dataProvider.update("issues", {
          id: source.id,
          data: { index: destinationIndex },
          previousData: source,
        }),
      ]);
    }
  } else {
    // moving issue across columns
    const [{ data: sourceIssues }, { data: destinationIssues }] =
      await Promise.all([
        dataProvider.getList("issues", {
          sort: { field: "index", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          filter: { status: source.status, project_id: projectId },
        }),
        dataProvider.getList("issues", {
          sort: { field: "index", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          filter: { status: destination.status, project_id: projectId },
        }),
      ]);
    const destinationIndex =
      destination.index ?? destinationIssues.length + 1;

    await Promise.all([
      ...sourceIssues
        .filter((issue) => issue.index > source.index)
        .map((issue) =>
          dataProvider.update("issues", {
            id: issue.id,
            data: { index: issue.index - 1 },
            previousData: issue,
          }),
        ),
      ...destinationIssues
        .filter((issue) => issue.index >= destinationIndex)
        .map((issue) =>
          dataProvider.update("issues", {
            id: issue.id,
            data: { index: issue.index + 1 },
            previousData: issue,
          }),
        ),
      dataProvider.update("issues", {
        id: source.id,
        data: {
          index: destinationIndex,
          status: destination.status,
        },
        previousData: source,
      }),
    ]);
  }
};
