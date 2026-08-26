import { isValid } from "date-fns";
import {
  InfiniteListBase,
  ShowBase,
  useRecordContext,
  useRedirect,
  useTranslate,
  type Identifier,
} from "ra-core";
import { Link } from "react-router";
import { Pencil } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Issue } from "../types";
import { formatISODateString } from "../deals/dealUtils";
import { findIssueStatusLabel } from "./issueUtils";
import { IssueNotesIterator } from "./IssueNotesIterator";

export const IssueShow = ({
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
    redirect(`/projects/${projectId}/show`);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="lg:max-w-2xl p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        {id ? (
          <ShowBase id={id} resource="issues">
            <IssueShowContent projectId={projectId} />
          </ShowBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const IssueShowContent = ({ projectId }: { projectId: Identifier }) => {
  const translate = useTranslate();
  const redirect = useRedirect();
  const { issueStatuses, issuePriorities } = useConfigurationContext();
  const record = useRecordContext<Issue>();
  if (!record) return null;

  return (
    <div className="space-y-2">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-2xl font-semibold">{record.title}</h2>
          <div className="flex gap-2 pr-12">
            <Button asChild variant="outline" size="sm" className="h-9">
              <Link to={`/projects/${projectId}/issues/${record.id}`}>
                <Pencil className="w-4 h-4" />
                {translate("ra.action.edit")}
              </Link>
            </Button>
            <DeleteButton
              redirect={false}
              mutationOptions={{
                onSuccess: () => redirect(`/projects/${projectId}/show`),
              }}
            />
          </div>
        </div>

        <div className="flex gap-8 m-4 flex-wrap">
          <div className="flex flex-col mr-10">
            <span className="text-xs text-muted-foreground tracking-wide">
              {translate("resources.issues.fields.status")}
            </span>
            <span className="text-sm">
              {findIssueStatusLabel(issueStatuses, record.status)}
            </span>
          </div>

          {record.priority && (
            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate("resources.issues.fields.priority")}
              </span>
              <span className="text-sm">
                {issuePriorities.find((p) => p.value === record.priority)
                  ?.label ?? record.priority}
              </span>
            </div>
          )}

          {record.assignee_id && (
            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate("resources.issues.fields.assignee_id")}
              </span>
              <span className="text-sm">
                <ReferenceField
                  source="assignee_id"
                  reference="sales"
                  link={false}
                />
              </span>
            </div>
          )}

          {record.due_date && (
            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate("resources.issues.fields.due_date")}
              </span>
              <span className="text-sm">
                {isValid(new Date(record.due_date))
                  ? formatISODateString(record.due_date)
                  : record.due_date}
              </span>
            </div>
          )}
        </div>

        {record.description && (
          <div className="m-4 whitespace-pre-line">
            <span className="text-xs text-muted-foreground tracking-wide">
              {translate("resources.issues.fields.description")}
            </span>
            <p className="text-sm leading-6">{record.description}</p>
          </div>
        )}

        <div className="m-4">
          <Separator className="mb-4" />
          <InfiniteListBase
            resource="issue_notes"
            filter={{ issue_id: record.id }}
            sort={{ field: "date", order: "DESC" }}
            perPage={25}
            disableSyncWithLocation
            storeKey={false}
          >
            <IssueNotesIterator />
          </InfiniteListBase>
        </div>
      </div>
    </div>
  );
};
