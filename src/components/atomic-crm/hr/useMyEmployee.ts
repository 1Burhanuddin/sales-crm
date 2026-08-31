import { useGetIdentity, useGetList } from "ra-core";

import type { Employee } from "../types";

/** The employees row linked to the current CRM login, if any (RLS already
 * scopes non-admins to their own row; admins pass an explicit filter so
 * this still resolves to "my" record rather than an arbitrary one). */
export const useMyEmployee = () => {
  const { identity } = useGetIdentity();
  const { data, isPending } = useGetList<Employee>(
    "employees",
    {
      pagination: { page: 1, perPage: 1 },
      filter: { sales_id: identity?.id },
    },
    { enabled: identity?.id != null },
  );
  return { employee: data?.[0], isPending };
};
