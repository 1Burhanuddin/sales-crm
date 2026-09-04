/** Case-insensitive substring match against a description, first item
 * whose keyword matches wins. Shared by categoryRuleMatcher's
 * matchCategoryRule (categoryRules' `keyword` field) and
 * matchRecurringExpense (recurring_expenses' `match_keyword` field) —
 * same algorithm, different keyword field, so it lives in one place
 * instead of two copies that could quietly drift apart (e.g. one gaining
 * whitespace-trimming or word-boundary matching the other doesn't). Used
 * only to *pre-fill* a suggestion during statement import review — never
 * blocks the user from overriding it. */
export const matchByKeyword = <T>(
  description: string,
  items: T[],
  getKeyword: (item: T) => string | null | undefined,
): T | undefined => {
  const lower = description.toLowerCase();
  return items.find((item) => {
    const keyword = getKeyword(item);
    return !!keyword && lower.includes(keyword.toLowerCase());
  });
};
