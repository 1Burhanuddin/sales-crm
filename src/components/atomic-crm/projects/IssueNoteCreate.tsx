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

import { getCurrentDate } from "../notes/utils";
import type { Issue } from "../types";
import { IssueNoteInputs } from "./IssueNoteInputs";

export const IssueNoteCreate = () => {
  const record = useRecordContext<Issue>();
  const { identity } = useGetIdentity();

  if (!record || !identity) return null;

  return (
    <CreateBase resource="issue_notes" redirect={false}>
      <Form>
        <div className="space-y-3">
          <IssueNoteInputs />
          <IssueNoteCreateButton record={record} />
        </div>
      </Form>
    </CreateBase>
  );
};

const IssueNoteCreateButton = ({ record }: { record: Issue }) => {
  const notify = useNotify();
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const { reset } = useFormContext();
  const { refetch } = useListContext();

  if (!record || !identity) return null;

  const handleSuccess = () => {
    reset(
      { date: getCurrentDate(), text: null, attachments: null },
      { keepValues: false },
    );
    refetch();
    notify("resources.issue_notes.added", {
      messageArgs: { _: "Comment added" },
    });
  };

  return (
    <div className="flex justify-end">
      <SaveButton
        type="button"
        label={translate("resources.issue_notes.action.add_this")}
        transform={(data) => ({
          ...data,
          issue_id: record.id,
          sales_id: identity.id,
          date: new Date(data.date || getCurrentDate()).toISOString(),
        })}
        mutationOptions={{ onSuccess: handleSuccess }}
      />
    </div>
  );
};
