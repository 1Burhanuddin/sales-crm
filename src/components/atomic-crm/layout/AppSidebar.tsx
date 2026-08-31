import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarOff,
  ClipboardCheck,
  Filter,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  Receipt,
  StickyNote,
  User,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useGetIdentity, useTranslate } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { canAccess, getRole } from "../providers/commons/canAccess";
import { usePreferences } from "../preferences";
import { useConfigurationContext } from "../root/ConfigurationContext";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Gates visibility via canAccess(role, {resource, action}).
   * Omit for items every role can always see (Dashboard, My HR). */
  resource?: string;
  /** Defaults to "list". Override e.g. to "create" to reuse an
   * admin-only-create resource as an admin-only gate (HR Overview). */
  action?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// "/pm" needs an exact match, not the generic prefix rule below -- it has
// no sub-routes of its own, but "/pm/calendar" (a sibling nav item) sits
// right under it, and a naive "/pm/*" match would highlight both the
// Overview and Calendar items at once while viewing the calendar.
const isItemActive = (pathname: string, to: string) =>
  to === "/" || to === "/pm"
    ? !!matchPath(to, pathname)
    : !!matchPath(`${to}/*`, pathname);

export const AppSidebar = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const { identity } = useGetIdentity();
  const location = useLocation();
  const translate = useTranslate();
  const { sidebarVariant, sidebarCollapsible } = usePreferences();
  // UserIdentity is declared with only id/fullName/avatar (plus a `[key:
  // string]: any` index signature) — administrator/is_developer/notes_only
  // are our own authProvider's extra fields, so TS's weak-type check needs
  // a hint here even though they're safely present at runtime.
  const role = getRole(
    identity as
      | { administrator?: boolean; is_developer?: boolean; notes_only?: boolean }
      | undefined,
  );

  const groups: NavGroup[] = [
    {
      label: translate("crm.navigation.groups.overview", { _: "Overview" }),
      items: [
        {
          to: "/",
          label: translate("ra.page.dashboard"),
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: translate("crm.navigation.groups.crm", { _: "CRM" }),
      items: [
        {
          to: "/leads",
          label: translate("resources.leads.name", { smart_count: 2 }),
          icon: Filter,
          resource: "leads",
        },
        {
          to: "/contacts",
          label: translate("resources.contacts.name", { smart_count: 2 }),
          icon: Users,
          resource: "contacts",
        },
        {
          to: "/companies",
          label: translate("resources.companies.name", { smart_count: 2 }),
          icon: Building2,
          resource: "companies",
        },
        {
          to: "/deals",
          label: translate("resources.deals.name", { smart_count: 2 }),
          icon: Handshake,
          resource: "deals",
        },
      ],
    },
    {
      label: translate("crm.navigation.groups.projects", { _: "Projects" }),
      items: [
        {
          to: "/pm",
          label: translate("crm.pm.dashboard.nav_label", { _: "Overview" }),
          icon: BarChart3,
          resource: "projects",
        },
        {
          to: "/projects",
          label: translate("resources.projects.name", { smart_count: 2 }),
          icon: FolderKanban,
          resource: "projects",
        },
        {
          to: "/pm/calendar",
          label: translate("crm.pm.calendar.nav_label", { _: "Calendar" }),
          icon: CalendarDays,
          resource: "projects",
        },
      ],
    },
    {
      label: translate("crm.navigation.groups.hr", { _: "HR" }),
      items: [
        {
          to: "/hr",
          label: translate("crm.hr.dashboard.nav_label", { _: "Overview" }),
          icon: BarChart3,
          resource: "employees",
          action: "create",
        },
        {
          to: "/employees",
          label: translate("resources.employees.name", { smart_count: 2 }),
          icon: UserCheck,
          resource: "employees",
        },
        {
          to: "/leave_requests",
          label: translate("resources.leave_requests.name", {
            smart_count: 2,
          }),
          icon: CalendarOff,
          resource: "leave_requests",
        },
        {
          to: "/attendance_records",
          label: translate("resources.attendance_records.name", {
            smart_count: 2,
          }),
          icon: ClipboardCheck,
          resource: "attendance_records",
        },
        {
          to: "/payslips",
          label: translate("resources.payslips.name", { smart_count: 2 }),
          icon: Receipt,
          resource: "payslips",
        },
        {
          to: "/my-hr",
          label: translate("crm.hr.my_hr", { _: "My HR" }),
          icon: User,
        },
      ],
    },
    {
      label: translate("crm.navigation.groups.accounts", { _: "Accounts" }),
      items: [
        {
          to: "/accounts",
          label: translate("crm.accounts.dashboard.nav_label", {
            _: "Overview",
          }),
          icon: BarChart3,
          resource: "transactions",
        },
        {
          to: "/transactions",
          label: translate("crm.accounts.nav_label", { _: "Accounts" }),
          icon: Wallet,
          resource: "transactions",
        },
      ],
    },
    {
      label: translate("crm.navigation.groups.workspace", {
        _: "Workspace",
      }),
      items: [
        {
          to: "/personal_notes",
          label: translate("resources.personal_notes.name", {
            smart_count: 2,
            _: "Notes",
          }),
          icon: StickyNote,
          resource: "personal_notes",
        },
      ],
    },
  ];

  // The "notes-only" role gets nothing but the Workspace group — Dashboard
  // and "My HR" have no `resource` field (every other role always sees
  // them), so per-item canAccess filtering below can't hide those two on
  // its own; drop every other group outright instead.
  const visibleGroups =
    role === "notes-only"
      ? groups.filter(
          (g) =>
            g.label ===
            translate("crm.navigation.groups.workspace", { _: "Workspace" }),
        )
      : groups;

  return (
    <Sidebar variant={sidebarVariant} collapsible={sidebarCollapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" className="flex items-center gap-2">
                <img
                  className="[.light_&]:hidden h-6 w-6 shrink-0 object-contain"
                  src={darkModeLogo}
                  alt=""
                />
                <img
                  className="[.dark_&]:hidden h-6 w-6 shrink-0 object-contain"
                  src={lightModeLogo}
                  alt=""
                />
                <span className="text-base font-semibold truncate">
                  {title}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) =>
              !item.resource ||
              canAccess(role, {
                resource: item.resource,
                action: item.action ?? "list",
              }),
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        isActive={isItemActive(location.pathname, item.to)}
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
};
