import {
  ShowBase,
  useDataProvider,
  useGetIdentity,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useShowContext,
  useTranslate,
} from "ra-core";
import { CheckCircle2, Pencil, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Lead } from "../types";
import { qualifyLead } from "./qualifyLead";

const STATUS_VARIANT: Record<string, "outline" | "default" | "destructive"> = {
  new: "outline",
  contacted: "outline",
  qualified: "default",
  disqualified: "destructive",
};

export const LeadShow = () => (
  <ShowBase>
    <LeadShowContent />
  </ShowBase>
);

const LeadShowContent = () => {
  const translate = useTranslate();
  const { isPending } = useShowContext<Lead>();
  const record = useRecordContext<Lead>();
  if (isPending || !record) return null;

  return (
    <div className="mt-2 flex flex-col gap-4 pb-2">
      <Card>
        <CardContent>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold">
                {record.first_name} {record.last_name}
                {record.company_name && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {record.company_name}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={STATUS_VARIANT[record.status] ?? "outline"}>
                  {translate(`resources.leads.status.${record.status}`, {
                    _: record.status,
                  })}
                </Badge>
                {record.title && (
                  <span className="text-sm text-muted-foreground">
                    {record.title}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="h-9">
                <Link to={`/leads/${record.id}`}>
                  <Pencil className="w-4 h-4" />
                  {translate("ra.action.edit")}
                </Link>
              </Button>
              <DeleteButton redirect="list" />
            </div>
          </div>

          <div className="flex flex-wrap gap-8 mt-4">
            {record.email && (
              <Field label={translate("resources.leads.fields.email")} value={record.email} />
            )}
            {record.phone && (
              <Field label={translate("resources.leads.fields.phone")} value={record.phone} />
            )}
            {record.source && (
              <Field label={translate("resources.leads.fields.source")} value={record.source} />
            )}
          </div>

          {record.notes && (
            <p className="text-sm whitespace-pre-line mt-4">{record.notes}</p>
          )}

          {record.status === "qualified" && (
            <div className="flex flex-col gap-1 mt-4 text-sm">
              <p className="text-muted-foreground">
                {translate("resources.leads.converted_to", {
                  _: "Converted to:",
                })}
              </p>
              <div className="flex gap-3">
                {record.converted_contact_id && (
                  <Link
                    to={`/contacts/${record.converted_contact_id}/show`}
                    className="text-primary hover:underline"
                  >
                    {translate("resources.contacts.name", { smart_count: 1 })}
                  </Link>
                )}
                {record.converted_company_id && (
                  <Link
                    to={`/companies/${record.converted_company_id}/show`}
                    className="text-primary hover:underline"
                  >
                    {translate("resources.companies.name", { smart_count: 1 })}
                  </Link>
                )}
                {record.converted_deal_id && (
                  <Link
                    to={`/deals/${record.converted_deal_id}/show`}
                    className="text-primary hover:underline"
                  >
                    {translate("resources.deals.name", { smart_count: 1 })}
                  </Link>
                )}
              </div>
            </div>
          )}

          {record.status === "disqualified" && record.disqualify_reason && (
            <p className="text-sm text-destructive mt-4">
              {translate("resources.leads.fields.disqualify_reason")}:{" "}
              {record.disqualify_reason}
            </p>
          )}

          {(record.status === "new" || record.status === "contacted") && (
            <FunnelActions record={record} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-xs text-muted-foreground tracking-wide">{label}</span>
    <span className="text-sm">{value}</span>
  </div>
);

const FunnelActions = ({ record }: { record: Lead }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();
  const { identity } = useGetIdentity();
  const { dealStages } = useConfigurationContext();
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [qualifying, setQualifying] = useState(false);

  const markContacted = () => {
    dataProvider
      .update("leads", {
        id: record.id,
        data: { status: "contacted" },
        previousData: record,
      })
      .then(() => refresh())
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  const handleQualify = async () => {
    setQualifying(true);
    try {
      const { contactId } = await qualifyLead(record, dataProvider, {
        salesId: identity?.id,
        firstDealStage: dealStages[0]?.value ?? "opportunity",
      });
      notify("resources.leads.qualified", {
        _: "Lead qualified and converted.",
      });
      redirect("show", "contacts", contactId);
    } catch {
      notify("ra.notification.http_error", { type: "error" });
    } finally {
      setQualifying(false);
    }
  };

  const handleDisqualify = () => {
    dataProvider
      .update("leads", {
        id: record.id,
        data: { status: "disqualified", disqualify_reason: reason || null },
        previousData: record,
      })
      .then(() => {
        setDisqualifyOpen(false);
        refresh();
      })
      .catch(() => notify("ra.notification.http_error", { type: "error" }));
  };

  return (
    <div className="flex gap-2 mt-4">
      {record.status === "new" && (
        <Button size="sm" variant="outline" onClick={markContacted}>
          {translate("resources.leads.action.mark_contacted", {
            _: "Mark Contacted",
          })}
        </Button>
      )}
      <Button size="sm" onClick={handleQualify} disabled={qualifying}>
        <CheckCircle2 className="w-4 h-4" />
        {translate("resources.leads.action.qualify", { _: "Qualify" })}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setDisqualifyOpen(true)}
      >
        <XCircle className="w-4 h-4" />
        {translate("resources.leads.action.disqualify", { _: "Disqualify" })}
      </Button>

      <Dialog open={disqualifyOpen} onOpenChange={setDisqualifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {translate("resources.leads.action.disqualify", {
                _: "Disqualify",
              })}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={translate("resources.leads.fields.disqualify_reason")}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisqualifyOpen(false)}>
              {translate("ra.action.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDisqualify}>
              {translate("resources.leads.action.disqualify", {
                _: "Disqualify",
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
