import { Mail, MessageCircle, Phone } from "lucide-react";
import { useDataProvider, useNotify, useRefresh, useTranslate } from "ra-core";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import type { Lead, LeadActivity, LeadActivityChannel, LeadActivityOutcome } from "../types";

const OUTCOMES: LeadActivityOutcome[] = [
  "responded",
  "no_answer",
  "callback_later",
  "wrong_number",
  "not_interested",
];

// Assumes a plain 10-digit Indian mobile number, prepending "91"; strips a
// leading trunk "0" first so it isn't mistaken for a country code.
const toWaNumber = (phone: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === 10 ? `91${digits}` : digits;
};

type Status =
  | { kind: "idle" }
  | { kind: "logging" }
  | { kind: "pending"; activity: LeadActivity }
  | { kind: "settingOutcome"; activity: LeadActivity };

// Opening the dialer/WhatsApp/mail app IS the log entry -- Call/Email await
// the log call before navigating (mobile can suspend this tab on handoff);
// WhatsApp opens synchronously first to avoid the popup blocker, then logs.
export const LeadContactActions = ({ record }: { record: Lead }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Synchronous mutex -- state updates aren't visible within the same
  // tick, so a ref is needed to block a same-tick double-click.
  const loggingRef = useRef(false);

  if (!record.phone && !record.email) return null;

  const busy = status.kind !== "idle";

  const logAttempt = async (channel: LeadActivityChannel) => {
    if (loggingRef.current) return false;
    loggingRef.current = true;
    setStatus({ kind: "logging" });
    try {
      const { data } = await dataProvider.create<LeadActivity>(
        "lead_activities",
        { data: { lead_id: record.id, channel } },
      );
      setStatus({ kind: "pending", activity: data });
      refresh();
      return true;
    } catch {
      notify("ra.notification.http_error", { type: "error" });
      setStatus({ kind: "idle" });
      return false;
    } finally {
      loggingRef.current = false;
    }
  };

  const setOutcome = (outcome: LeadActivityOutcome) => {
    if (status.kind !== "pending") return;
    const { activity } = status;
    setStatus({ kind: "settingOutcome", activity });
    dataProvider
      .update("lead_activities", {
        id: activity.id,
        data: { outcome },
        previousData: activity,
      })
      .then(() => {
        refresh();
        setStatus({ kind: "idle" });
      })
      .catch(() => {
        // Back to "pending", not "idle" -- let the rep retry.
        notify("ra.notification.http_error", { type: "error" });
        setStatus({ kind: "pending", activity });
      });
  };

  const handleCall = async () => {
    if (!record.phone || busy) return;
    if (await logAttempt("call")) window.location.href = `tel:${record.phone}`;
  };

  const handleWhatsapp = () => {
    if (!record.phone || busy) return;
    window.open(
      `https://wa.me/${toWaNumber(record.phone)}`,
      "_blank",
      "noopener",
    );
    logAttempt("whatsapp");
  };

  const handleEmail = async () => {
    if (!record.email || busy) return;
    if (await logAttempt("email")) window.location.href = `mailto:${record.email}`;
  };

  const settingOutcome = status.kind === "settingOutcome";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {record.phone && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCall}
            disabled={busy}
          >
            <Phone className="w-4 h-4" />
            {translate("resources.leads.action.call", { _: "Call" })}
          </Button>
        )}
        {record.phone && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleWhatsapp}
            disabled={busy}
          >
            <MessageCircle className="w-4 h-4" />
            {translate("resources.leads.action.whatsapp", {
              _: "WhatsApp",
            })}
          </Button>
        )}
        {record.email && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleEmail}
            disabled={busy}
          >
            <Mail className="w-4 h-4" />
            {translate("resources.leads.action.email", { _: "Email" })}
          </Button>
        )}
      </div>
      {(status.kind === "pending" || settingOutcome) && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">
            {translate("resources.leads.activity.how_did_it_go", {
              _: "How did it go?",
            })}
          </span>
          {OUTCOMES.map((outcome) => (
            <Button
              key={outcome}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              disabled={settingOutcome}
              onClick={() => setOutcome(outcome)}
            >
              {translate(`resources.leads.activity.outcome.${outcome}`)}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground"
            disabled={settingOutcome}
            onClick={() => setStatus({ kind: "idle" })}
          >
            {translate("resources.leads.activity.skip", { _: "Skip" })}
          </Button>
        </div>
      )}
    </div>
  );
};
