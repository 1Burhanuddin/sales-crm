import type {
  CoreAdminProps,
  AuthProvider,
  DashboardComponent,
  LayoutComponent,
} from "ra-core";
import { CanAccess, CustomRoutes, localStorageStore, Resource } from "ra-core";
import { lazy, useEffect, useMemo } from "react";
import { Route } from "react-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Admin } from "@/components/admin/admin";
import { ForgotPasswordPage } from "@/components/supabase/forgot-password-page";
import { SetPasswordPage } from "@/components/supabase/set-password-page";
import { OAuthConsentPage } from "@/components/supabase/oauth-consent-page";

import companies from "../companies";
import contacts from "../contacts";
import { Dashboard } from "../dashboard/Dashboard";
import { MobileDashboard } from "../dashboard/MobileDashboard";
import { withRoleAwareDashboard } from "../dashboard/RoleAwareDashboard";
import deals from "../deals";
import employees from "../hr/employees";
import { ProjectShow } from "../projects/ProjectShow.tsx";
import { lazyResource } from "./lazyResource";
import { Layout } from "../layout/Layout";
import { MobileLayout } from "../layout/MobileLayout";
import { SignupPage } from "../login/SignupPage";
import { ConfirmationRequired } from "../login/ConfirmationRequired";
import { ImportPage } from "../misc/ImportPage";
import { ChangelogPage } from "../misc/ChangelogPage";
import {
  getAuthProvider as defaultAuthProviderBuilder,
  getDataProvider as defaultDataProviderBuilder,
} from "../providers/supabase";
import sales from "../sales";
import { SettingsPageMobile } from "../settings/SettingsPageMobile";
import { ProfilePage } from "../settings/ProfilePage";
import { SettingsPage } from "../settings/SettingsPage";
import {
  CONFIGURATION_STORE_KEY,
  type ConfigurationContextValue,
} from "./ConfigurationContext";
import type { CrmDataProvider } from "../providers/types";
import {
  defaultAttendanceStatuses,
  defaultCategoryRules,
  defaultCompanySectors,
  defaultCurrency,
  defaultDarkModeLogo,
  defaultDealCategories,
  defaultDealPipelineStatuses,
  defaultDealStages,
  defaultDepartments,
  defaultDesignations,
  defaultEmployeeStatuses,
  defaultEmploymentTypes,
  defaultIssuePriorities,
  defaultIssueStatuses,
  defaultLeaveTypes,
  defaultLightModeLogo,
  defaultNoteStatuses,
  defaultTaskTypes,
  defaultTitle,
  defaultTransactionCategories,
} from "./defaultConfiguration";
import { i18nProvider as defaulti18nProvider } from "../providers/commons/i18nProvider";
import { StartPage } from "../login/StartPage.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { MobileTasksList } from "../tasks/MobileTasksList.tsx";
import { ContactListMobile } from "../contacts/ContactList.tsx";
import { ContactShow } from "../contacts/ContactShow.tsx";
import { CompanyShow } from "../companies/CompanyShow.tsx";
import { NoteShowPage } from "../notes/NoteShowPage.tsx";

// Lazy-loaded so each feature area's code only downloads when its route
// is actually visited, instead of on every page load (see
// lazyResource.ts). companies/contacts/deals/employees/sales stay eager
// -- the primary CRM surface most users touch immediately, and
// employees/sales also export a non-component `recordRepresentation`
// field lazyResource isn't built to split out separately.
const LazyAccountsDashboard = lazy(() =>
  import("../accounts/AccountsDashboard").then((m) => ({
    default: m.AccountsDashboard,
  })),
);
const LazyPmDashboard = lazy(() =>
  import("../projects/PmDashboard").then((m) => ({ default: m.PmDashboard })),
);
const LazyHrDashboard = lazy(() =>
  import("../hr/HrDashboard").then((m) => ({ default: m.HrDashboard })),
);
const LazyMyHrDashboard = lazy(() =>
  import("../hr/MyHrDashboard").then((m) => ({ default: m.MyHrDashboard })),
);
const LazyIssueCalendar = lazy(() =>
  import("../projects/IssueCalendar").then((m) => ({
    default: m.IssueCalendar,
  })),
);

