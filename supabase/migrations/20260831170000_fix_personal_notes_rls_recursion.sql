--
-- Fix "infinite recursion detected in policy for relation personal_notes".
--
-- personal_notes' select policy queries personal_note_shares directly, and
-- personal_note_shares' select/insert/delete policies query personal_notes
-- directly right back -- a mutual cross-table reference. Postgres re-applies
-- RLS on every table a policy's subquery touches, so evaluating either
-- policy re-triggers the other, which re-triggers the first again, and so
-- on: infinite recursion.
--
-- Fix: route personal_note_shares' checks against personal_notes through a
-- SECURITY DEFINER function (same pattern as is_admin()/current_sales_id()
-- already used everywhere else in this schema). A SECURITY DEFINER
-- function's internal query runs as its owner, bypassing RLS entirely, so
-- it doesn't re-trigger personal_notes' policy -- breaking the cycle at
-- this one point is enough; personal_notes' own policy still queries
-- personal_note_shares normally, but that no longer loops back further.
--

create or replace function public.owns_personal_note(p_note_id bigint) returns boolean
    language sql stable security definer
    set search_path to ''
    as $$
  select exists (
    select 1 from public.personal_notes pn where pn.id = p_note_id and pn.sales_id = public.current_sales_id()
  );
$$;

grant execute on function public.owns_personal_note(bigint) to anon, authenticated, service_role;

drop policy "Owner, recipient, or admin can view a share" on public.personal_note_shares;
create policy "Owner, recipient, or admin can view a share" on public.personal_note_shares for select to authenticated using (
    public.is_admin()
    or shared_with_sales_id = public.current_sales_id()
    or public.owns_personal_note(note_id)
);

drop policy "Owner or admin manages shares" on public.personal_note_shares;
create policy "Owner or admin manages shares" on public.personal_note_shares for insert to authenticated with check (
    public.is_admin() or public.owns_personal_note(note_id)
);

drop policy "Owner or admin removes shares" on public.personal_note_shares;
create policy "Owner or admin removes shares" on public.personal_note_shares for delete to authenticated using (
    public.is_admin() or public.owns_personal_note(note_id)
);
