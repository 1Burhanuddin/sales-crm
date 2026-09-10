import { format } from "date-fns";
import {
  useCreate,
  useGetList,
  useNotify,
  useTranslate,
  useUpdate,
  type Identifier,
} from "ra-core";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { DailyReview } from "../types";
import { toDateKey } from "./weekUtils";

const emptyForm = {
  completed: "",
  blocked: "",
  changed: "",
  avoid_tomorrow: "",
  top3_tomorrow: ["", "", ""],
  if_time_allows: "",
};

/** Personal nightly journal: what happened today, what to avoid and
 * plan for tomorrow. One row per day, with a short history below so it
 * doubles as a log of past days rather than just tonight's form.
 * Filtered by sales_id explicitly, not just relying on RLS -- an
 * admin's select/update policy isn't scoped to their own rows, so
 * without this an admin could overwrite or read another user's
 * private journal entries. */
export const DailyReviewSection = ({ salesId }: { salesId: Identifier }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [form, setForm] = useState(emptyForm);
  const [update] = useUpdate<DailyReview>();
  const [create] = useCreate<DailyReview>();
  const [saving, setSaving] = useState(false);
  // Synchronous guard, not just `saving` state -- see CategoryBudgetRow
  // (AccountsDashboard.tsx) for why a state update alone can't close a
  // fast double-save race against this get-or-create pattern.
  const savingRef = useRef(false);

  const { data: matches, refetch } = useGetList<DailyReview>("daily_reviews", {
    pagination: { page: 1, perPage: 1 },
    filter: { sales_id: salesId, date },
  });
  const existing = matches?.[0];

  const { data: history } = useGetList<DailyReview>("daily_reviews", {
    pagination: { page: 1, perPage: 6 },
    sort: { field: "date", order: "DESC" },
    filter: { sales_id: salesId, "date@lt": toDateKey(new Date()) },
  });

  useEffect(() => {
    if (existing) {
      const top3 = existing.top3_tomorrow ?? [];
      setForm({
        completed: existing.completed ?? "",
        blocked: existing.blocked ?? "",
        changed: existing.changed ?? "",
        avoid_tomorrow: existing.avoid_tomorrow ?? "",
        top3_tomorrow: [top3[0] ?? "", top3[1] ?? "", top3[2] ?? ""],
        if_time_allows: (existing.if_time_allows ?? []).join("\n"),
      });
    } else {
      setForm(emptyForm);
    }
    // Only reset when the loaded record for this date changes, not on
    // every keystroke -- existing.id is a stable enough proxy for "a
    // different record just loaded".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id, date]);

  const handleSave = () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const data = {
      date,
      completed: form.completed || null,
      blocked: form.blocked || null,
      changed: form.changed || null,
      avoid_tomorrow: form.avoid_tomorrow || null,
      top3_tomorrow: form.top3_tomorrow.filter((t) => t.trim() !== ""),
      if_time_allows: form.if_time_allows
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const save = existing
      ? update("daily_reviews", { id: existing.id, data, previousData: existing })
      : create("daily_reviews", { data });
    save
      .then(() => {
        notify("crm.weekly_planner.review.saved", { _: "Review saved" });
        refetch();
      })
      .catch(() => notify("ra.notification.http_error", { type: "error" }))
      .finally(() => {
        savingRef.current = false;
        setSaving(false);
      });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">
          {translate("crm.weekly_planner.review.title", {
            _: "Nightly review",
          })}
        </CardTitle>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-40 h-8"
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReviewField
            label={translate("crm.weekly_planner.review.completed", {
              _: "What did I actually finish?",
            })}
            value={form.completed}
            onChange={(v) => setForm((f) => ({ ...f, completed: v }))}
          />
          <ReviewField
            label={translate("crm.weekly_planner.review.blocked", {
              _: "What got blocked?",
            })}
            value={form.blocked}
            onChange={(v) => setForm((f) => ({ ...f, blocked: v }))}
          />
          <ReviewField
            label={translate("crm.weekly_planner.review.changed", {
              _: "What changed?",
            })}
            value={form.changed}
            onChange={(v) => setForm((f) => ({ ...f, changed: v }))}
          />
          <ReviewField
            label={translate("crm.weekly_planner.review.avoid_tomorrow", {
              _: "One thing I should NOT do tomorrow",
            })}
            value={form.avoid_tomorrow}
            onChange={(v) => setForm((f) => ({ ...f, avoid_tomorrow: v }))}
          />
        </div>

        <div>
          <Label className="text-sm mb-2 block">
            {translate("crm.weekly_planner.review.top3_tomorrow", {
              _: "Tomorrow's top 3",
            })}
          </Label>
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Input
                key={i}
                value={form.top3_tomorrow[i]}
                onChange={(e) =>
                  setForm((f) => {
                    const top3 = [...f.top3_tomorrow];
                    top3[i] = e.target.value;
                    return { ...f, top3_tomorrow: top3 };
                  })
                }
                placeholder={translate(
                  "crm.weekly_planner.review.top3_placeholder",
                  { _: "Major outcome", index: i + 1 },
                )}
              />
            ))}
          </div>
        </div>

        <ReviewField
          label={translate("crm.weekly_planner.review.if_time_allows", {
            _: "If time allows (one per line)",
          })}
          value={form.if_time_allows}
          onChange={(v) => setForm((f) => ({ ...f, if_time_allows: v }))}
          rows={2}
        />

        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={saving}>
            {translate("ra.action.save")}
          </Button>
        </div>

        {history && history.length > 0 && (
          <div className="pt-2 border-t flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {translate("crm.weekly_planner.review.history", {
                _: "Recent history",
              })}
            </p>
            {history.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setDate(entry.date)}
                className="text-left text-sm rounded-md border px-3 py-2 hover:bg-accent"
              >
                <span className="font-medium">
                  {format(new Date(entry.date), "EEE, MMM d")}
                </span>
                {entry.completed && (
                  <span className="text-muted-foreground">
                    {" — "}
                    {entry.completed.slice(0, 80)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ReviewField = ({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) => (
  <div>
    <Label className="text-sm mb-1.5 block">{label}</Label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
    />
  </div>
);

