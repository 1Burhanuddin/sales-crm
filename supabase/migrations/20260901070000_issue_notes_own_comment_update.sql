-- Issue comments' update policy was "anyone with PM access" (admin or
-- developer), letting any developer edit any other developer's comment.
-- Narrow to own comment or admin, matching delete's existing scope.
drop policy "PM access update" on public.issue_notes;
create policy "Update own or admin" on public.issue_notes for update to authenticated using (public.is_admin() or sales_id = public.current_sales_id()) with check (public.is_admin() or sales_id = public.current_sales_id());
