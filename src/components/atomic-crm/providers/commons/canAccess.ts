// FIXME: This should be exported from the ra-core package
type CanAccessParams<
  RecordType extends Record<string, any> = Record<string, any>,
> = {
  action: string;
  resource: string;
  record?: RecordType;
};

const PM_RESOURCES = ["projects", "issues", "issue_notes"];

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
    // Developers only get access to the Projects/Issues module. Zero
    // access to companies/contacts/deals/tasks/sales/configuration.
    return PM_RESOURCES.includes(params.resource);
  }

  // Only admins can delete records
  if (params.action === "delete" || params.action === "delete_many") {
    return false;
  }

  // Only admins can create new companies or contacts
  if (
    params.action === "create" &&
    (params.resource === "companies" || params.resource === "contacts")
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
