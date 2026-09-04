import { ChevronDown, ChevronRight, HandCoins } from "lucide-react";
import {
  useDataProvider,
  useGetMany,
  useGetList,
  useNotify,
  useRefresh,
  useTranslate,
} from "ra-core";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Loan, Person } from "../types";
import { currencyFormat, STATUS } from "./format";
import { LoanEntryDialog } from "./LoanEntryDialog";
import { SCOPE_CHOICES } from "./scope";

type PersonGroup = {
  person: Person;
  loans: Loan[];
  // Positive = they owe me (net of unsettled "given" minus unsettled
  // "received"). Negative = I owe them.
  net: number;
};

export const KhatabookDashboard = () => {
  const translate = useTranslate();
  const { currency } = useConfigurationContext();

  const { data: loans, isPending: loansPending } = useGetList<Loan>("loans", {
    pagination: { page: 1, perPage: 2000 },
    sort: { field: "created_at", order: "DESC" },
  });

  const personIds = useMemo(
    () => [...new Set((loans ?? []).map((l) => l.person_id))],
    [loans],
  );
  // No `enabled` gate needed for the empty-ids case -- ra-core's
  // useGetMany already short-circuits to data: [] without a network call
  // when `ids` is empty, so gating it here would only add a second,
  // easy-to-drift-from condition that isPending below would have to keep
  // mirroring by hand.
  const { data: people, isPending: peoplePending } = useGetMany<Person>(
    "people",
    { ids: personIds },
  );

  const groups: PersonGroup[] = useMemo(() => {
    if (!loans || !people) return [];
    const peopleById = new Map(people.map((p) => [p.id, p]));
    const byPerson = new Map<Person["id"], Loan[]>();
    for (const loan of loans) {
      const bucket = byPerson.get(loan.person_id) ?? [];
      bucket.push(loan);
      byPerson.set(loan.person_id, bucket);
    }
    return [...byPerson.entries()]
      .map(([personId, personLoans]) => {
        const person = peopleById.get(personId);
        if (!person) return null;
        const net = personLoans.reduce((sum, l) => {
          if (l.settled) return sum;
          return sum + (l.direction === "given" ? l.amount : -l.amount);
        }, 0);
        return { person, loans: personLoans, net };
      })
      .filter((g): g is PersonGroup => g != null)
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [loans, people]);

  const isPending = loansPending || peoplePending;
  const totalOwedToMe = groups.reduce((sum, g) => sum + Math.max(g.net, 0), 0);
  const totalIOwe = groups.reduce((sum, g) => sum + Math.max(-g.net, 0), 0);

  return (
    <div className="mt-2 flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {translate("crm.accounts.khatabook.title", { _: "Khatabook" })}
        </h1>
        <LoanEntryDialog />
      </div>

      {isPending ? (
        <>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </>
      ) : groups.length === 0 ? (
        <div className="mt-8 max-w-2xl mx-auto text-center text-muted-foreground">
          {translate("crm.accounts.khatabook.no_data", {
            _: "Nothing logged yet — add your first entry above.",
          })}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="flex flex-col gap-1 py-2">
                <span className="text-xs text-muted-foreground">
                  {translate("crm.accounts.khatabook.owed_to_me", {
                    _: "Owed to me",
                  })}
                </span>
                <span
                  className="text-xl font-semibold tabular-nums"
                  style={{ color: STATUS.good }}
                >
                  {currencyFormat(currency, totalOwedToMe)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1 py-2">
                <span className="text-xs text-muted-foreground">
                  {translate("crm.accounts.khatabook.i_owe", { _: "I owe" })}
                </span>
                <span
                  className="text-xl font-semibold tabular-nums"
                  style={{ color: STATUS.critical }}
                >
                  {currencyFormat(currency, totalIOwe)}
                </span>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-2">
            {groups.map((group) => (
              <PersonRow key={group.person.id} group={group} currency={currency} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

KhatabookDashboard.path = "/khatabook";

const PersonRow = ({
  group,
  currency,
}: {
  group: PersonGroup;
  currency: string;
}) => {
  const translate = useTranslate();
  const [expanded, setExpanded] = useState(false);
  const { person, loans, net } = group;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <HandCoins className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="flex-1 truncate font-medium">{person.name}</span>
        {person.phone && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {person.phone}
          </span>
        )}
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: net === 0 ? undefined : net > 0 ? STATUS.good : STATUS.critical }}
        >
          {net === 0
            ? translate("crm.accounts.khatabook.settled", { _: "Settled" })
            : net > 0
              ? translate("crm.accounts.khatabook.owes_you", {
                  amount: currencyFormat(currency, net),
                  _: `Owes you ${currencyFormat(currency, net)}`,
                })
              : translate("crm.accounts.khatabook.you_owe", {
                  amount: currencyFormat(currency, -net),
                  _: `You owe ${currencyFormat(currency, -net)}`,
                })}
        </span>
      </button>
      {expanded && (
        <CardContent className="pt-0 flex flex-col gap-2">
          {loans.map((loan) => (
            <LoanRow key={loan.id} loan={loan} currency={currency} />
          ))}
        </CardContent>
      )}
    </Card>
  );
};

const LoanRow = ({ loan, currency }: { loan: Loan; currency: string }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const [settling, setSettling] = useState(false);

  const handleSettle = () => {
    setSettling(true);
    dataProvider
      .update("loans", {
        id: loan.id,
        data: { settled: true, settled_at: new Date().toISOString() },
        previousData: loan,
      })
      .then(() => refresh())
      .catch(() => notify("ra.notification.http_error", { type: "error" }))
      .finally(() => setSettling(false));
  };

  const scopeLabel = SCOPE_CHOICES.find((c) => c.value === loan.scope)?.label;

  return (
    <div className="flex items-center gap-3 text-sm border-t pt-2 first:border-t-0 first:pt-0">
      <span className="text-muted-foreground whitespace-nowrap">
        {loan.created_at.slice(0, 10)}
      </span>
      <Badge variant="outline" className="text-[10px]">
        {loan.direction === "given"
          ? translate("crm.accounts.khatabook.gave", { _: "Gave" })
          : translate("crm.accounts.khatabook.received", { _: "Received" })}
      </Badge>
      <span className="tabular-nums font-medium">
        {currencyFormat(currency, loan.amount)}
      </span>
      {scopeLabel && (
        <Badge variant="secondary" className="text-[10px] text-muted-foreground">
          {scopeLabel}
        </Badge>
      )}
      {loan.notes && (
        <span className="flex-1 truncate text-muted-foreground">{loan.notes}</span>
      )}
      <span className="flex-1" />
      {loan.settled ? (
        <Badge variant="outline" className="text-[10px]">
          {translate("crm.accounts.khatabook.settled", { _: "Settled" })}
        </Badge>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          disabled={settling}
          onClick={handleSettle}
        >
          {translate("crm.accounts.khatabook.mark_settled", {
            _: "Mark Settled",
          })}
        </Button>
      )}
    </div>
  );
};
