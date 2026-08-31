import {
  Building2,
  CalendarOff,
  ClipboardCheck,
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
import { useConfigurationContext } from "../root/ConfigurationContext";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Gates visibility via canAccess(role, {resource, action: "list"}).
   * Omit for items every role can always see (Dashboard, My HR). */
  resource?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const isItemActive = (pathname: string, to: string) =>
  to === "/" ? !!matchPath("/", pathname) : !!matchPath(`${to}/*`, pathname);

export const AppSidebar = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const { identity } = useGetIdentity();
  const location = useLocation();
  const translate = useTranslate();
  // UserIdentity is declared with only id/fullName/avatar (plus a `[key:
  // string]: any` index signature) — administrator/is_developer are our
  // own authProvider's extra fields, so TS's weak-type check needs a hint
  // here even though they're safely present at runtime.
  const role = getRole(
    identity as { administrator?: boolean; is_developer?: boolean } | undefined,
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
          to: "/projects",
          label: translate("resources.projects.name", { smart_count: 2 }),
          icon: FolderKanban,
          resource: "projects",
        },
      ],
    },
    {
      label: translate("crm.navigation.groups.hr", { _: "HR" }),
      items: [
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

  return (
    <Sidebar collapsible="icon">
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
        {groups.map((group) => {
          const visibleItems = group.items.filter(
            (item) =>
              !item.resource ||
              canAccess(role, { resource: item.resource, action: "list" }),
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
