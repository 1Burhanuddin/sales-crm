-- RBAC hardening: (1) projects gain member_ids, scoping PM access to
-- assigned developers instead of has_pm_access()'s blanket admin-or-any-
-- developer; (2) a dedicated "accounts" role for bookkeeping-only access.

-- ============================================================
-- 1. Project membership
-- ============================================================

alter table public.projects add column member_ids bigint[] not null default '{}';

create or replace function public.can_access_project(p_project_id bigint) returns boolean
    language sql stable security definer
    set search_path = ''
    as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and (public.is_admin() or public.current_sales_id() = any(p.member_ids))
  );
$$;

-- Only admins can change member_ids, even though members can update the
-- rest of a project's fields.
create or replace function public.protect_project_member_ids() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
begin
  if not public.is_admin() then
    new.member_ids := old.member_ids;
  end if;
  return new;
end;
$$;

create or replace trigger protect_project_member_ids_trigger
    before update on public.projects
    for each row execute function public.protect_project_member_ids();

drop policy "PM access select" on public.projects;
drop policy "PM access insert" on public.projects;
drop policy "PM access update" on public.projects;
create policy "Select member or admin" on public.projects for select to authenticated using (
    public.is_admin() or public.current_sales_id() = any(member_ids)
);
create policy "Admin create only" on public.projects for insert to authenticated with check (public.is_admin());
create policy "Update member or admin" on public.projects for update to authenticated using (
    public.is_admin() or public.current_sales_id() = any(member_ids)
) with check (
    public.is_admin() or public.current_sales_id() = any(member_ids)
);

drop policy "PM access select" on public.sprints;
drop policy "PM access insert" on public.sprints;
drop policy "PM access update" on public.sprints;
create policy "Project member or admin select" on public.sprints for select to authenticated using (public.can_access_project(project_id));
create policy "Project member or admin insert" on public.sprints for insert to authenticated with check (public.can_access_project(project_id));
create policy "Project member or admin update" on public.sprints for update to authenticated using (public.can_access_project(project_id)) with check (public.can_access_project(project_id));

drop policy "PM access select" on public.milestones;
drop policy "PM access insert" on public.milestones;
drop policy "PM access update" on public.milestones;
create policy "Project member or admin select" on public.milestones for select to authenticated using (public.can_access_project(project_id));
create policy "Project member or admin insert" on public.milestones for insert to authenticated with check (public.can_access_project(project_id));
create policy "Project member or admin update" on public.milestones for update to authenticated using (public.can_access_project(project_id)) with check (public.can_access_project(project_id));

drop policy "PM access select" on public.issues;
drop policy "PM access insert" on public.issues;
drop policy "PM access update" on public.issues;
create policy "Project member or admin select" on public.issues for select to authenticated using (public.can_access_project(project_id));
create policy "Project member or admin insert" on public.issues for insert to authenticated with check (public.can_access_project(project_id));
create policy "Project member or admin update" on public.issues for update to authenticated using (public.can_access_project(project_id)) with check (public.can_access_project(project_id));

drop policy "PM access select" on public.issue_notes;
drop policy "PM access insert" on public.issue_notes;
create policy "Project member or admin select" on public.issue_notes for select to authenticated using (
    exists (select 1 from public.issues i where i.id = issue_notes.issue_id and public.can_access_project(i.project_id))
);
create policy "Project member or admin insert" on public.issue_notes for insert to authenticated with check (
    exists (select 1 from public.issues i where i.id = issue_notes.issue_id and public.can_access_project(i.project_id))
);
-- issue_notes' "Update own or admin" policy is unchanged.

drop policy "PM access select" on public.issue_status_history;
drop policy "PM access insert" on public.issue_status_history;
create policy "Project member or admin select" on public.issue_status_history for select to authenticated using (public.can_access_project(project_id));
create policy "Project member or admin insert" on public.issue_status_history for insert to authenticated with check (public.can_access_project(project_id));

-- ============================================================
-- 2. Dedicated "accounts" role
-- ============================================================

alter table public.sales add column is_accounts boolean not null default false;

create or replace function public.is_accounts() returns boolean
    language plpgsql security definer
    set search_path = ''
    as $$
begin
  return exists (
    select 1 from public.sales where user_id = auth.uid() and is_accounts = true
  );
end;
$$;

drop policy "Admin only" on public.statement_imports;
create policy "Admin or accounts select" on public.statement_imports for select to authenticated using (public.is_admin() or public.is_accounts());
create policy "Admin or accounts insert" on public.statement_imports for insert to authenticated with check (public.is_admin() or public.is_accounts());
create policy "Admin or accounts update" on public.statement_imports for update to authenticated using (public.is_admin() or public.is_accounts()) with check (public.is_admin() or public.is_accounts());
create policy "Admin delete only" on public.statement_imports for delete to authenticated using (public.is_admin());

drop policy "Admin only" on public.transactions;
create policy "Admin or accounts select" on public.transactions for select to authenticated using (public.is_admin() or public.is_accounts());
create policy "Admin or accounts insert" on public.transactions for insert to authenticated with check (public.is_admin() or public.is_accounts());
create policy "Admin or accounts update" on public.transactions for update to authenticated using (public.is_admin() or public.is_accounts()) with check (public.is_admin() or public.is_accounts());
create policy "Admin delete only" on public.transactions for delete to authenticated using (public.is_admin());

drop policy "Admin only" on public.recurring_expenses;
create policy "Admin or accounts select" on public.recurring_expenses for select to authenticated using (public.is_admin() or public.is_accounts());
create policy "Admin or accounts insert" on public.recurring_expenses for insert to authenticated with check (public.is_admin() or public.is_accounts());
create policy "Admin or accounts update" on public.recurring_expenses for update to authenticated using (public.is_admin() or public.is_accounts()) with check (public.is_admin() or public.is_accounts());
create policy "Admin delete only" on public.recurring_expenses for delete to authenticated using (public.is_admin());

drop policy "Admin only" on public.people;
create policy "Admin or accounts select" on public.people for select to authenticated using (public.is_admin() or public.is_accounts());
create policy "Admin or accounts insert" on public.people for insert to authenticated with check (public.is_admin() or public.is_accounts());
create policy "Admin or accounts update" on public.people for update to authenticated using (public.is_admin() or public.is_accounts()) with check (public.is_admin() or public.is_accounts());
create policy "Admin delete only" on public.people for delete to authenticated using (public.is_admin());

drop policy "Admin only" on public.loans;
create policy "Admin or accounts select" on public.loans for select to authenticated using (public.is_admin() or public.is_accounts());
create policy "Admin or accounts insert" on public.loans for insert to authenticated with check (public.is_admin() or public.is_accounts());
create policy "Admin or accounts update" on public.loans for update to authenticated using (public.is_admin() or public.is_accounts()) with check (public.is_admin() or public.is_accounts());
create policy "Admin delete only" on public.loans for delete to authenticated using (public.is_admin());

drop policy "Admin only" on public.budgets;
create policy "Admin or accounts select" on public.budgets for select to authenticated using (public.is_admin() or public.is_accounts());
create policy "Admin or accounts insert" on public.budgets for insert to authenticated with check (public.is_admin() or public.is_accounts());
create policy "Admin or accounts update" on public.budgets for update to authenticated using (public.is_admin() or public.is_accounts()) with check (public.is_admin() or public.is_accounts());
create policy "Admin delete only" on public.budgets for delete to authenticated using (public.is_admin());
