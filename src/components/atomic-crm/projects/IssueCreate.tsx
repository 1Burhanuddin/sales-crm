import { useQueryClient } from "@tanstack/react-query";
import {
  Form,
  useDataProvider,
  useGetIdentity,
  useListContext,
  useRedirect,
  type GetListResult,
  type Identifier,
} from "ra-core";
import { Create } from "@/components/admin/create";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Issue } from "../types";
import { IssueInputs } from "./IssueInputs";

export const IssueCreate = ({
  open,
  projectId,
}: {
  open: boolean;
  projectId: Identifier;
}) => {
  const redirect = useRedirect();
  const dataProvider = useDataProvider();
  const { data: allIssues } = useListContext<Issue>();
  const { issueStatuses } = useConfigurationContext();
  const queryClient = useQueryClient();
  const { identity } = useGetIdentity();

  const handleClose = () => {
    redirect(`/projects/${projectId}/show`);
  };

  const onSuccess = async (issue: Issue) => {
    if (!allIssues) {
      handleClose();
      return;
    }
    // increase the index of all issues in the same status as the new issue
    const issues = allIssues.filter(
      (i: Issue) => i.status === issue.status && i.id !== issue.id,
    );
    await Promise.all(
      issues.map(async (oldIssue) =>
        dataProvider.update("issues", {
          id: oldIssue.id,
          data: { index: oldIssue.index + 1 },
          previousData: oldIssue,
        }),
      ),
    );
    const issuesById = issues.reduce(
      (acc, i) => ({
        ...acc,
        [i.id]: { ...i, index: i.index + 1 },
      }),
      {} as { [key: string]: Issue },
    );
    const now = Date.now();
    queryClient.setQueriesData<GetListResult | undefined>(
      { queryKey: ["issues", "getList"] },
      (res) => {
        if (!res) return res;
        return {
          ...res,
          data: res.data.map((i: Issue) => issuesById[i.id] || i),
        };
      },
      { updatedAt: now },
    );
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="lg:max-w-2xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        <Create resource="issues" mutationOptions={{ onSuccess }}>
          <Form
            defaultValues={{
              project_id: projectId,
              sales_id: identity?.id,
              status: issueStatuses[0]?.value,
              index: 0,
            }}
          >
            <IssueInputs />
            <FormToolbar>
              <SaveButton />
            </FormToolbar>
          </Form>
        </Create>
      </DialogContent>
    </Dialog>
  );
};
