import { AlertTriangle, Upload } from "lucide-react";
import {
  useDataProvider,
  useGetIdentity,
  useGetList,
  useNotify,
  useRefresh,
  useTranslate,
} from "ra-core";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { RecurringExpense, Transaction } from "../types";
import { matchCategoryRule } from "./categoryRuleMatcher";
import { matchRecurringExpense } from "./matchRecurringExpense";
import { SCOPE_CHOICES, type TransactionScope } from "./scope";
import {
  parseStatementPdf,
  StatementPasswordRequiredError,
  type ParsedTransaction,
} from "./statementParser";

type PreviewRow = ParsedTransaction & {
  included: boolean;
  category?: string;
  possibleDuplicate: boolean;
  scope: TransactionScope;
  recurringExpenseId?: number | string;
};

export const StatementUploadDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const { identity } = useGetIdentity();
  const { transactionCategories, categoryRules } = useConfigurationContext();
  const { data: recurringExpenses = [] } = useGetList<RecurringExpense>(
    "recurring_expenses",
    // Same filter/sort/pagination as AccountsDashboard's own fetch of this
    // list -- react-query keys on the full params object, so matching them
    // exactly means the two share one cache entry/request instead of each
    // page firing its own. `enabled: open` also means this dialog being
    // mounted-but-closed (see TransactionListActions) doesn't fetch at all
    // until it's actually opened.
    {
      filter: { active: true },
      pagination: { page: 1, perPage: 200 },
      sort: { field: "due_day", order: "ASC" },
    },
    { enabled: open },
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  // Used to initialize every row's scope as they're parsed (see runParse
  // below) -- a statement is usually all-one-scope, so getting the default
  // right up front means most imports need zero per-row scope edits. The
  // "Mark all as..." buttons below the summary line let the whole batch be
  // bulk-corrected after the fact too; individual rows stay editable via
  // their own selector either way.
  const [defaultScope, setDefaultScope] = useState<TransactionScope>("business");

  const handleClose = () => {
    setFile(null);
    setRows(null);
    setError(null);
    setNeedsPassword(false);
    setPassword("");
    // This dialog stays mounted (just hidden) between opens, so without
    // resetting this, a Personal statement's leftover default would
    // silently carry over and mis-tag the next, unrelated Business import.
    setDefaultScope("business");
    onClose();
  };

  const runParse = async (targetFile: File, pwd?: string) => {
    setError(null);
    setParsing(true);
    try {
      const result = await parseStatementPdf(targetFile, pwd);
      setNeedsPassword(false);
      if (result.transactions.length === 0) {
        setError(
          translate("resources.transactions.upload.no_transactions", {
            _: "No transactions could be found in this PDF. It may use a different layout than expected.",
          }),
        );
        return;
      }

      const dates = result.transactions.map((t) => t.date).sort();
      const { data: existing } = await dataProvider.getList<Transaction>(
        "transactions",
        {
          pagination: { page: 1, perPage: 2000 },
          sort: { field: "date", order: "ASC" },
          filter: {
            "date@gte": dates[0],
            "date@lte": dates[dates.length - 1],
          },
        },
      );

      const preview: PreviewRow[] = result.transactions.map((t) => {
        const possibleDuplicate = existing.some(
          (e) =>
            e.date === t.date &&
            Math.abs(e.amount - t.amount) < 0.01 &&
            e.description.trim().toLowerCase() ===
              t.description.trim().toLowerCase(),
        );
        // A recurring-expense match is a stronger, more specific signal
        // than the generic categoryRules keyword match (this line IS a
        // known bill, not just a description that happens to contain a
        // category-suggesting word), so it wins where they'd otherwise
        // both apply -- category and scope both come from the matched
        // expense's own settings rather than the categoryRules/bulk-
        // default fallbacks.
        const recurringMatch = matchRecurringExpense(t.description, recurringExpenses);
        return {
          ...t,
          included: !possibleDuplicate,
          category: recurringMatch?.category ?? matchCategoryRule(t.description, categoryRules),
          possibleDuplicate,
          scope: recurringMatch?.scope ?? defaultScope,
          recurringExpenseId: recurringMatch?.id,
        };
      });
      setRows(preview);
    } catch (err) {
      if (err instanceof StatementPasswordRequiredError) {
        setNeedsPassword(true);
        if (pwd) {
          // a password was already tried and rejected
          setError(
            translate("resources.transactions.upload.wrong_password", {
              _: "That password didn't work — try again.",
            }),
          );
        }
        return;
      }
      console.error(err);
      setError(
        translate("resources.transactions.upload.parse_error", {
          _: "Couldn't read this PDF. It may not match the expected statement layout.",
        }),
      );
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPassword("");
    await runParse(selected);
  };

  const handleUnlock = async () => {
    if (!file) return;
    await runParse(file, password);
  };

  const updateRow = (index: number, patch: Partial<PreviewRow>) => {
    setRows((prev) =>
      prev
        ? prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
        : prev,
    );
  };

  // Used only by "Mark all as..." below -- a per-row scope Select is
  // disabled while that row is linked to a recurring expense (see the
  // table body), so this is the one place a bulk scope change can
  // disagree with an existing link. When it does, unlink rather than
  // leave a mismatch for dataProvider.ts's beforeSave to silently
  // overwrite on save -- the reviewer should see the link visibly drop
  // (the row's recurring-expense cell goes back to "—") rather than
  // have their bulk action's stated scope get quietly ignored for that
  // one row at save time.
  const applyScope = (row: PreviewRow, scope: TransactionScope): PreviewRow => {
    const linked = recurringExpenses.find((r) => r.id === row.recurringExpenseId);
    const stillMatches = !linked || linked.scope === scope;
    return {
      ...row,
      scope,
      recurringExpenseId: stillMatches ? row.recurringExpenseId : undefined,
    };
  };

  const setAllScope = (scope: TransactionScope) => {
    setRows((prev) => (prev ? prev.map((row) => applyScope(row, scope)) : prev));
  };

  const handleImport = async () => {
    if (!rows || !file) return;
    const included = rows.filter((r) => r.included);
    if (included.length === 0) return;

    setImporting(true);
    try {
      const dates = included.map((r) => r.date).sort();
      const statementImport = await dataProvider.create("statement_imports", {
        data: {
          filename: file.name,
          period_from: dates[0],
          period_to: dates[dates.length - 1],
          transaction_count: included.length,
          sales_id: identity?.id,
        },
      });

      const failures: string[] = [];
      await Promise.all(
        included.map(async (row) => {
          try {
            await dataProvider.create("transactions", {
              data: {
                date: row.date,
                description: row.description,
                amount: row.amount,
                category: row.category ?? null,
                balance_after: row.balanceAfter ?? null,
                source: "statement",
                statement_import_id: statementImport.data.id,
                scope: row.scope,
                recurring_expense_id: row.recurringExpenseId ?? null,
              },
            });
          } catch {
            failures.push(row.description);
          }
        }),
      );

      if (failures.length > 0) {
        notify("resources.transactions.upload.partial_failure", {
          type: "warning",
          messageArgs: { count: failures.length },
          _: `Imported, but ${failures.length} row(s) failed.`,
        });
      } else {
        notify("resources.transactions.upload.success", {
          messageArgs: { count: included.length },
          _: `Imported ${included.length} transactions.`,
        });
      }
      refresh();
      handleClose();
    } catch (err) {
      console.error(err);
      notify("ra.notification.http_error", { type: "error" });
    } finally {
      setImporting(false);
    }
  };

  const includedCount = rows?.filter((r) => r.included).length ?? 0;
  const duplicateCount = rows?.filter((r) => r.possibleDuplicate).length ?? 0;
  const mismatchCount = rows?.filter((r) => r.balanceOk === false).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="lg:max-w-4xl p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        <DialogTitle>
          {translate("resources.transactions.upload.title", {
            _: "Upload Bank Statement",
          })}
        </DialogTitle>

        {!rows && (
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-sm text-muted-foreground">
              {translate("resources.transactions.upload.help", {
                _: "Upload a PDF bank statement. Nothing is saved until you review and confirm below.",
              })}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">
                {translate("resources.transactions.upload.default_scope", {
                  _: "This statement is for:",
                })}
              </label>
              <Select
                value={defaultScope}
                onValueChange={(value) => setDefaultScope(value as TransactionScope)}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_CHOICES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="text-sm"
              disabled={parsing}
            />
            {needsPassword && (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  placeholder={translate(
                    "resources.transactions.upload.password_placeholder",
                    { _: "PDF password" },
                  )}
                  className="text-sm border rounded px-2 py-1 flex-1"
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUnlock}
                  disabled={parsing || !password}
                >
                  {translate("resources.transactions.upload.unlock", {
                    _: "Unlock",
                  })}
                </Button>
              </div>
            )}
            {parsing && (
              <p className="text-sm text-muted-foreground">
                {translate("resources.transactions.upload.parsing", {
                  _: "Reading statement…",
                })}
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        )}

        {rows && (
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-sm text-muted-foreground">
              {translate("resources.transactions.upload.summary", {
                total: rows.length,
                duplicates: duplicateCount,
                _: `${rows.length} transactions found. ${duplicateCount} look like duplicates and are unchecked by default.`,
              })}
              {mismatchCount > 0 && (
                <>
                  {" "}
                  {translate("resources.transactions.upload.mismatch_note", {
                    count: mismatchCount,
                    _: `${mismatchCount} have a balance mismatch — review before importing.`,
                  })}
                </>
              )}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {translate("resources.transactions.upload.mark_all_as", {
                _: "Mark all as:",
              })}
              {SCOPE_CHOICES.map((c) => (
                <Button
                  key={c.value}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => setAllScope(c.value)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
            <div className="overflow-x-auto border rounded-md max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>
                      {translate("resources.transactions.fields.date")}
                    </TableHead>
                    <TableHead>
                      {translate("resources.transactions.fields.description")}
                    </TableHead>
                    <TableHead>
                      {translate("resources.transactions.fields.amount")}
                    </TableHead>
                    <TableHead>
                      {translate("resources.transactions.fields.category")}
                    </TableHead>
                    <TableHead>
                      {translate("resources.transactions.fields.scope")}
                    </TableHead>
                    <TableHead>
                      {translate("resources.transactions.fields.recurring_expense_id")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow
                      key={i}
                      className={
                        row.balanceOk === false ? "bg-destructive/10" : undefined
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={row.included}
                          onCheckedChange={(checked) =>
                            updateRow(i, { included: !!checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => updateRow(i, { date: e.target.value })}
                          className="text-sm bg-transparent w-32"
                        />
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) =>
                            updateRow(i, { description: e.target.value })
                          }
                          className="text-sm bg-transparent w-full truncate"
                        />
                        {row.possibleDuplicate && (
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            {translate(
                              "resources.transactions.upload.possible_duplicate",
                              { _: "Possible duplicate" },
                            )}
                          </Badge>
                        )}
                        {row.balanceOk === false && (
                          <Badge
                            variant="destructive"
                            className="mt-1 ml-1 text-[10px]"
                          >
                            {translate(
                              "resources.transactions.upload.balance_mismatch",
                              { _: "Balance mismatch" },
                            )}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          step="0.01"
                          value={row.amount}
                          onChange={(e) =>
                            updateRow(i, { amount: Number(e.target.value) })
                          }
                          className="text-sm bg-transparent w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.category ?? "__none"}
                          onValueChange={(value) =>
                            updateRow(i, {
                              category: value === "__none" ? undefined : value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">—</SelectItem>
                            {transactionCategories.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.scope}
                          onValueChange={(value) =>
                            updateRow(i, applyScope(row, value as TransactionScope))
                          }
                        >
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SCOPE_CHOICES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={
                            row.recurringExpenseId != null
                              ? String(row.recurringExpenseId)
                              : "__none"
                          }
                          onValueChange={(value) => {
                            // Look the real record up rather than storing
                            // the Select's raw string `value` directly --
                            // RecurringExpense.id can be a number (this
                            // app's Supabase ids normally are), and
                            // applyScope's `r.id === row.recurringExpenseId`
                            // equality check needs the same type on both
                            // sides or a manually-picked link would never
                            // match its own expense on a later scope change.
                            const picked = recurringExpenses.find(
                              (r) => String(r.id) === value,
                            );
                            updateRow(i, {
                              recurringExpenseId: picked?.id,
                              // Symmetric with the auto-match path: picking
                              // a recurring expense also adopts its scope
                              // and category, rather than leaving a row
                              // linked to one expense while still carrying
                              // a category/scope left over from a
                              // different (or no) match. Unlinking
                              // ("—") re-derives category from the
                              // generic categoryRules instead of leaving
                              // the now-disconnected expense's category
                              // behind with nothing to justify it anymore.
                              scope: picked ? picked.scope : row.scope,
                              category: picked
                                ? (picked.category ?? row.category)
                                : matchCategoryRule(row.description, categoryRules),
                            });
                          }}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">—</SelectItem>
                            {recurringExpenses.map((r) => (
                              <SelectItem key={r.id} value={String(r.id)}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                {translate("ra.action.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={importing || includedCount === 0}
              >
                <Upload className="w-4 h-4" />
                {translate("resources.transactions.upload.import_button", {
                  _: `Import ${includedCount} transactions`,
                  count: includedCount,
                })}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
