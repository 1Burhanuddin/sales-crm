// Fixed workflow enum, deliberately NOT in ConfigurationContext (unlike
// issue statuses) — the app branches on these literal values (approve sets
// approved_by/approved_at; RLS "with check" clauses reference them), so
// letting an admin rename/remove one via Settings would silently break
// both the approval RLS and this UI.
export const LEAVE_REQUEST_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
] as const;
