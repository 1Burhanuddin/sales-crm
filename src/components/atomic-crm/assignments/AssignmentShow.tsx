import { isValid } from "date-fns";
import {
  InfiniteListBase,
  ShowBase,
  useRecordContext,
  useRedirect,
  useShowContext,
  useTranslate,
} from "ra-core";
import { Link } from "react-router";
import { Pencil } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { formatISODateString } from "../deals/dealUtils";
import type { Assignment } from "../types";
import { AssignmentNotesIterator } from "./AssignmentNotesIterator";

export const AssignmentShow = () => (
  <ShowBase>
    <AssignmentShowContent />
  </ShowBase>
);

const AssignmentShowContent = () => {
  const translate = useTranslate();
  const redirect = useRedirect();
  const { isPending } = useShowContext<Assignment>();
  const record = useRecordContext<Assignment>();
  if (isPending || !record) return null;

  const statusLabel = translate(
    `resources.assignments.status.${record.status}`,
  );
  const priorityLabel = record.priority
    ? translate(`resources.assignments.priority.${record.priority}`)
    : null;

  return (
    <div className="mt-2 flex lg:mr-72">
      <div className="flex-1">
        <Card>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold">{record.title}</h2>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="h-9">
                  <Link to={`/assignments/${record.id}`}>
                    <Pencil className="w-4 h-4" />
                    {translate("ra.action.edit")}
                  </Link>
                </Button>
                <DeleteButton
                  redirect={false}
                  // Same fix as IssueShow.tsx -- the redirect must wait
                  // for the real delete, not fire before it's sent.
                  mutationMode="pessimistic"
                  mutationOptions={{
                    onSuccess: () => redirect("/assignments"),
                  }}
                />
              </div>
            </div>

            <div className="flex gap-8 flex-wrap">
              <div className="flex flex-col mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
                  {translate("resources.assignments.fields.status")}
                </span>
                <span className="text-sm">{statusLabel}</span>
              </div>

              {priorityLabel && (
                <div className="flex flex-col mr-10">
                  <span className="text-xs text-muted-foreground tracking-wide">
                    {translate("resources.assignments.fields.priority")}
                  </span>
                  <span className="text-sm">{priorityLabel}</span>
                </div>
              )}

              <div className="flex flex-col mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
                  {translate("resources.assignments.fields.assignee_id")}
                </span>
                <span className="text-sm">
                  <ReferenceField
                    source="assignee_id"
                    reference="sales"
                    link={false}
                  />
                </span>
              </div>

              {record.due_date && (
                <div className="flex flex-col mr-10">
                  <span className="text-xs text-muted-foreground tracking-wide">
                    {translate("resources.assignments.fields.due_date")}
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
              <div className="whitespace-pre-line">
                <span className="text-xs text-muted-foreground tracking-wide">
                  {translate("resources.assignments.fields.description")}
                </span>
                <p className="text-sm leading-6">{record.description}</p>
              </div>
            )}

            <Separator className="my-4" />
            <InfiniteListBase
              resource="assignment_notes"
              filter={{ assignment_id: record.id }}
              sort={{ field: "date", order: "DESC" }}
              perPage={25}
              disableSyncWithLocation
              storeKey={false}
            >
              <AssignmentNotesIterator />
            </InfiniteListBase>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
