--
-- Row Level Security
-- This file declares RLS policies for all tables.
--

-- Enable RLS on all tables
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_notes enable row level security;
alter table public.deals enable row level security;
alter table public.deal_notes enable row level security;
alter table public.sales enable row level security;
alter table public.tags enable row level security;
alter table public.tasks enable row level security;
alter table public.configuration enable row level security;
alter table public.favicons_excluded_domains enable row level security;

-- Companies (visible/editable by their owning sales rep, or any admin)
create policy "Select own or admin" on public.companies for select to authenticated using (public.is_admin() or sales_id = public.current_sales_id());
create policy "Admin create only" on public.companies for insert to authenticated with check (public.is_admin());
create policy "Update own or admin" on public.companies for update to authenticated using (public.is_admin() or sales_id = public.current_sales_id()) with check (public.is_admin() or sales_id = public.current_sales_id());
create policy "Admin delete only" on public.companies for delete to authenticated using (public.is_admin());

-- Contacts (visible/editable by their owning sales rep, or any admin)
create policy "Select own or admin" on public.contacts for select to authenticated using (public.is_admin() or sales_id = public.current_sales_id());
create policy "Admin create only" on public.contacts for insert to authenticated with check (public.is_admin());
create policy "Update own or admin" on public.contacts for update to authenticated using (public.is_admin() or sales_id = public.current_sales_id()) with check (public.is_admin() or sales_id = public.current_sales_id());
create policy "Admin delete only" on public.contacts for delete to authenticated using (public.is_admin());

-- Contact Notes (follow the parent contact's visibility)
create policy "Select own or admin" on public.contact_notes for select to authenticated using (public.is_admin() or exists (select 1 from public.contacts c where c.id = contact_notes.contact_id and c.sales_id = public.current_sales_id()));
create policy "Enable insert for authenticated users only" on public.contact_notes for insert to authenticated with check (true);
create policy "Update own or admin" on public.contact_notes for update to authenticated using (public.is_admin() or exists (select 1 from public.contacts c where c.id = contact_notes.contact_id and c.sales_id = public.current_sales_id()));
create policy "Admin delete only" on public.contact_notes for delete to authenticated using (public.is_admin());

-- Deals (visible/editable by their owning sales rep, or any admin)
create policy "Select own or admin" on public.deals for select to authenticated using (public.is_admin() or sales_id = public.current_sales_id());
create policy "Enable insert for authenticated users only" on public.deals for insert to authenticated with check (true);
create policy "Update own or admin" on public.deals for update to authenticated using (public.is_admin() or sales_id = public.current_sales_id()) with check (public.is_admin() or sales_id = public.current_sales_id());
create policy "Admin delete only" on public.deals for delete to authenticated using (public.is_admin());

-- Deal Notes (follow the parent deal's visibility)
create policy "Select own or admin" on public.deal_notes for select to authenticated using (public.is_admin() or exists (select 1 from public.deals d where d.id = deal_notes.deal_id and d.sales_id = public.current_sales_id()));
create policy "Enable insert for authenticated users only" on public.deal_notes for insert to authenticated with check (true);
create policy "Update own or admin" on public.deal_notes for update to authenticated using (public.is_admin() or exists (select 1 from public.deals d where d.id = deal_notes.deal_id and d.sales_id = public.current_sales_id()));
create policy "Admin delete only" on public.deal_notes for delete to authenticated using (public.is_admin());

-- Sales
create policy "Enable read access for authenticated users" on public.sales for select to authenticated using (true);

-- Tags
create policy "Enable read access for authenticated users" on public.tags for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.tags for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.tags for update to authenticated using (true);
create policy "Admin delete only" on public.tags for delete to authenticated using (public.is_admin());

-- Tasks (follow the parent contact's visibility)
create policy "Select own or admin" on public.tasks for select to authenticated using (public.is_admin() or exists (select 1 from public.contacts c where c.id = tasks.contact_id and c.sales_id = public.current_sales_id()));
create policy "Enable insert for authenticated users only" on public.tasks for insert to authenticated with check (true);
create policy "Update own or admin" on public.tasks for update to authenticated using (public.is_admin() or exists (select 1 from public.contacts c where c.id = tasks.contact_id and c.sales_id = public.current_sales_id()));
create policy "Admin delete only" on public.tasks for delete to authenticated using (public.is_admin());

-- Configuration (admin-only for writes)
create policy "Enable read for authenticated" on public.configuration for select to authenticated using (true);
create policy "Enable insert for admins" on public.configuration for insert to authenticated with check (public.is_admin());
create policy "Enable update for admins" on public.configuration for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Favicons excluded domains
create policy "Enable access for authenticated users only" on public.favicons_excluded_domains to authenticated using (true) with check (true);