const defaultStore = localStorageStore(undefined, "CRM");

export type CRMProps = {
  dataProvider?: CrmDataProvider;
  authProvider?: AuthProvider;
  i18nProvider?: CoreAdminProps["i18nProvider"];
  disableTelemetry?: boolean;
  store?: CoreAdminProps["store"];
  dashboard?: DashboardComponent;
  layout?: LayoutComponent;
} & Partial<ConfigurationContextValue>;

/**
 * CRM Component
 *
 * This component sets up and renders the main CRM application using `ra-core`. It provides
 * default configurations and themes but allows for customization through props. The component
 * seeds the store with any custom prop values for backwards compatibility.
 *
 * @param {LabeledValue[]} companySectors - The list of company sectors used in the application.
 * @param {string} currency - The ISO 4217 currency code used to format monetary values (e.g. "USD", "EUR", "GBP").
 * @param {RaThemeOptions} darkTheme - The theme to use when the application is in dark mode.
 * @param {LabeledValue[]} dealCategories - The categories of deals used in the application.
 * @param {string[]} dealPipelineStatuses - The statuses of deals in the pipeline used in the application.
 * @param {DealStage[]} dealStages - The stages of deals used in the application.
 * @param {RaThemeOptions} lightTheme - The theme to use when the application is in light mode.
 * @param {string} darkModeLogo - Logo shown in dark mode and on the auth pages. Must be an imported asset, an absolute URL, or a data URI — never a route-relative path like "./logos/x.svg", which breaks on nested routes such as /oauth/consent (issue #291).
 * @param {string} lightModeLogo - Logo shown in light mode. Same rule as darkModeLogo: imported asset, absolute URL, or data URI only.
 * @param {NoteStatus[]} noteStatuses - The statuses of notes used in the application.
 * @param {LabeledValue[]} taskTypes - The types of tasks used in the application.
 * @param {string} title - The title of the CRM application.
 *
 * @returns {JSX.Element} The rendered CRM application.
 *
 * @example
 * // Basic usage of the CRM component
 * import { CRM } from '@/components/atomic-crm/dashboard/CRM';
 *
 * const App = () => (
 *     <CRM
 *         darkModeLogo="https://example.com/logo-dark.svg"
 *         lightModeLogo="https://example.com/logo-light.svg"
 *         title="My Custom CRM"
 *         lightTheme={{
 *             ...defaultTheme,
 *             palette: {
 *                 primary: { main: '#0000ff' },
 *             },
 *         }}
 *     />
 * );
 *
 * export default App;
 */
