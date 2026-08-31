// FIXME: This should be exported from the ra-core package
type CanAccessParams<
  RecordType extends Record<string, any> = Record<string, any>,
> = {
  action: string;
  resource: string;
  record?: RecordType;
};

const PM_RESOURCES = ["projects", "issues", "issue_notes"];
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

export const canAccess = <
  RecordType extends Record<string, any> = Record<string, any>,
>(
  role: string,
  params: CanAccessParams<RecordType>,
) => {
  if (role === "admin") {
    return true;
  }

  if (role === "developer") {
    // Developers get the Projects/Issues module plus their own HR
    // self-service records. Zero access to companies/contacts/deals/tasks/
    // sales/configuration.
    if (
      ![...PM_RESOURCES, ...HR_SELF_SERVICE_RESOURCES].includes(
        params.resource,
      )
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

  // Only admins can delete records
  if (params.action === "delete" || params.action === "delete_many") {
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

  // Plain sales users don't get access to the Projects/Issues module either
  if (PM_RESOURCES.includes(params.resource)) {
    return false;
  }

  return restrictHrAdminActions(params);
};
