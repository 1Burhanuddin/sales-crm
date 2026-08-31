// FIXME: This should be exported from the ra-core package
type CanAccessParams<
  RecordType extends Record<string, any> = Record<string, any>,
> = {
  action: string;
  resource: string;
  record?: RecordType;
};

const PM_RESOURCES = [
  "projects",
  "issues",
  "issue_notes",
  "sprints",
  "milestones",
];
// HR resources every role gets self-service access to (their own linked
// record, enforced by RLS) alongside admins' full access.
const HR_SELF_SERVICE_RESOURCES = [
  "employees",
  "leave_requests",
  "attendance_records",
  "salary_structures",
  "payslips",
];
// HR resources that are view-only for self-service, even on your own
// record — payroll is computed/managed by HR, not self-edited.
const HR_ADMIN_MANAGED_RESOURCES = ["salary_structures", "payslips"];
// Records only an admin can create, regardless of role.
const ADMIN_ONLY_CREATE_RESOURCES = ["companies", "contacts", "employees"];
// Non-CRUD actions only an admin can take, regardless of role. canAccess
// can't see params.record, so these gate the button/UI only — the real
// enforcement is the leave_requests RLS "with check" clauses.
const ADMIN_ONLY_ACTIONS = ["approve", "reject"];
// Accounts (personal finance tracking) is fully admin-only, not
// self-service — same treatment as "sales"/"configuration" below, not the
// HR_SELF_SERVICE_RESOURCES pattern.
const ACCOUNTS_RESOURCES = ["transactions", "statement_imports"];
// Personal notes are fully self-service for every role, including
// developer — zero relation to CRM/HR/PM data. Unlike everything else in
// this file, a plain user can also delete their own note (see the
// personal_notes RLS policy: delete does NOT require admin, since these
// are private scratch content, not shared business/HR data).
const PERSONAL_NOTE_RESOURCES = [
  "personal_notes",
  "personal_note_shares",
  "personal_note_versions",
];

// Shared by the developer and plain-user branches so HR rules can't drift
// apart between the two self-service roles.
const restrictHrAdminActions = (params: CanAccessParams<any>) => {
  if (
    HR_ADMIN_MANAGED_RESOURCES.includes(params.resource) &&
    params.action !== "list" &&
    params.action !== "show"
  ) {
    return false;
  }
  return !ADMIN_ONLY_ACTIONS.includes(params.action);
};

// Shared by the authProvider (async canAccess check) and any UI that needs
// to filter itself synchronously off the current identity (e.g. the
// sidebar hiding empty nav groups) — one place computing "admin" /
// "developer" / "user" so the two can't drift apart.
export const getRole = (
  sale:
    | { administrator?: boolean; is_developer?: boolean; notes_only?: boolean }
    | null
    | undefined,
): string => {
  if (!sale) return "user";
  if (sale.administrator) return "admin";
  if (sale.is_developer) return "developer";
  if (sale.notes_only) return "notes-only";
  return "user";
};

export const canAccess = <
  RecordType extends Record<string, any> = Record<string, any>,
>(
  role: string,
  params: CanAccessParams<RecordType>,
) => {
  if (role === "admin") {
    return true;
  }

  // Fully restricted role: Notes only, nothing else in the app —
  // no Dashboard, no CRM/PM/HR/Accounts, not even the plain-user default
  // access. Checked before the developer branch since it's stricter.
  if (role === "notes-only") {
    return PERSONAL_NOTE_RESOURCES.includes(params.resource);
  }

  if (role === "developer") {
    // Developers get the Projects/Issues module plus their own HR
    // self-service records. Zero access to companies/contacts/deals/tasks/
    // sales/configuration.
    if (
      ![
        ...PM_RESOURCES,
        ...HR_SELF_SERVICE_RESOURCES,
        ...PERSONAL_NOTE_RESOURCES,
      ].includes(params.resource)
    ) {
      return false;
    }
    if (
      params.action === "create" &&
      ADMIN_ONLY_CREATE_RESOURCES.includes(params.resource)
    ) {
      return false;
    }
    return restrictHrAdminActions(params);
  }

  // Only admins can delete records — except personal notes, which are
  // private scratch content a user can delete themselves (RLS-enforced).
  if (
    (params.action === "delete" || params.action === "delete_many") &&
    !PERSONAL_NOTE_RESOURCES.includes(params.resource)
  ) {
    return false;
  }

  // Only admins can create new companies, contacts, or employees
  if (
    params.action === "create" &&
    ADMIN_ONLY_CREATE_RESOURCES.includes(params.resource)
  ) {
    return false;
  }

  // Non admins can't access the sales resource
  if (params.resource === "sales") {
    return false;
  }

  // Non admins can't access the configuration resource
  if (params.resource === "configuration") {
    return false;
  }

  // Non admins can't access Accounts (personal finance tracking) at all
  if (ACCOUNTS_RESOURCES.includes(params.resource)) {
    return false;
  }

  // Plain sales users don't get access to the Projects/Issues module either
  if (PM_RESOURCES.includes(params.resource)) {
    return false;
  }

  return restrictHrAdminActions(params);
};
