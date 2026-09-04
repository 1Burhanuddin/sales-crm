import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import {
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Hash,
  LineChart,
  PiggyBank,
  Receipt,
  Repeat,
  Wallet,
} from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { RecurringExpense, Transaction } from "../types";
import { SCOPE_CHOICES, type TransactionScope } from "./scope";

type ScopeFilter = TransactionScope | "all";

// Validated (CVD-safe, contrast-checked) colors from the dataviz skill's
// reference palette — see references/palette.md. Diverging blue<->red for
// the income/expense trend (job: above/below a baseline), one-hue blue
// ramp for the category ranking and balance trend (job: compare
// magnitude / trend over time), fixed status colors for state (net
// savings sign, income vs expense identity).
const DIVERGING = {
  light: { income: "#2a78d6", expense: "#e34948" },
  dark: { income: "#3987e5", expense: "#e66767" },
};
const STATUS = {
  good: "#0ca30c",
  critical: "#d03b3b",
};
// Sequential blue ramp, steps 300->700 (skipping the lightest steps, which
// wash out against a dark chart surface) — rank 1 (largest category) gets
// the darkest step.
const SEQUENTIAL_STEPS = [
  "#0d366b",
  "#104281",
  "#184f95",
  "#1c5cab",
  "#256abf",
  "#2a78d6",
  "#5598e7",
  "#6da7ec",
];

const MAX_CATEGORY_ROWS = 8;
const MAX_INCOME_ROWS = 5;
const RECENT_TRANSACTIONS_COUNT = 8;

// Shared by both the monthly (overview) and weekly (MonthDetail) income-vs-
// expense bar charts -- same axes/grid/zero-line styling either way, kept
// in one place so a future tweak (tick color, marker stroke) can't drift
// between the two.
const MONEY_BAR_AXIS_PROPS = {
  axisLeft: {
    tickSize: 0,
    tickPadding: 8,
    format: (v: any) => `${Math.round(v / 1000)}k`,
    style: {
      ticks: { text: { fill: "var(--color-muted-foreground)" } },
    },
  },
  axisBottom: {
    tickSize: 0,
    tickPadding: 8,
    style: {
      ticks: { text: { fill: "var(--color-muted-foreground)" } },
    },
  },
  theme: {
    grid: { line: { stroke: "var(--color-border)" } },
  },
  markers: [
    {
      axis: "y",
      value: 0,
      lineStyle: { stroke: "var(--color-border)", strokeWidth: 1 },
    } as any,
  ],
};

/** Shared by both the monthly and weekly income-vs-expense bar charts.
 * Neither chart passed a `tooltip` prop for the weekly one originally --
 * that meant nivo's default (unstyled, not dark-mode-aware) tooltip
 * rendered instead, showing as illegible near-white-on-white text. Caught
 * from a screenshot after the first version shipped; fixed by giving the
 * weekly chart the same styled tooltip the monthly one already had, pulled
 * out into one shared component so this can't happen a third time on
 * whatever bar chart comes next. */
const MoneyBarTooltip = ({
  id,
  value,
  indexValue,
  currency,
  hint,
}: {
  id: string | number;
  value: number;
  indexValue: string | number;
  currency: string;
  hint?: React.ReactNode;
}) => {
  const translate = useTranslate();
  return (
    <div className="p-2 bg-secondary rounded shadow text-xs text-secondary-foreground">
      <strong>{indexValue}</strong> —{" "}
      {id === "income"
        ? translate("crm.accounts.dashboard.total_income", {
            _: "Total Income",
          })
        : translate("crm.accounts.dashboard.total_expense", {
            _: "Total Expense",
          })}
      : {currencyFormat(currency, Math.abs(value))}
      {hint && <div className="text-secondary-foreground/70 mt-0.5">{hint}</div>}
    </div>
  );
};

