-- Restrict record deletion to administrators. Non-admin sales reps can
-- still view/edit their own companies/contacts/deals (see the
-- sales_scoped_visibility migration), but deleting anything now
-- requires administrator = true.

drop policy "Delete own or admin" on public.companies;
create policy "Admin delete only" on public.companies for delete to authenticated
  using (public.is_admin());

drop policy "Delete own or admin" on public.contacts;
create policy "Admin delete only" on public.contacts for delete to authenticated
  using (public.is_admin());

drop policy "Delete own or admin" on public.contact_notes;
create policy "Admin delete only" on public.contact_notes for delete to authenticated
  using (public.is_admin());

drop policy "Delete own or admin" on public.deals;
create policy "Admin delete only" on public.deals for delete to authenticated
  using (public.is_admin());

drop policy "Delete own or admin" on public.deal_notes;
create policy "Admin delete only" on public.deal_notes for delete to authenticated
  using (public.is_admin());

drop policy "Delete own or admin" on public.tasks;
create policy "Admin delete only" on public.tasks for delete to authenticated
  using (public.is_admin());

drop policy "Enable delete for authenticated users only" on public.tags;
create policy "Admin delete only" on public.tags for delete to authenticated
  using (public.is_admin());