export const CRM = ({
  companySectors = defaultCompanySectors,
  currency = defaultCurrency,
  dealCategories = defaultDealCategories,
  dealPipelineStatuses = defaultDealPipelineStatuses,
  dealStages = defaultDealStages,
  issueStatuses = defaultIssueStatuses,
  issuePriorities = defaultIssuePriorities,
  darkModeLogo = defaultDarkModeLogo,
  lightModeLogo = defaultLightModeLogo,
  noteStatuses = defaultNoteStatuses,
  taskTypes = defaultTaskTypes,
  departments = defaultDepartments,
  designations = defaultDesignations,
  employmentTypes = defaultEmploymentTypes,
  employeeStatuses = defaultEmployeeStatuses,
  leaveTypes = defaultLeaveTypes,
  attendanceStatuses = defaultAttendanceStatuses,
  transactionCategories = defaultTransactionCategories,
  categoryRules = defaultCategoryRules,
  title = defaultTitle,
  dataProvider = defaultDataProviderBuilder(),
  authProvider = defaultAuthProviderBuilder(),
  i18nProvider = defaulti18nProvider,
  store = defaultStore,
  disableTelemetry,
  ...rest
}: CRMProps) => {
  useEffect(() => {
    if (
      disableTelemetry ||
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      typeof window.location === "undefined" ||
      typeof Image === "undefined"
    ) {
      return;
    }
    const img = new Image();
    img.src = `https://atomic-crm-telemetry.marmelab.com/atomic-crm-telemetry?domain=${window.location.hostname}`;
  }, [disableTelemetry]);

  // Seed the store with CRM prop values if not already stored
  // (backwards compatibility for prop-based config)
  useEffect(() => {
    if (!store.getItem(CONFIGURATION_STORE_KEY)) {
      store.setItem(CONFIGURATION_STORE_KEY, {
        companySectors,
        currency,
        dealCategories,
        dealPipelineStatuses,
        dealStages,
        issueStatuses,
        issuePriorities,
        noteStatuses,
        taskTypes,
        departments,
        designations,
        employmentTypes,
        employeeStatuses,
        leaveTypes,
        attendanceStatuses,
        transactionCategories,
        categoryRules,
        title,
        darkModeLogo,
        lightModeLogo,
      } satisfies ConfigurationContextValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const isMobile = useIsMobile();

  // on login, pre-fetch the configuration to avoid a flickering
  // when accessing the app for the first time
  const wrappedAuthProvider = useMemo<AuthProvider>(
    () => ({
      ...authProvider,
      login: async (params: any) => {
        const result = await authProvider.login(params);
        try {
          const config = await dataProvider.getConfiguration();
          if (Object.keys(config).length > 0) {
            store.setItem(CONFIGURATION_STORE_KEY, config);
          }
        } catch {
          // Non-critical: config will load via useConfigurationLoader
        }
        return result;
      },
      handleCallback: async (params: any) => {
        if (!authProvider.handleCallback) {
          throw new Error(
            "handleCallback is not implemented in the authProvider",
          );
        }
        const result = await authProvider.handleCallback(params);
        try {
          const config = await dataProvider.getConfiguration();
          if (Object.keys(config).length > 0) {
            store.setItem(CONFIGURATION_STORE_KEY, config);
          }
        } catch {
          // Non-critical: config will load via useConfigurationLoader
        }
        return result;
      },
      logout: async (params: any) => {
        try {
          store.removeItem(CONFIGURATION_STORE_KEY);
        } catch {
          // Ignore
        }
        return authProvider.logout(params);
      },
    }),
    [authProvider, dataProvider, store],
  );

  const ResponsiveAdmin = isMobile ? MobileAdmin : DesktopAdmin;

  return (
    <ResponsiveAdmin
      dataProvider={dataProvider}
      authProvider={wrappedAuthProvider}
      i18nProvider={i18nProvider}
      store={store}
      loginPage={StartPage}
      requireAuth
      disableTelemetry
      {...rest}
    />
  );
};

const DesktopAdmin = (
  props: CoreAdminProps & {
    dashboard?: DashboardComponent;
    layout?: LayoutComponent;
  },
) => {
  return (
    <Admin
      layout={props.layout ?? Layout}
      dashboard={withRoleAwareDashboard(props.dashboard ?? Dashboard)}
      {...props}
    >
      <CustomRoutes noLayout>
        <Route path={SignupPage.path} element={<SignupPage />} />
        <Route
          path={ConfirmationRequired.path}
          element={<ConfirmationRequired />}
        />
        <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
        <Route
          path={ForgotPasswordPage.path}
          element={<ForgotPasswordPage />}
        />
        <Route path={OAuthConsentPage.path} element={<OAuthConsentPage />} />
      </CustomRoutes>

      <CustomRoutes>
        <Route path={ProfilePage.path} element={<ProfilePage />} />
        <Route path={SettingsPage.path} element={<SettingsPage />} />
        <Route path={ImportPage.path} element={<ImportPage />} />
        <Route path={ChangelogPage.path} element={<ChangelogPage />} />
        <Route
          path="/my-hr"
          element={
            <CanAccess resource="employees" action="list">
              <LazyMyHrDashboard />
            </CanAccess>
          }
        />
        <Route
          path="/accounts"
          element={
            <CanAccess resource="transactions" action="list">
              <LazyAccountsDashboard />
            </CanAccess>
          }
        />
        <Route
          path="/pm"
          element={
            <CanAccess resource="projects" action="list">
              <LazyPmDashboard />
            </CanAccess>
          }
        />
        <Route
          path="/pm/calendar"
          element={
            <CanAccess resource="projects" action="list">
              <LazyIssueCalendar />
            </CanAccess>
          }
        />
        <Route
          path="/hr"
          element={
            <CanAccess resource="employees" action="create">
              <LazyHrDashboard />
            </CanAccess>
          }
        />
      </CustomRoutes>
      <Resource name="deals" {...deals} />
      <Resource name="contacts" {...contacts} />
      <Resource name="companies" {...companies} />
      <Resource
        name="leads"
        {...lazyResource(() => import("../leads"), [
          "list",
          "create",
          "edit",
          "show",
        ])}
      />
      <Resource
        name="projects"
        {...lazyResource(() => import("../projects"), [
          "list",
          "create",
          "edit",
        ])}
        show={ProjectShow}
      >
        <Route path=":id/issues/create" element={<ProjectShow />} />
        <Route path=":id/issues/:issueId" element={<ProjectShow />} />
        <Route path=":id/issues/:issueId/show" element={<ProjectShow />} />
      </Resource>
      <Resource name="issues" />
      <Resource name="sprints" />
      <Resource name="issue_notes" />
      <Resource name="employees" {...employees} />
      <Resource
        name="leave_requests"
        {...lazyResource(() => import("../hr/leave"), ["list"])}
      />
      <Resource
        name="attendance_records"
        {...lazyResource(() => import("../hr/attendance"), [
          "list",
          "create",
          "edit",
        ])}
      />
      <Resource name="salary_structures" />
      <Resource
        name="payslips"
        {...lazyResource(() => import("../hr/payroll"), [
          "list",
          "create",
          "show",
        ])}
      />
      <Resource
        name="transactions"
        {...lazyResource(() => import("../accounts"), [
          "list",
          "create",
          "edit",
        ])}
      />
      <Resource name="statement_imports" />
      <Resource
        name="personal_notes"
        {...lazyResource(() => import("../personal-notes"), ["list"])}
      />
      <Resource name="personal_note_versions" />
      <Resource name="personal_note_shares" />
      <Resource name="contact_notes" />
      <Resource name="deal_notes" />
      <Resource name="tasks" />
      <Resource name="sales" {...sales} />
      <Resource name="tags" />
    </Admin>
  );
};

const MobileAdmin = (
  props: CoreAdminProps & {
    dashboard?: DashboardComponent;
    layout?: LayoutComponent;
  },
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        networkMode: "offlineFirst",
      },
      mutations: {
        networkMode: "offlineFirst",
      },
    },
  });
  const asyncStoragePersister = createAsyncStoragePersister({
    storage: localStorage,
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <Admin
        queryClient={queryClient}
        layout={props.layout ?? MobileLayout}
        dashboard={withRoleAwareDashboard(props.dashboard ?? MobileDashboard)}
        {...props}
      >
        <CustomRoutes noLayout>
          <Route path={SignupPage.path} element={<SignupPage />} />
          <Route
            path={ConfirmationRequired.path}
            element={<ConfirmationRequired />}
          />
          <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
          <Route
            path={ForgotPasswordPage.path}
            element={<ForgotPasswordPage />}
          />
          <Route path={OAuthConsentPage.path} element={<OAuthConsentPage />} />
        </CustomRoutes>
        <CustomRoutes>
          <Route
            path={SettingsPageMobile.path}
            element={<SettingsPageMobile />}
          />
          <Route path={ChangelogPage.path} element={<ChangelogPage />} />
        </CustomRoutes>
        <Resource
          name="contacts"
          list={ContactListMobile}
          show={ContactShow}
          recordRepresentation={contacts.recordRepresentation}
        >
          <Route path=":id/notes/:noteId" element={<NoteShowPage />} />
        </Resource>
        <Resource name="companies" show={CompanyShow} />
        <Resource name="tasks" list={MobileTasksList} />
      </Admin>
    </PersistQueryClientProvider>
  );
};
