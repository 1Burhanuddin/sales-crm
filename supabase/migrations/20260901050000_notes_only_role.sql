--
-- New role: "notes-only" — a user restricted to the Notes module and
-- nothing else in the app (no Dashboard, CRM, PM, HR, Accounts). Same
-- boolean-flag-on-sales pattern as administrator/is_developer; see
-- canAccess.ts's getRole()/canAccess() for the frontend gating and
-- is_notes_only() below for the RLS-level backstop.
--

alter table public.sales add column notes_only boolean not null default false;

CREATE OR REPLACE FUNCTION "public"."is_notes_only"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  return exists (
    select 1 from public.sales where user_id = auth.uid() and notes_only = true
  );
end;
$$;

-- Backstop the frontend gating at the RLS layer: a notes-only user should
-- not be able to create business records via a raw REST call even though
-- the UI never shows them the forms. companies/contacts/employees are
-- already admin-only-create, so only these four need extending.
drop policy "Block developer create" on public.contact_notes;
create policy "Block developer or notes-only create" on public.contact_notes for insert to authenticated with check (public.is_admin() or (not public.is_developer() and not public.is_notes_only()));

drop policy "Block developer create" on public.deals;
create policy "Block developer or notes-only create" on public.deals for insert to authenticated with check (public.is_admin() or (not public.is_developer() and not public.is_notes_only()));

drop policy "Block developer create" on public.deal_notes;
create policy "Block developer or notes-only create" on public.deal_notes for insert to authenticated with check (public.is_admin() or (not public.is_developer() and not public.is_notes_only()));

drop policy "Block developer create" on public.tasks;
create policy "Block developer or notes-only create" on public.tasks for insert to authenticated with check (public.is_admin() or (not public.is_developer() and not public.is_notes_only()));

drop policy "Insert own or admin" on public.leads;
create policy "Insert own or admin, not notes-only" on public.leads for insert to authenticated with check (
    (public.is_admin() or sales_id = public.current_sales_id()) and not public.is_notes_only()
);

-- Assign the role: insiyayeola1@gmail.com should only see Notes.
update public.sales
set notes_only = true
where email = 'insiyayeola1@gmail.com';
