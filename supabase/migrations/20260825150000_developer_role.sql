-- Introduce a "developer / team member" role: a sales record that can access
-- the new Projects/Issues module but has zero access to sales data
-- (companies/contacts/deals). Additive column, defaults to false so existing
-- users and new signups are unaffected.

alter table public.sales add column is_developer boolean not null default false;

create or replace function public.is_developer()
returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.sales where user_id = auth.uid() and is_developer = true
  );
end;
$$;

create or replace function public.has_pm_access()
returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.sales
    where user_id = auth.uid()
      and (administrator = true or is_developer = true)
  );
end;
$$;

grant execute on function public.is_developer() to anon, authenticated, service_role;
grant execute on function public.has_pm_access() to anon, authenticated, service_role;

-- Close a pre-existing gap: these tables currently allow ANY authenticated
-- user to insert, relying on set_sales_id_default() + the select policy to
-- scope visibility after the fact. A developer could insert a deal/task/note
-- and then legitimately see it. Tighten inserts to exclude pure-developer
-- accounts.

drop policy "Enable insert for authenticated users only" on public.deals;
create policy "Block developer create" on public.deals for insert to authenticated
  with check (public.is_admin() or not public.is_developer());

drop policy "Enable insert for authenticated users only" on public.tasks;
create policy "Block developer create" on public.tasks for insert to authenticated
  with check (public.is_admin() or not public.is_developer());

drop policy "Enable insert for authenticated users only" on public.contact_notes;
create policy "Block developer create" on public.contact_notes for insert to authenticated
  with check (public.is_admin() or not public.is_developer());

drop policy "Enable insert for authenticated users only" on public.deal_notes;
create policy "Block developer create" on public.deal_notes for insert to authenticated
  with check (public.is_admin() or not public.is_developer());
