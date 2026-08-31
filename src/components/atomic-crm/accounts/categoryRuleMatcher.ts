import type { CategoryRule } from "../types";

/** Matches a transaction description against the admin-editable
 * categoryRules (Settings -> Accounts): case-insensitive substring match,
 * first rule wins. Used only to *pre-fill* a category suggestion on
 * import — the admin can always override it in the review step. */
export const matchCategoryRule = (
  description: string,
  rules: CategoryRule[],
): string | undefined => {
  const lower = description.toLowerCase();
  const match = rules.find((rule) =>
    lower.includes(rule.keyword.toLowerCase()),
  );
  return match?.category;
};
