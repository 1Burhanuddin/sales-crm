-- Restrict row-level visibility on companies/contacts/deals (and their
-- notes/tasks) to the owning sales rep, unless the user is an administrator.
-- Previously every authenticated user could read/write every row regardless
-- of sales_id, so any sales person could see the whole team's leads.

create or replace function public.current_sales_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.sales where user_id = auth.uid();
$$;

grant execute on function public.current_sales_id() to authenticated;

-- Companies
drop policy "Enable read access for authenticated users" on public.companies;
drop policy "Enable update for authenticated users only" on public.companies;
drop policy "Company Delete Policy" on public.companies;

create policy "Select own or admin" on public.companies for select to authenticated
  using (public.is_admin() or sales_id = public.current_sales_id());
create policy "Update own or admin" on public.companies for update to authenticated
  using (public.is_admin() or sales_id = public.current_sales_id())
  with check (public.is_admin() or sales_id = public.current_sales_id());
create policy "Delete own or admin" on public.companies for delete to authenticated
  using (public.is_admin() or sales_id = public.current_sales_id());

-- Contacts
drop policy "Enable read access for authenticated users" on public.contacts;
drop policy "Enable update for authenticated users only" on public.contacts;
drop policy "Contact Delete Policy" on public.contacts;

create policy "Select own or admin" on public.contacts for select to authenticated
  using (public.is_admin() or sales_id = public.current_sales_id());
create policy "Update own or admin" on public.contacts for update to authenticated
  using (public.is_admin() or sales_id = public.current_sales_id())
  with check (public.is_admin() or sales_id = public.current_sales_id());
create policy "Delete own or admin" on public.contacts for delete to authenticated
  using (public.is_admin() or sales_id = public.current_sales_id());

-- Deals
drop policy "Enable read access for authenticated users" on public.deals;
drop policy "Enable update for authenticated users only" on public.deals;
drop policy "Deals Delete Policy" on public.deals;

create policy "Select own or admin" on public.deals for select to authenticated
  using (public.is_admin() or sales_id = public.current_sales_id());
create policy "Update own or admin" on public.deals for update to authenticated
  using (public.is_admin() or sales_id = public.current_sales_id())
  with check (public.is_admin() or sales_id = public.current_sales_id());
create policy "Delete own or admin" on public.deals for delete to authenticated
  using (public.is_admin() or sales_id = public.current_sales_id());

-- Contact notes: follow the parent contact's visibility
drop policy "Enable read access for authenticated users" on public.contact_notes;
drop policy "Contact Notes Update policy" on public.contact_notes;
drop policy "Contact Notes Delete Policy" on public.contact_notes;

create policy "Select own or admin" on public.contact_notes for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.contacts c
      where c.id = contact_notes.contact_id and c.sales_id = public.current_sales_id()
    )
  );
create policy "Update own or admin" on public.contact_notes for update to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.contacts c
      where c.id = contact_notes.contact_id and c.sales_id = public.current_sales_id()
    )
  );
create policy "Delete own or admin" on public.contact_notes for delete to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.contacts c
      where c.id = contact_notes.contact_id and c.sales_id = public.current_sales_id()
    )
  );

-- Deal notes: follow the parent deal's visibility
drop policy "Enable read access for authenticated users" on public.deal_notes;
drop policy "Deal Notes Update Policy" on public.deal_notes;
drop policy "Deal Notes Delete Policy" on public.deal_notes;

create policy "Select own or admin" on public.deal_notes for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.deals d
      where d.id = deal_notes.deal_id and d.sales_id = public.current_sales_id()
    )
  );
create policy "Update own or admin" on public.deal_notes for update to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.deals d
      where d.id = deal_notes.deal_id and d.sales_id = public.current_sales_id()
    )
  );
create policy "Delete own or admin" on public.deal_notes for delete to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.deals d
      where d.id = deal_notes.deal_id and d.sales_id = public.current_sales_id()
    )
  );

-- Tasks: follow the parent contact's visibility
drop policy "Enable read access for authenticated users" on public.tasks;
drop policy "Task Update Policy" on public.tasks;
drop policy "Task Delete Policy" on public.tasks;

create policy "Select own or admin" on public.tasks for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.contacts c
      where c.id = tasks.contact_id and c.sales_id = public.current_sales_id()
    )
  );
create policy "Update own or admin" on public.tasks for update to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.contacts c
      where c.id = tasks.contact_id and c.sales_id = public.current_sales_id()
    )
  );
create policy "Delete own or admin" on public.tasks for delete to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.contacts c
      where c.id = tasks.contact_id and c.sales_id = public.current_sales_id()
    )
  );
