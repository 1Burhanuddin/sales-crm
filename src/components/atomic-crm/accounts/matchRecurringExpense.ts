import type { RecurringExpense } from "../types";

/** Matches a transaction description against active recurring_expenses'
 * match_keyword: case-insensitive substring, first match wins. Same shape
 * as categoryRuleMatcher's matchCategoryRule — used only to *pre-fill* a
 * suggestion on statement import review, never to silently auto-link
 * (the admin can always change or clear it in the review step). Expenses
 * with no match_keyword set are never suggested, only pickable manually. */
export const matchRecurringExpense = (
  description: string,
  recurringExpenses: RecurringExpense[],
): RecurringExpense | undefined => {
  const lower = description.toLowerCase();
  return recurringExpenses.find(
    (r) => r.active && r.match_keyword && lower.includes(r.match_keyword.toLowerCase()),
  );
};
