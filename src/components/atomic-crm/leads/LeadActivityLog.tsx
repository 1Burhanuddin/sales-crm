import { Mail, MessageCircle, Phone } from "lucide-react";
import { useGetIdentity, useGetList, useTranslate } from "ra-core";
import { Badge } from "@/components/ui/badge";

import { RelativeDate } from "../misc/RelativeDate";
import { useGetSalesName } from "../sales/useGetSalesName";
import type { Identifier } from "ra-core";
import type { LeadActivity, LeadActivityChannel } from "../types";

const CHANNEL_ICON: Record<LeadActivityChannel, typeof Phone> = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
};

const OUTCOME_VARIANT: Record<string, "default" | "destructive" | "outline"> =
  {
    responded: "default",
    not_interested: "destructive",
    wrong_number: "destructive",
  };

export const LeadActivityLog = ({ leadId }: { leadId: string | number }) => {
  const translate = useTranslate();
  // A lead is normally worked for weeks, not months -- a few dozen attempts
  // at most before it's qualified or disqualified. 200 is a generous
  // ceiling for that, not a real page size; no load-more control since
  // hitting it at all would itself be a sign something's off with how a
  // lead is being handled, not routine usage.
  const { data, isPending } = useGetList<LeadActivity>("lead_activities", {
    filter: { lead_id: leadId },
    sort: { field: "created_at", order: "DESC" },
    pagination: { page: 1, perPage: 200 },
  });

  if (isPending) return null;

  return (
    <div className="flex flex-col gap-2 mt-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        {translate("resources.leads.activity.title", {
          _: "Contact attempts",
        })}
      </h3>
      {!data?.length ? (
        <p className="text-sm text-muted-foreground">
          {translate("resources.leads.activity.empty", {
            _: "No contact attempts logged yet.",
          })}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </ul>
      )}
    </div>
  );
};

const ActivityRow = ({ activity }: { activity: LeadActivity }) => {
  const translate = useTranslate();
  const Icon = CHANNEL_ICON[activity.channel];
  const channelLabel = translate(
    `resources.leads.activity.channel.${activity.channel}`,
  );

  return (
    <li className="flex items-center gap-2 text-sm">
      {/* Icon-only, so the channel still needs a real label for screen
          readers -- not just decoration. */}
      <Icon
        aria-label={channelLabel}
        className="w-4 h-4 text-muted-foreground shrink-0"
      />
      <span className="text-muted-foreground">
        <RelativeDate date={activity.created_at} />
      </span>
      {activity.outcome && (
        <Badge
          variant={OUTCOME_VARIANT[activity.outcome] ?? "outline"}
          className="text-[10px]"
        >
          {translate(`resources.leads.activity.outcome.${activity.outcome}`)}
        </Badge>
      )}
      {activity.sales_id && <RepAttribution salesId={activity.sales_id} />}
    </li>
  );
};

// Same attribution pattern as ActivityLogContactNoteCreated etc.: "You" for
// the current user (no extra fetch needed), the rep's real name otherwise
// via useGetSalesName -- rather than a bare ReferenceField, which neither
// personalizes to the viewer nor shares that hook's loading/error fallback.
const RepAttribution = ({ salesId }: { salesId: Identifier }) => {
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const isCurrentUser = salesId === identity?.id;
  const salesName = useGetSalesName(salesId, { enabled: !isCurrentUser });

  return (
    <span className="text-muted-foreground">
      ·{" "}
      {isCurrentUser
        ? translate("resources.leads.activity.you", { _: "You" })
        : salesName}
    </span>
  );
};
