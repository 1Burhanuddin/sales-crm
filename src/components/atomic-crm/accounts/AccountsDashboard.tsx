import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { format, parseISO, startOfMonth } from "date-fns";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Hash,
  LineChart,
  PiggyBank,
  Receipt,
  Wallet,
} from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
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

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Transaction } from "../types";

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
    const txns = data ?? [];
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

    const withBalance = txns.filter((t) => t.balance_after != null);
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
      net: totalIncome + totalExpense,
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
  }, [data, categoryLabel, otherLabel]);

  if (isPending) {
    return (
      <div className="mt-2 max-w-5xl mx-auto flex flex-col gap-4 pb-8">
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

  return (
    <div className="mt-2 max-w-5xl mx-auto flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {translate("crm.accounts.dashboard.title", {
            _: "Accounts Overview",
          })}
        </h1>
        <Link
          to="/transactions"
          className="text-sm text-primary hover:underline"
        >
          {translate("crm.accounts.dashboard.view_transactions", {
            _: "View all transactions",
          })}
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatTile
          icon={<ArrowUpRight className="w-4 h-4" style={{ color: STATUS.good }} />}
          label={translate("crm.accounts.dashboard.total_income", {
            _: "Total Income",
          })}
          value={currencyFormat(currency, stats.totalIncome)}
        />
        <StatTile
          icon={
            <ArrowDownRight className="w-4 h-4" style={{ color: STATUS.critical }} />
          }
          label={translate("crm.accounts.dashboard.total_expense", {
            _: "Total Expense",
          })}
          value={currencyFormat(currency, Math.abs(stats.totalExpense))}
        />
        <StatTile
          icon={<PiggyBank className="w-4 h-4 text-muted-foreground" />}
          label={translate("crm.accounts.dashboard.net_savings", {
            _: "Net Savings",
          })}
          value={currencyFormat(currency, stats.net)}
          valueStyle={{ color: stats.net >= 0 ? STATUS.good : STATUS.critical }}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
            <Wallet className="w-4 h-4" />
            {translate("crm.accounts.dashboard.monthly_trend", {
              _: "Monthly Income vs Expense",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
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
            tooltip={({ id, value, indexValue }) => (
              <div className="p-2 bg-secondary rounded shadow text-xs text-secondary-foreground">
                <strong>{indexValue}</strong> —{" "}
                {id === "income"
                  ? translate("crm.accounts.dashboard.total_income", {
                      _: "Total Income",
                    })
                  : translate("crm.accounts.dashboard.total_expense", {
                      _: "Total Expense",
                    })}
                : {currencyFormat(currency, Math.abs(value as number))}
              </div>
            )}
            axisLeft={{
              tickSize: 0,
              tickPadding: 8,
              format: (v) => `${Math.round((v as number) / 1000)}k`,
              style: {
                ticks: { text: { fill: "var(--color-muted-foreground)" } },
              },
            }}
            axisBottom={{
              tickSize: 0,
              tickPadding: 8,
              style: {
                ticks: { text: { fill: "var(--color-muted-foreground)" } },
              },
            }}
            theme={{
              grid: { line: { stroke: "var(--color-border)" } },
            }}
            markers={[
              {
                axis: "y",
                value: 0,
                lineStyle: { stroke: "var(--color-border)", strokeWidth: 1 },
              } as any,
            ]}
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
