import {
  CreateBase,
  Form,
  useGetIdentity,
  useListContext,
  useNotify,
  useRecordContext,
  useTranslate,
} from "ra-core";
import { useFormContext } from "react-hook-form";
import { SaveButton } from "@/components/admin/form";

import type { Assignment } from "../types";
import { AssignmentNoteInputs } from "./AssignmentNoteInputs";

export const AssignmentNoteCreate = () => {
  const record = useRecordContext<Assignment>();
  const { identity } = useGetIdentity();

  if (!record || !identity) return null;

  return (
    <CreateBase resource="assignment_notes" redirect={false}>
      <Form>
        <div className="space-y-3">
          <AssignmentNoteInputs />
          <AssignmentNoteCreateButton record={record} />
        </div>
      </Form>
    </CreateBase>
  );
};

const AssignmentNoteCreateButton = ({ record }: { record: Assignment }) => {
  const notify = useNotify();
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const { reset } = useFormContext();
  const { refetch } = useListContext();

  if (!record || !identity) return null;

  const handleSuccess = () => {
    reset({ text: null }, { keepValues: false });
    refetch();
    notify("resources.assignment_notes.added", {
      messageArgs: { _: "Comment added" },
    });
  };

  return (
    <div className="flex justify-end">
      <SaveButton
        type="button"
        label={translate("resources.assignment_notes.action.add_this", {
          _: "Add comment",
        })}
        transform={(data) => ({
          ...data,
          assignment_id: record.id,
          sales_id: identity.id,
        })}
        mutationOptions={{ onSuccess: handleSuccess }}
      />
    </div>
  );
};
