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
const HR_SELF_SERVICE_RESOURCES = ["employees", "leave_requests"];
// Records only an admin can create, regardless of role.
const ADMIN_ONLY_CREATE_RESOURCES = ["companies", "contacts", "employees"];
// Non-CRUD actions only an admin can take, regardless of role. canAccess
// can't see params.record, so these gate the button/UI only — the real
// enforcement is the leave_requests RLS "with check" clauses.
const ADMIN_ONLY_ACTIONS = ["approve", "reject"];

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
    if (ADMIN_ONLY_ACTIONS.includes(params.action)) {
      return false;
    }
    return true;
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

  // Only admins can approve/reject leave requests
  if (ADMIN_ONLY_ACTIONS.includes(params.action)) {
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

  return true;
};
