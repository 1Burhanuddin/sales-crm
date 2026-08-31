import { Create } from "@/components/admin/create";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Form, useRedirect } from "ra-core";

import { PersonalNoteInputs } from "./PersonalNoteInputs";

export const PersonalNoteCreate = ({ open }: { open: boolean }) => {
  const redirect = useRedirect();
  const handleClose = () => redirect("/personal_notes");

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="lg:max-w-lg overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        <Create
          resource="personal_notes"
          mutationOptions={{ onSuccess: () => redirect("/personal_notes") }}
        >
          <Form defaultValues={{ type: "note" }}>
            <PersonalNoteInputs />
            <FormToolbar>
              <SaveButton />
            </FormToolbar>
          </Form>
        </Create>
      </DialogContent>
    </Dialog>
  );
};
