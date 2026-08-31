import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { usePreferences } from "../preferences";
import { useConfigurationLoader } from "../root/useConfigurationLoader";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { AppSidebar } from "./AppSidebar";
import Header from "./Header";

export const Layout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  const { title } = useConfigurationContext();
  const { contentLayout, navbarStyle } = usePreferences();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header
          className={cn(
            "flex h-14 shrink-0 items-center gap-2 border-b bg-secondary px-4",
            navbarStyle === "sticky" && "sticky top-0 z-10",
          )}
        >
          <SidebarTrigger className="text-secondary-foreground" />
          <Separator orientation="vertical" className="h-4" />
          <h1 className="text-sm font-medium text-secondary-foreground truncate">
            {title}
          </h1>
          <div className="ml-auto">
            <Header />
          </div>
        </header>
        <main
          className={cn(
            "pt-4 px-4 w-full",
            contentLayout === "centered" && "max-w-screen-2xl mx-auto",
          )}
          id="main-content"
        >
          <ErrorBoundary FallbackComponent={Error}>
            <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>
      </SidebarInset>
      <Notification />
    </SidebarProvider>
  );
};
