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
const HR_SELF_SERVICE_RESOURCES = ["employees"];
// Records only an admin can create, regardless of role.
const ADMIN_ONLY_CREATE_RESOURCES = ["companies", "contacts", "employees"];

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
