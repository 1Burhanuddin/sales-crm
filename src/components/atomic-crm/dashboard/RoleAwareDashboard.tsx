import type { DashboardComponent } from "ra-core";
import { useGetIdentity } from "ra-core";
import { Navigate } from "react-router";

import { getRole } from "../providers/commons/canAccess";

/** Wraps a dashboard component so the "notes-only" role — which can't
 * access anything the default Dashboard queries (contacts/deals/etc) —
 * gets redirected straight to Notes instead of landing on a Dashboard
 * it has no access to. Every other role renders the wrapped dashboard
 * unchanged. */
export const withRoleAwareDashboard = (
  DefaultDashboard: DashboardComponent,
): DashboardComponent => {
  const RoleAwareDashboard: DashboardComponent = (props) => {
    const { identity } = useGetIdentity();
    const role = getRole(
      identity as
        | { administrator?: boolean; is_developer?: boolean; notes_only?: boolean }
        | undefined,
    );
    if (role === "notes-only") {
      return <Navigate to="/personal_notes" replace />;
    }
    return <DefaultDashboard {...props} />;
  };
  return RoleAwareDashboard;
};