/** All / Business / Personal -- the same toggle shown on the overview and
 * on the "no transactions in this scope" empty state, so switching out of
 * an empty scope is always one click away rather than needing the browser
 * Back button. */
const ScopeToggle = ({
  value,
  onChange,
}: {
  value: ScopeFilter;
  onChange: (scope: ScopeFilter) => void;
}) => {
  const translate = useTranslate();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(v) => v && onChange(v as ScopeFilter)}
    >
      <ToggleGroupItem value="all">
        {translate("crm.accounts.dashboard.scope_all", { _: "All" })}
      </ToggleGroupItem>
      {SCOPE_CHOICES.map((c) => (
        <ToggleGroupItem key={c.value} value={c.value}>
          {c.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() =>
      setIsDark(el.classList.contains("dark")),
    );
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const currencyFormat = (currency: string, value: number, digits = 0) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: digits,
  }).format(value);

/** Ranks transactions by category (all same sign), folding everything past
 * `maxRows - 1` into an "Other" bucket. Shared by the expense and income
 * breakdowns below. */
const rankByCategory = (
  txns: Transaction[],
  sign: "expense" | "income",
  maxRows: number,
  categoryLabel: (v: string | null | undefined) => string,
  otherLabel: string,
) => {
  const totals = new Map<string, number>();
  for (const t of txns) {
    if (sign === "expense" ? t.amount >= 0 : t.amount <= 0) continue;
    const key = t.category ?? "__uncategorized";
    const magnitude = Math.abs(t.amount);
    totals.set(key, (totals.get(key) ?? 0) + magnitude);
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, maxRows - 1);
  const rest = ranked.slice(maxRows - 1);
  const restTotal = rest.reduce((sum, [, v]) => sum + v, 0);
  const rows = [
    ...top.map(([key, value]) => ({
      key,
      label: key === "__uncategorized" ? categoryLabel(null) : categoryLabel(key),
      value,
    })),
    ...(restTotal > 0
      ? [{ key: "__other", label: otherLabel, value: restTotal }]
      : []),
  ];
  const max = Math.max(1, ...rows.map((r) => r.value));
  return { rows, max };
};

export const AccountsDashboard = () => {
  const translate = useTranslate();
  const { currency, transactionCategories } = useConfigurationContext();
  const isDark = useIsDarkMode();
  const diverging = isDark ? DIVERGING.dark : DIVERGING.light;
  const lineColor = isDark ? "#5598e7" : "#2a78d6";

  const { data, isPending } = useGetList<Transaction>("transactions", {
    pagination: { page: 1, perPage: 2000 },
    sort: { field: "date", order: "ASC" },
  });
  const { data: recurringExpenses = [] } = useGetList<RecurringExpense>(
    "recurring_expenses",
    {
      filter: { active: true },
      pagination: { page: 1, perPage: 200 },
      sort: { field: "due_day", order: "ASC" },
    },
  );

  // Backed by the URL (?month=yyyy-MM-dd, the 1st of the month, matching
  // stats.months' `month` key; ?scope=business|personal, absent = "all"),
  // not local state -- so the browser Back button leaves the drill-down
  // instead of leaving /accounts entirely, and a specific month/scope is
  // bookmarkable/shareable.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMonth = searchParams.get("month");
  const scopeFilter = (searchParams.get("scope") as ScopeFilter | null) ?? "all";

  const setScopeFilter = (scope: ScopeFilter) => {
    const next = new URLSearchParams(searchParams);
    if (scope === "all") next.delete("scope");
    else next.set("scope", scope);
    // Changing scope while looking at a specific month's detail should
    // keep that month selected, just re-filtered -- only clear `month`
    // when there wasn't one to begin with.
    setSearchParams(next);
  };

  // Everything below (stats, charts, MonthDetail) reads scopedData, never
  // the raw `data` -- one filter point instead of every consumer having to
  // remember to apply it.
  const scopedData: Transaction[] = useMemo(
    () =>
      scopeFilter === "all"
        ? (data ?? [])
        : (data ?? []).filter((t) => t.scope === scopeFilter),
    [data, scopeFilter],
  );

  const categoryLabel = useMemo(() => {
    const map = new Map(transactionCategories.map((c) => [c.value, c.label]));
    return (value: string | null | undefined) =>
      value
        ? (map.get(value) ?? value)
        : translate("crm.accounts.dashboard.uncategorized", {
            _: "Uncategorized",
          });
  }, [transactionCategories, translate]);

  const otherLabel = translate("crm.accounts.dashboard.other_category", {
    _: "Other",
  });

  const stats = useMemo(() => {
    const txns = scopedData ?? [];
    const totalIncome = txns
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = txns
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const uncategorized = txns.filter((t) => !t.category);

    const monthMap = new Map<string, { income: number; expense: number }>();
    for (const t of txns) {
      const month = format(startOfMonth(parseISO(t.date)), "yyyy-MM-dd");
      const entry = monthMap.get(month) ?? { income: 0, expense: 0 };
      if (t.amount > 0) entry.income += t.amount;
      else entry.expense += t.amount;
      monthMap.set(month, entry);
    }
    const months = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        label: format(parseISO(month), "MMM yyyy"),
        ...v,
      }));

    const expenseBreakdown = rankByCategory(
      txns,
      "expense",
      MAX_CATEGORY_ROWS,
      categoryLabel,
      otherLabel,
    );
    const incomeBreakdown = rankByCategory(
      txns,
      "income",
      MAX_INCOME_ROWS,
      categoryLabel,
      otherLabel,
    );

    // balance_after is the real whole-account balance (this bank account
    // holds both personal and business money), not a per-scope figure --
    // plotting it over a scope-filtered subset would show jumps actually
    // caused by hidden transactions in the *other* scope, misrepresenting
    // them as this scope's own activity. Only meaningful across "All".
    const withBalance =
      scopeFilter === "all" ? txns.filter((t) => t.balance_after != null) : [];
    const balanceSeries = withBalance.map((t, i) => ({
      x: i,
      y: t.balance_after as number,
      date: t.date,
      description: t.description,
    }));

    const recentTransactions = [...txns].reverse().slice(0, RECENT_TRANSACTIONS_COUNT);

    return {
      totalIncome,
      totalExpense,
      transactionCount: txns.length,
      avgTransaction:
        txns.length > 0
          ? txns.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txns.length
          : 0,
      uncategorizedCount: uncategorized.length,
      uncategorizedAmount: uncategorized.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0,
      ),
      months,
      expenseBreakdown,
      incomeBreakdown,
      balanceSeries,
      recentTransactions,
    };
  }, [scopedData, categoryLabel, otherLabel, scopeFilter]);

  if (isPending) {
    return (
      <div className="mt-2 flex flex-col gap-4 pb-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="mt-8 max-w-2xl mx-auto text-center text-muted-foreground">
        {translate("crm.accounts.dashboard.no_data", {
          _: "Import a statement to see your finances here.",
        })}
      </div>
    );
  }

  const scopeToggle = (
    <ScopeToggle value={scopeFilter} onChange={setScopeFilter} />
  );

  // Distinct from the "nothing ever imported" state above -- there IS
  // data, just none in the currently selected scope (e.g. every
  // transaction so far has been Business and the user just switched to
  // Personal). Different message, and a one-click way back to "All"
  // rather than looking like the feature is broken.
  if (scopedData.length === 0) {
    return (
      <div className="mt-2 flex flex-col gap-4 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {translate("crm.accounts.dashboard.title", { _: "Accounts Overview" })}
          </h1>
          {scopeToggle}
        </div>
        <div className="mt-8 max-w-2xl mx-auto text-center text-muted-foreground">
          {translate("crm.accounts.dashboard.no_data_for_scope", {
            _: "No transactions in this scope yet.",
          })}
        </div>
      </div>
    );
  }

  if (selectedMonth) {
    return (
      <MonthDetail
        // Unfiltered, not scopedData -- MonthDetail applies scopeFilter
        // itself (see below), so switching scope while a month is already
        // selected can reveal transactions the outer scope excluded,
        // rather than needing a trip back to the overview first.
        allTransactions={data ?? []}
        month={selectedMonth}
        scopeFilter={scopeFilter}
        onScopeChange={setScopeFilter}
        onBack={() => {
          const next = new URLSearchParams(searchParams);
          next.delete("month");
          setSearchParams(next);
        }}
        categoryLabel={categoryLabel}
        otherLabel={otherLabel}
        currency={currency}
        diverging={diverging}
      />
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {translate("crm.accounts.dashboard.title", {
            _: "Accounts Overview",
          })}
        </h1>
        <div className="flex items-center gap-4">
          {scopeToggle}
          <Link
            to="/transactions"
            className="text-sm text-primary hover:underline"
          >
            {translate("crm.accounts.dashboard.view_transactions", {
              _: "View all transactions",
            })}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MoneyStatTiles
          income={stats.totalIncome}
          expense={stats.totalExpense}
          currency={currency}
        />
        <StatTile
          icon={<Hash className="w-4 h-4 text-muted-foreground" />}
          label={translate("crm.accounts.dashboard.transaction_count", {
            _: "Transactions",
          })}
          value={String(stats.transactionCount)}
        />
        <StatTile
          icon={<Receipt className="w-4 h-4 text-muted-foreground" />}
          label={translate("crm.accounts.dashboard.avg_transaction", {
            _: "Avg Transaction",
          })}
          value={currencyFormat(currency, stats.avgTransaction, 0)}
        />
        <StatTile
          icon={<AlertCircle className="w-4 h-4 text-muted-foreground" />}
          label={translate("crm.accounts.dashboard.uncategorized", {
            _: "Uncategorized",
          })}
          value={currencyFormat(currency, stats.uncategorizedAmount)}
          hint={translate("crm.accounts.dashboard.uncategorized_hint", {
            count: stats.uncategorizedCount,
            smart_count: stats.uncategorizedCount,
            _: `${stats.uncategorizedCount} transactions`,
          })}
        />
      </div>

      {recurringExpenses.length > 0 && (
        <RecurringExpensesCard
          recurringExpenses={recurringExpenses}
          scopedData={scopedData}
          scopeFilter={scopeFilter}
          currency={currency}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
            <Wallet className="w-4 h-4" />
            {translate("crm.accounts.dashboard.monthly_trend", {
              _: "Monthly Income vs Expense",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] [&_rect]:cursor-pointer">
          <ResponsiveBar
            data={stats.months}
            indexBy="label"
            keys={["income", "expense"]}
            colors={({ id }) =>
              id === "income" ? diverging.income : diverging.expense
            }
            margin={{ top: 10, right: 20, bottom: 30, left: 50 }}
            padding={0.35}
            enableGridX={false}
            enableGridY
            enableLabel={false}
            valueFormat={(v) => currencyFormat(currency, v as number)}
            onClick={(bar) => {
              const next = new URLSearchParams(searchParams);
              next.set("month", bar.data.month as string);
              setSearchParams(next);
            }}
            tooltip={({ id, value, indexValue }) => (
              <MoneyBarTooltip
                id={id}
                value={value}
                indexValue={indexValue}
                currency={currency}
                hint={translate("crm.accounts.dashboard.click_for_detail", {
                  _: "Click to see week-by-week detail",
                })}
              />
            )}
            {...MONEY_BAR_AXIS_PROPS}
          />
        </CardContent>
      </Card>

      {stats.balanceSeries.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
              <LineChart className="w-4 h-4" />
              {translate("crm.accounts.dashboard.balance_trend", {
                _: "Account Balance Over Time",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveLine
              data={[{ id: "balance", data: stats.balanceSeries }]}
              margin={{ top: 10, right: 20, bottom: 20, left: 55 }}
              xScale={{ type: "point" }}
              yScale={{ type: "linear", min: "auto", max: "auto" }}
              curve="monotoneX"
              colors={[lineColor]}
              lineWidth={2}
              enablePoints={false}
              enableArea
              areaOpacity={isDark ? 0.15 : 0.08}
              enableGridX={false}
              enableGridY
              axisBottom={null}
              axisLeft={{
                tickSize: 0,
                tickPadding: 8,
                format: (v) => `${Math.round((v as number) / 1000)}k`,
                style: {
                  ticks: { text: { fill: "var(--color-muted-foreground)" } },
                },
              }}
              theme={{
                grid: { line: { stroke: "var(--color-border)" } },
              }}
              enableSlices="x"
              sliceTooltip={({ slice }) => {
                const point = slice.points[0];
                const raw = point.data as unknown as {
                  y: number;
                  date: string;
                  description: string;
                };
                return (
                  <div className="p-2 bg-secondary rounded shadow text-xs text-secondary-foreground max-w-[220px]">
                    <div className="font-medium">{raw.date}</div>
                    <div className="truncate text-secondary-foreground/80">
                      {raw.description}
                    </div>
                    <div>{currencyFormat(currency, raw.y)}</div>
                  </div>
                );
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {translate("crm.accounts.dashboard.top_categories", {
                _: "Top Spending Categories",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {stats.expenseBreakdown.rows.map((row, i) => (
              <CategoryRow
                key={row.key}
                label={row.label}
                value={row.value}
                max={stats.expenseBreakdown.max}
                total={Math.abs(stats.totalExpense)}
                color={SEQUENTIAL_STEPS[Math.min(i, SEQUENTIAL_STEPS.length - 1)]}
                currency={currency}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {translate("crm.accounts.dashboard.income_sources", {
                _: "Income Sources",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {stats.incomeBreakdown.rows.map((row) => (
              <CategoryRow
                key={row.key}
                label={row.label}
                value={row.value}
                max={stats.incomeBreakdown.max}
                total={stats.totalIncome}
                color={STATUS.good}
                currency={currency}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {translate("crm.accounts.dashboard.recent_transactions", {
              _: "Recent Transactions",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {translate("resources.transactions.fields.date")}
                  </TableHead>
                  <TableHead>
                    {translate("resources.transactions.fields.description")}
                  </TableHead>
                  <TableHead>
                    {translate("resources.transactions.fields.category")}
                  </TableHead>
                  <TableHead className="text-right">
                    {translate("resources.transactions.fields.amount")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {t.date}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">
                      {t.description}
                    </TableCell>
                    <TableCell>
                      {t.category ? (
                        <Badge variant="outline" className="text-[10px]">
                          {categoryLabel(t.category)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {categoryLabel(null)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums whitespace-nowrap"
                      style={{ color: t.amount >= 0 ? STATUS.good : undefined }}
                    >
                      {currencyFormat(currency, t.amount, 2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

AccountsDashboard.path = "/accounts";

/** Week-by-week drill-down for one month, reached by clicking a bar in the
 * monthly chart above. Filters `allTransactions` (already fetched by the
 * parent, no extra query) down to the selected month instead of issuing a
 * new getList -- the whole dataset already lives in memory. */
const MonthDetail = ({
  allTransactions,
  month,
  scopeFilter,
  onScopeChange,
  onBack,
  categoryLabel,
  otherLabel,
  currency,
  diverging,
}: {
  allTransactions: Transaction[];
  month: string;
  scopeFilter: ScopeFilter;
  onScopeChange: (scope: ScopeFilter) => void;
  onBack: () => void;
  categoryLabel: (v: string | null | undefined) => string;
  otherLabel: string;
  currency: string;
  diverging: { income: string; expense: string };
}) => {
  const translate = useTranslate();
  const monthStart = startOfMonth(parseISO(month));
  const monthEnd = endOfMonth(monthStart);

  const monthTxns = useMemo(
    () =>
      allTransactions
        .filter(
          (t) =>
            isWithinInterval(parseISO(t.date), {
              start: monthStart,
              end: monthEnd,
            }) &&
            (scopeFilter === "all" || t.scope === scopeFilter),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTransactions, month, scopeFilter],
  );

  const income = monthTxns
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTxns
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const weeks = useMemo(() => {
    const buckets = new Map<
      string,
      { start: Date; income: number; expense: number }
    >();
    for (const t of monthTxns) {
      const date = parseISO(t.date);
      // Sunday-start, matching tasksPredicate.ts's "this week" convention
      // elsewhere in the app -- a mismatched week boundary between Tasks
      // and Accounts would be a real, confusing inconsistency.
      const bucketStart = startOfWeek(date, { weekStartsOn: 0 });
      const key = format(bucketStart, "yyyy-MM-dd");
      const entry = buckets.get(key) ?? { start: bucketStart, income: 0, expense: 0 };
      if (t.amount > 0) entry.income += t.amount;
      else entry.expense += t.amount;
      buckets.set(key, entry);
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => {
        // Clip the displayed range to the month -- a week bucket can start
        // before the 1st (e.g. the 1st falls on a Wednesday) or run past
        // the last day, but only the in-month days are what's actually
        // being summed here.
        const rangeStart = v.start < monthStart ? monthStart : v.start;
        const rawEnd = new Date(v.start);
        rawEnd.setDate(rawEnd.getDate() + 6);
        const rangeEnd = rawEnd > monthEnd ? monthEnd : rawEnd;
        return {
          key,
          label: `${format(rangeStart, "d MMM")}–${format(rangeEnd, "d MMM")}`,
          income: v.income,
          expense: v.expense,
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthTxns]);

  const categoryBreakdown = rankByCategory(
    monthTxns,
    "expense",
    MAX_CATEGORY_ROWS,
    categoryLabel,
    otherLabel,
  );

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {translate("crm.accounts.dashboard.back_to_overview", {
            _: "All-time overview",
          })}
        </button>
        <h1 className="text-xl font-semibold">
          {format(monthStart, "MMMM yyyy")}
        </h1>
      </div>
      <ScopeToggle value={scopeFilter} onChange={onScopeChange} />
    </div>
  );

  if (monthTxns.length === 0) {
    return (
      <div className="mt-2 flex flex-col gap-4 pb-8">
        {header}
        <div className="mt-8 max-w-2xl mx-auto text-center text-muted-foreground">
          {translate("crm.accounts.dashboard.no_data_for_scope", {
            _: "No transactions in this scope yet.",
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-4 pb-8">
      {header}

      <div className="grid grid-cols-3 gap-4">
        <MoneyStatTiles income={income} expense={expense} currency={currency} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
            <Wallet className="w-4 h-4" />
            {translate("crm.accounts.dashboard.weekly_trend", {
              _: "Weekly Income vs Expense",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveBar
            data={weeks}
            indexBy="label"
            keys={["income", "expense"]}
            colors={({ id }) =>
              id === "income" ? diverging.income : diverging.expense
            }
            margin={{ top: 10, right: 20, bottom: 40, left: 50 }}
            padding={0.35}
            enableGridX={false}
            enableGridY
            enableLabel={false}
            valueFormat={(v) => currencyFormat(currency, v as number)}
            tooltip={({ id, value, indexValue }) => (
              <MoneyBarTooltip
                id={id}
                value={value}
                indexValue={indexValue}
                currency={currency}
              />
            )}
            {...MONEY_BAR_AXIS_PROPS}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {translate("crm.accounts.dashboard.top_categories", {
              _: "Top Spending Categories",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {categoryBreakdown.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {translate("crm.accounts.dashboard.no_expenses_this_month", {
                _: "No expenses this month.",
              })}
            </p>
          ) : (
            categoryBreakdown.rows.map((row, i) => (
              <CategoryRow
                key={row.key}
                label={row.label}
                value={row.value}
                max={categoryBreakdown.max}
                total={Math.abs(expense)}
                color={SEQUENTIAL_STEPS[Math.min(i, SEQUENTIAL_STEPS.length - 1)]}
                currency={currency}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {translate("crm.accounts.dashboard.month_transactions", {
              count: monthTxns.length,
              smart_count: monthTxns.length,
              _: `${monthTxns.length} transactions`,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {translate("resources.transactions.fields.date")}
                  </TableHead>
                  <TableHead>
                    {translate("resources.transactions.fields.description")}
                  </TableHead>
                  <TableHead>
                    {translate("resources.transactions.fields.category")}
                  </TableHead>
                  <TableHead className="text-right">
                    {translate("resources.transactions.fields.amount")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthTxns.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {t.date}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">
                      {t.description}
                    </TableCell>
                    <TableCell>
                      {t.category ? (
                        <Badge variant="outline" className="text-[10px]">
                          {categoryLabel(t.category)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {categoryLabel(null)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums whitespace-nowrap"
                      style={{ color: t.amount >= 0 ? STATUS.good : undefined }}
                    >
                      {currencyFormat(currency, t.amount, 2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/** The Income / Expense / Net Savings trio, shared by the all-time overview
 * and MonthDetail so a future change to labels/icons/thresholds can't drift
 * between the two views the way two independent copies could. `net` is
 * always income + expense (expense is already signed negative), computed
 * here rather than accepted as a separate prop so a caller can't pass an
 * inconsistent value. */
const MoneyStatTiles = ({
  income,
  expense,
  currency,
}: {
  income: number;
  expense: number;
  currency: string;
}) => {
  const translate = useTranslate();
  const net = income + expense;
  return (
    <>
      <StatTile
        icon={<ArrowUpRight className="w-4 h-4" style={{ color: STATUS.good }} />}
        label={translate("crm.accounts.dashboard.total_income", {
          _: "Total Income",
        })}
        value={currencyFormat(currency, income)}
      />
      <StatTile
        icon={
          <ArrowDownRight className="w-4 h-4" style={{ color: STATUS.critical }} />
        }
        label={translate("crm.accounts.dashboard.total_expense", {
          _: "Total Expense",
        })}
        value={currencyFormat(currency, Math.abs(expense))}
      />
      <StatTile
        icon={<PiggyBank className="w-4 h-4 text-muted-foreground" />}
        label={translate("crm.accounts.dashboard.net_savings", {
          _: "Net Savings",
        })}
        value={currencyFormat(currency, net)}
        valueStyle={{ color: net >= 0 ? STATUS.good : STATUS.critical }}
      />
    </>
  );
};

/** "Already spoken for this month" -- the actual payoff of tracking
 * recurring/unavoidable expenses at all: know what's already committed
 * before budgeting the rest. Tied to the real current calendar month
 * (today), not whatever month the chart above happens to be scrolled to --
 * a different, forward-looking job than the retrospective month/week
 * drill-down, so it's deliberately not duplicated inside MonthDetail. */
const RecurringExpensesCard = ({
  recurringExpenses,
  scopedData,
  scopeFilter,
  currency,
}: {
  recurringExpenses: RecurringExpense[];
  scopedData: Transaction[];
  scopeFilter: ScopeFilter;
  currency: string;
}) => {
  const translate = useTranslate();

  const { relevant, rows, totalExpected, totalPosted } = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const relevant =
      scopeFilter === "all"
        ? recurringExpenses
        : recurringExpenses.filter((r) => r.scope === scopeFilter);

    // One pass over this month's transactions, grouped by recurring
    // expense, instead of a .find() per expense re-scanning all of
    // scopedData -- and grouped (not just the first hit) so a split/
    // top-up payment linked to the same expense twice in one month
    // still sums to the real amount actually spent, not just whichever
    // matching row happened to come first.
    const matchesByExpense = new Map<Transaction["recurring_expense_id"], Transaction[]>();
    for (const t of scopedData) {
      if (
        t.recurring_expense_id == null ||
        !isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
      ) {
        continue;
      }
      const bucket = matchesByExpense.get(t.recurring_expense_id) ?? [];
      bucket.push(t);
      matchesByExpense.set(t.recurring_expense_id, bucket);
    }

    let totalExpected = 0;
    let totalPosted = 0;
    const rows = relevant.map((r) => {
      const matched = matchesByExpense.get(r.id) ?? [];
      const postedAmount = matched.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const overdue = matched.length === 0 && today.getDate() > r.due_day;
      totalExpected += r.amount;
      totalPosted += postedAmount;
      return { expense: r, matched, postedAmount, overdue };
    });

    return { relevant, rows, totalExpected, totalPosted };
  }, [recurringExpenses, scopedData, scopeFilter]);

  // relevant.length, not recurringExpenses.length, decides whether this
  // renders at all -- the parent only pre-checks the latter as a cheap
  // "is this feature used at all" gate, so scope-filtering everything away
  // (e.g. every active expense is Personal and the dashboard is filtered
  // to Business) still has to collapse to nothing here, not an empty card.
  if (relevant.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base font-medium text-muted-foreground">
          <span className="flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            {translate("crm.accounts.dashboard.recurring_this_month", {
              _: "This Month's Recurring Expenses",
            })}
          </span>
          <span className="text-sm tabular-nums">
            {currencyFormat(currency, totalPosted)} /{" "}
            {currencyFormat(currency, totalExpected)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.map(({ expense, matched, postedAmount, overdue }) => (
          <div key={expense.id} className="flex items-center gap-3 text-sm">
            <span className="flex-1 truncate">{expense.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {currencyFormat(currency, matched.length > 0 ? postedAmount : expense.amount)}
            </span>
            <Badge
              variant={matched.length > 0 ? "default" : overdue ? "destructive" : "outline"}
              className="text-[10px] w-20 justify-center"
            >
              {matched.length > 0
                ? translate("crm.accounts.dashboard.recurring_posted", {
                    _: "Posted",
                  })
                : overdue
                  ? translate("crm.accounts.dashboard.recurring_overdue", {
                      _: "Overdue",
                    })
                  : translate("crm.accounts.dashboard.recurring_due_day", {
                      day: expense.due_day,
                      _: `Due ${expense.due_day}`,
                    })}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const StatTile = ({
  icon,
  label,
  value,
  hint,
  valueStyle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  valueStyle?: React.CSSProperties;
}) => (
  <Card>
    <CardContent className="flex flex-col gap-1 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-xl font-semibold tabular-nums" style={valueStyle}>
        {value}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </CardContent>
  </Card>
);

const CategoryRow = ({
  label,
  value,
  max,
  total,
  color,
  currency,
}: {
  label: string;
  value: number;
  max: number;
  total: number;
  color: string;
  currency: string;
}) => (
  <div className="flex items-center gap-3">
    <span className="w-32 shrink-0 text-sm truncate">{label}</span>
    <div className="flex-1 h-3 rounded-sm bg-muted overflow-hidden">
      <div
        className="h-full rounded-sm"
        style={{
          width: `${(value / max) * 100}%`,
          backgroundColor: color,
        }}
      />
    </div>
    <span className="w-14 shrink-0 text-xs text-right tabular-nums text-muted-foreground">
      {total > 0 ? `${Math.round((value / total) * 100)}%` : ""}
    </span>
    <span className="w-20 shrink-0 text-sm text-right tabular-nums text-muted-foreground">
      {currencyFormat(currency, value)}
    </span>
  </div>
);
