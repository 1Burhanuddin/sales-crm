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

// Digits-only, with a leading "91" (India) assumed when the stored number
// doesn't already carry a country code -- matches how every lead in this
// app's data has been imported so far (Rajkot leads sheet, WhatsApp-vCard
// imports), all plain Indian mobile numbers. A trunk-prefix "0" some
// numbers get typed/imported with (e.g. "09876543210") isn't part of the
// real number -- stripped first, or an 11-digit number would skip the "91"
// prefix entirely and produce a dead wa.me link. leads.phone is a plain
// free-text field with nothing upstream validating it, so this is a
// heuristic, not a guarantee, for whatever wasn't imported in one of the
// two shapes above.
const toWaNumber = (phone: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === 10 ? `91${digits}` : digits;
};

// One state machine with three phases, not three independently-settable
// flags -- "logging" and "an outcome prompt is showing" can never be true
// at once (logAttempt's success case sets "pending" in the same update it
// would have cleared a separate "logging" flag), so a discriminated union
// makes that invariant true by construction instead of by every call site
// remembering to derive it correctly.
type Status =
  | { kind: "idle" }
  | { kind: "logging" }
  | { kind: "pending"; activity: LeadActivity }
  | { kind: "settingOutcome"; activity: LeadActivity };

// Click-to-contact buttons that double as the attempt log: opening the
// dialer/WhatsApp/mail app IS the log entry, so a rep never has to remember
// to write anything down just to have a record that they tried. The outcome
// prompt that follows is optional polish on top of an attempt that's
// already recorded either way.
//
// Call/Email await the log call BEFORE navigating (a few hundred ms of
// latency, traded for reliability) -- handing off to the dialer/mail app on
// mobile can background or suspend this tab immediately, and a
// fire-and-forget create call started after that handoff isn't guaranteed
// to ever complete. WhatsApp is the one exception: window.open() has to run
// synchronously inside the click handler or strict mobile browsers (Safari/
// iOS especially) treat it as an unsolicited popup and block it silently
// once an awaited network call has consumed the click's "direct user
// gesture" window -- and unlike tel:/mailto:, opening a new tab doesn't
// hand off to a different native app, so this tab isn't at risk of being
// suspended before its own pending request finishes. The tradeoff: if that
// background create() fails, the error toast fires in a CRM tab the rep has
// likely already switched away from. There's no way to have it both ways
// (an awaited pre-navigation check would break the popup instead) -- the
// tab stays alive and the toast is still there whenever they come back,
// which is the best available compromise.
//
// Raw dataProvider calls (not useCreate/useUpdate) don't auto-invalidate
// any list's react-query cache, so both logAttempt and setOutcome refresh()
// explicitly afterward -- same gotcha, same fix, as PersonalNoteCard's
// togglePin/toggleChecklistItem. Both also notify() on failure -- silently
// swallowing an error here would mean a rep believes an attempt was logged
// when it wasn't, worse than not logging at all.
export const LeadContactActions = ({ record }: { record: Lead }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // React state updates aren't visible synchronously within the same tick,
  // so two clicks fired before the first re-render commits (a real risk on
  // a laggy mobile browser) could both read a stale status and slip past a
  // state-only guard. A ref is checked/set synchronously, so the second
  // call sees it immediately, before either promise has even started.
  //
  // This only covers one tab: two tabs open on the same lead (easy to hit
  // on mobile, e.g. a link opened from a notification while the lead is
  // already open elsewhere) can each log their own attempt independently,
  // and both are real inserts, not a race either side can detect. Left as
  // an accepted, low-stakes gap rather than a DB-level constraint --
  // leads_summary counts whatever rows genuinely exist, so a rare duplicate
  // is an occasional off-by-one in a count, not drift or corruption, and a
  // time-windowed uniqueness rule would be real complexity for a cosmetic
  // edge case.
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
        // Back to "pending", not "idle" -- the create already succeeded,
        // only the outcome PATCH failed, so the prompt should stay up and
        // let the rep retry rather than silently discarding it as if they'd
        // hit Skip.
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
