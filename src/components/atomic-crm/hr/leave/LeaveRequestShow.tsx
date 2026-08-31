import {
  CanAccess,
  ShowBase,
  useDataProvider,
  useGetIdentity,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useTranslate,
} from "ra-core";
import { Check, X } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";
import { EditButton } from "@/components/admin/edit-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { useConfigurationContext } from "../../root/ConfigurationContext";
import type { LeaveRequest } from "../../types";
import { findLeaveRequestStatusLabel } from "./leaveRequestUtils";

export const LeaveRequestShow = ({
  open,
  id,
}: {
  open: boolean;
  id?: string;
}) => {
  const redirect = useRedirect();
  const handleClose = () => redirect("list", "leave_requests");

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="lg:max-w-2xl p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        {id ? (
          <ShowBase id={id} resource="leave_requests">
            <LeaveRequestShowContent />
          </ShowBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const LeaveRequestShowContent = () => {
  const translate = useTranslate();
  const { leaveTypes } = useConfigurationContext();
  const record = useRecordContext<LeaveRequest>();
  if (!record) return null;

  const typeLabel =
    leaveTypes.find((t) => t.value === record.leave_type)?.label ??
    record.leave_type;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">
            <ReferenceField
              source="employee_id"
              reference="employees"
              link={false}
            />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {typeLabel} · {record.days ?? "?"} day
            {record.days === 1 ? "" : "s"} · {record.from_date} →{" "}
            {record.to_date}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {findLeaveRequestStatusLabel(record.status)}
          </Badge>
          {record.status === "pending" && (
            <EditButton />
          )}
          <DeleteButton redirect="list" />
        </div>
      </div>

      {record.reason && (
        <p className="text-sm whitespace-pre-line">{record.reason}</p>
      )}

      {record.status === "pending" && (
        <>
          <CanAccess resource="leave_requests" action="approve">
            <DecisionButtons record={record} />
          </CanAccess>
          <SelfCancelButton record={record} />
        </>
      )}
    </div>
  );
};

const DecisionButtons = ({ record }: { record: LeaveRequest }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const { identity } = useGetIdentity();

  const decide = (status: "approved" | "rejected") => {
    dataProvider
      .update("leave_requests", {
        id: record.id,
        data: {
          status,
          approved_by: identity?.id,
          approved_at: new Date().toISOString(),
        },
        previousData: record,
      })
      .then(() => {
        notify("resources.leave_requests.decided", {});
        refresh();
      })
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => decide("approved")}>
        <Check className="w-4 h-4" />
        {translate("resources.leave_requests.action.approve", {
          _: "Approve",
        })}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => decide("rejected")}
      >
        <X className="w-4 h-4" />
        {translate("resources.leave_requests.action.reject", {
          _: "Reject",
        })}
      </Button>
    </div>
  );
};

const SelfCancelButton = ({ record }: { record: LeaveRequest }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const { identity } = useGetIdentity();
  const isAdmin = Boolean((identity as any)?.administrator);
  if (isAdmin) return null;

  const cancel = () => {
    dataProvider
      .update("leave_requests", {
        id: record.id,
        data: { status: "cancelled" },
        previousData: record,
      })
      .then(() => {
        notify("resources.leave_requests.cancelled", {});
        refresh();
      })
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  return (
    <Button size="sm" variant="outline" onClick={cancel}>
      {translate("resources.leave_requests.action.cancel", {
        _: "Cancel request",
      })}
    </Button>
  );
};
