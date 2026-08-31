import {
  EditBase,
  Form,
  useEditContext,
  useNotify,
  useRecordContext,
  useRedirect,
  useTranslate,
} from "ra-core";
import { Link } from "react-router";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";

import { FormToolbar } from "../../layout/FormToolbar";
import type { LeaveRequest } from "../../types";
import { LeaveRequestInputs } from "./LeaveRequestInputs";

export const LeaveRequestEdit = ({
  open,
  id,
}: {
  open: boolean;
  id?: string;
}) => {
  const redirect = useRedirect();
  const notify = useNotify();

  const handleClose = () => {
    redirect("/leave_requests", undefined, undefined, undefined, {
      _scrollToTop: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="lg:max-w-2xl p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        {id ? (
          <EditBase
            id={id}
            resource="leave_requests"
            mutationMode="pessimistic"
            mutationOptions={{
              onSuccess: () => {
                notify("resources.leave_requests.updated", {});
                redirect(
                  `/leave_requests/${id}/show`,
                  undefined,
                  undefined,
                  undefined,
                  { _scrollToTop: false },
                );
              },
            }}
          >
            <EditHeader />
            <Form>
              <LeaveRequestInputs />
              <FormToolbar />
            </Form>
          </EditBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

function EditHeader() {
  const translate = useTranslate();
  const { defaultTitle } = useEditContext<LeaveRequest>();
  const record = useRecordContext<LeaveRequest>();
  if (!record) return null;

  return (
    <DialogTitle className="pb-0">
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-2xl font-semibold">{defaultTitle}</h2>
        <div className="flex gap-2 pr-12">
          <DeleteButton />
          <Button asChild variant="outline" className="h-9">
            <Link to={`/leave_requests/${record.id}/show`}>
              {translate("resources.leave_requests.action.back", {
                _: "Back",
              })}
            </Link>
          </Button>
        </div>
      </div>
    </DialogTitle>
  );
}
