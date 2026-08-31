import { Create } from "@/components/admin/create";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Form, useGetIdentity, useRedirect } from "ra-core";

import { useMyEmployee } from "../useMyEmployee";
import { LeaveRequestInputs } from "./LeaveRequestInputs";

export const LeaveRequestCreate = ({ open }: { open: boolean }) => {
  const redirect = useRedirect();
  const { identity } = useGetIdentity();
  const { employee, isPending } = useMyEmployee();
  const isAdmin = Boolean((identity as any)?.administrator);

  const handleClose = () => {
    redirect("/leave_requests");
  };

  if (open && !isAdmin && isPending) return null;

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="lg:max-w-2xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        <Create
          resource="leave_requests"
          mutationOptions={{ onSuccess: () => redirect("/leave_requests") }}
        >
          <Form defaultValues={{ employee_id: isAdmin ? undefined : employee?.id }}>
            <LeaveRequestInputs />
            <FormToolbar>
              <SaveButton />
            </FormToolbar>
          </Form>
        </Create>
      </DialogContent>
    </Dialog>
  );
};
