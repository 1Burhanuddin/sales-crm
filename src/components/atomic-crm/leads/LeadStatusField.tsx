import { useRecordContext, useTranslate } from "ra-core";
import { Badge } from "@/components/ui/badge";

import type { Lead } from "../types";

const STATUS_VARIANT: Record<string, "outline" | "default" | "destructive"> = {
  new: "outline",
  contacted: "outline",
  qualified: "default",
  disqualified: "destructive",
};

export const LeadStatusField = () => {
  const translate = useTranslate();
  const record = useRecordContext<Lead>();
  if (!record) return null;
  return (
    <Badge variant={STATUS_VARIANT[record.status] ?? "outline"}>
      {translate(`resources.leads.status.${record.status}`, {
        _: record.status,
      })}
    </Badge>
  );
};
