-- Only administrators can create new companies or contacts. Sales reps
-- can still create deals, notes, and tasks on the companies/contacts
-- already assigned to them.

drop policy "Enable insert for authenticated users only" on public.companies;
create policy "Admin create only" on public.companies for insert to authenticated
  with check (public.is_admin());

drop policy "Enable insert for authenticated users only" on public.contacts;
create policy "Admin create only" on public.contacts for insert to authenticated
  with check (public.is_admin());
