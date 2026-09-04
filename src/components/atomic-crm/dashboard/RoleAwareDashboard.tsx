import type { DashboardComponent } from "ra-core";
import { useGetIdentity } from "ra-core";
import { Navigate } from "react-router";

import { getRole } from "../providers/commons/canAccess";

// Where a role that can't see the default Dashboard's data lands instead.
const ROLE_REDIRECTS: Record<string, string> = {
  "notes-only": "/personal_notes",
  developer: "/pm",
  accounts: "/accounts",
};

/** Redirects roles that can't access the default Dashboard's data
 * (contacts/deals/etc) to the module they do have access to. */
export const withRoleAwareDashboard = (
  DefaultDashboard: DashboardComponent,
): DashboardComponent => {
  const RoleAwareDashboard: DashboardComponent = (props) => {
    const { identity } = useGetIdentity();
    const role = getRole(
      identity as
        | {
            administrator?: boolean;
            is_developer?: boolean;
            notes_only?: boolean;
            is_accounts?: boolean;
          }
        | undefined,
    );
    const redirect = ROLE_REDIRECTS[role];
    if (redirect) {
      return <Navigate to={redirect} replace />;
    }
    return <DefaultDashboard {...props} />;
  };
  return RoleAwareDashboard;
};
