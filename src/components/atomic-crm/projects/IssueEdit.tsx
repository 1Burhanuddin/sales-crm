import {
  EditBase,
  Form,
  useEditContext,
  useRecordContext,
  useRedirect,
  useTranslate,
  type Identifier,
} from "ra-core";
import { Link } from "react-router";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { FormToolbar } from "../layout/FormToolbar";
import type { Issue } from "../types";
import { IssueInputs } from "./IssueInputs";

export const IssueEdit = ({
  open,
  id,
  projectId,
}: {
  open: boolean;
  id?: string;
  projectId: Identifier;
}) => {
  const redirect = useRedirect();

  const handleClose = () => {
    redirect(`/projects/${projectId}/show`, undefined, undefined, undefined, {
      _scrollToTop: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="lg:max-w-2xl p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        {id ? (
          <EditBase
            id={id}
            resource="issues"
            mutationMode="pessimistic"
            mutationOptions={{
              onSuccess: () => {
                redirect(
                  `/projects/${projectId}/issues/${id}/show`,
                  undefined,
                  undefined,
                  undefined,
                  { _scrollToTop: false },
                );
              },
            }}
          >
            <EditHeader projectId={projectId} />
            <Form>
              <IssueInputs />
              <FormToolbar />
            </Form>
          </EditBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

function EditHeader({ projectId }: { projectId: Identifier }) {
  const translate = useTranslate();
  const redirect = useRedirect();
  const { defaultTitle } = useEditContext<Issue>();
  const issue = useRecordContext<Issue>();
  if (!issue) {
    return null;
  }

  return (
    <DialogTitle className="pb-0">
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-2xl font-semibold">{defaultTitle}</h2>
        <div className="flex gap-2 pr-12">
          <DeleteButton
            redirect={false}
            mutationOptions={{
              onSuccess: () => {
                redirect(`/projects/${projectId}/show`);
              },
            }}
          />
          <Button asChild variant="outline" className="h-9">
            <Link to={`/projects/${projectId}/issues/${issue.id}/show`}>
              {translate("resources.issues.action.back_to_issue")}
            </Link>
          </Button>
        </div>
      </div>
    </DialogTitle>
  );
}
