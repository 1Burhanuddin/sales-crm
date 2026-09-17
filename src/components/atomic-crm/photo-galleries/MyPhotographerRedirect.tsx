import { useGetList } from "ra-core";
import { Navigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

import type { Photographer } from "../types";

// Where a photographer login's "Photo Galleries" nav item and the
// role-aware dashboard both send them -- RLS already scopes
// photographers.select to just their own row for this role, so no
// filter is needed here, only whoever they are gets a row back.
export const MyPhotographerRedirect = () => {
  const { data, isPending } = useGetList<Photographer>("photographers", {
    pagination: { page: 1, perPage: 1 },
    sort: { field: "id", order: "ASC" },
  });

  if (isPending) return <Skeleton className="h-32 w-full mt-4" />;

  const mine = data?.[0];
  if (!mine) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        No photographer profile is linked to your account yet -- ask an admin to link it.
      </p>
    );
  }

  return <Navigate to={`/photographers/${mine.id}`} replace />;
};
