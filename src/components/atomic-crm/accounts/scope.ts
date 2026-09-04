// Fixed 2-value enum, not admin-configurable like transactionCategories --
// there's no Settings-driven reason to add a third scope, so this is a
// plain constant rather than another ConfigurationContext field. Shared by
// TransactionInputs, TransactionList, StatementUploadDialog, and
// AccountsDashboard so the choices list (and its labels) can't drift
// between them.
export type TransactionScope = "business" | "personal";

export const SCOPE_CHOICES: { value: TransactionScope; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "personal", label: "Personal" },
];
