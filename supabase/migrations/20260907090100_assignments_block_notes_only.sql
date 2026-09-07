-- assignments' insert/update policies were missing the notes-only
-- exclusion every other same-shaped "own/assignee/admin" policy in this
-- schema has (e.g. leads' insert policy) -- canAccess.ts blocks the UI,
-- but RLS let a notes-only session write rows directly via the API.
drop policy "Insert own or admin" on public.assignments;
create policy "Insert own or admin, not notes-only" on public.assignments for insert to authenticated with check (
    (public.is_admin() or sales_id = public.current_sales_id()) and not public.is_notes_only()
);

drop policy "Update own, assigned, or admin" on public.assignments;
create policy "Update own, assigned, or admin, not notes-only" on public.assignments for update to authenticated using (
    (public.is_admin() or sales_id = public.current_sales_id() or assignee_id = public.current_sales_id()) and not public.is_notes_only()
) with check (
    (public.is_admin() or sales_id = public.current_sales_id() or assignee_id = public.current_sales_id()) and not public.is_notes_only()
);
