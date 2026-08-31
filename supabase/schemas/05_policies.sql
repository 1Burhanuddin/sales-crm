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
alter table public.projects enable row level security;
alter table public.issues enable row level security;
alter table public.issue_notes enable row level security;
alter table public.employees enable row level security;
alter table public.leave_requests enable row level security;
alter table public.attendance_records enable row level security;
alter table public.salary_structures enable row level security;
alter table public.payslips enable row level security;
alter table public.statement_imports enable row level security;
alter table public.transactions enable row level security;
alter table public.personal_notes enable row level security;
alter table public.personal_note_versions enable row level security;
alter table public.personal_note_shares enable row level security;
alter table public.leads enable row level security;

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
create policy "Block developer create" on public.contact_notes for insert to authenticated with check (public.is_admin() or not public.is_developer());
create policy "Update own or admin" on public.contact_notes for update to authenticated using (public.is_admin() or exists (select 1 from public.contacts c where c.id = contact_notes.contact_id and c.sales_id = public.current_sales_id()));
create policy "Admin delete only" on public.contact_notes for delete to authenticated using (public.is_admin());

-- Deals (visible/editable by their owning sales rep, or any admin)
create policy "Select own or admin" on public.deals for select to authenticated using (public.is_admin() or sales_id = public.current_sales_id());
create policy "Block developer create" on public.deals for insert to authenticated with check (public.is_admin() or not public.is_developer());
create policy "Update own or admin" on public.deals for update to authenticated using (public.is_admin() or sales_id = public.current_sales_id()) with check (public.is_admin() or sales_id = public.current_sales_id());
create policy "Admin delete only" on public.deals for delete to authenticated using (public.is_admin());

-- Deal Notes (follow the parent deal's visibility)
create policy "Select own or admin" on public.deal_notes for select to authenticated using (public.is_admin() or exists (select 1 from public.deals d where d.id = deal_notes.deal_id and d.sales_id = public.current_sales_id()));
create policy "Block developer create" on public.deal_notes for insert to authenticated with check (public.is_admin() or not public.is_developer());
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
create policy "Block developer create" on public.tasks for insert to authenticated with check (public.is_admin() or not public.is_developer());
create policy "Update own or admin" on public.tasks for update to authenticated using (public.is_admin() or exists (select 1 from public.contacts c where c.id = tasks.contact_id and c.sales_id = public.current_sales_id()));
create policy "Admin delete only" on public.tasks for delete to authenticated using (public.is_admin());

-- Configuration (admin-only for writes)
create policy "Enable read for authenticated" on public.configuration for select to authenticated using (true);
create policy "Enable insert for admins" on public.configuration for insert to authenticated with check (public.is_admin());
create policy "Enable update for admins" on public.configuration for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Favicons excluded domains
create policy "Enable access for authenticated users only" on public.favicons_excluded_domains to authenticated using (true) with check (true);

-- Projects (visible/editable by anyone with PM access: admin or developer)
create policy "PM access select" on public.projects for select to authenticated using (public.has_pm_access());
create policy "PM access insert" on public.projects for insert to authenticated with check (public.has_pm_access());
create policy "PM access update" on public.projects for update to authenticated using (public.has_pm_access()) with check (public.has_pm_access());
create policy "Admin delete only" on public.projects for delete to authenticated using (public.is_admin());

-- Issues (visible/editable by anyone with PM access: admin or developer)
create policy "PM access select" on public.issues for select to authenticated using (public.has_pm_access());
create policy "PM access insert" on public.issues for insert to authenticated with check (public.has_pm_access());
create policy "PM access update" on public.issues for update to authenticated using (public.has_pm_access()) with check (public.has_pm_access());
create policy "Admin delete only" on public.issues for delete to authenticated using (public.is_admin());

-- Issue Notes (visible/editable by anyone with PM access: admin or developer)
create policy "PM access select" on public.issue_notes for select to authenticated using (public.has_pm_access());
create policy "PM access insert" on public.issue_notes for insert to authenticated with check (public.has_pm_access());
create policy "PM access update" on public.issue_notes for update to authenticated using (public.has_pm_access()) with check (public.has_pm_access());
create policy "Admin delete only" on public.issue_notes for delete to authenticated using (public.is_admin());

-- Employees (visible/editable by the linked sales user, or any admin; only admins create/delete)
create policy "Select own or admin" on public.employees for select to authenticated using (public.is_admin() or sales_id = public.current_sales_id());
create policy "Admin create only" on public.employees for insert to authenticated with check (public.is_admin());
create policy "Update own or admin" on public.employees for update to authenticated using (public.is_admin() or sales_id = public.current_sales_id()) with check (public.is_admin() or sales_id = public.current_sales_id());
create policy "Admin delete only" on public.employees for delete to authenticated using (public.is_admin());

-- Leave requests (join-through to employees.sales_id): self can submit/cancel
-- own pending requests but cannot self-approve; admin can approve/reject any.
create policy "Select own or admin" on public.leave_requests for select to authenticated using (public.is_admin() or exists (
    select 1 from public.employees e where e.id = leave_requests.employee_id and e.sales_id = public.current_sales_id()
));
create policy "Insert own pending or admin" on public.leave_requests for insert to authenticated with check (
    public.is_admin()
    or (
        exists (select 1 from public.employees e where e.id = leave_requests.employee_id and e.sales_id = public.current_sales_id())
        and status = 'pending' and approved_by is null and approved_at is null
    )
);
create policy "Update own pending or admin" on public.leave_requests for update to authenticated using (
    public.is_admin()
    or (
        exists (select 1 from public.employees e where e.id = leave_requests.employee_id and e.sales_id = public.current_sales_id())
        and status = 'pending'
    )
) with check (
    public.is_admin()
    or (status in ('pending', 'cancelled') and approved_by is null and approved_at is null)
);
create policy "Admin delete only" on public.leave_requests for delete to authenticated using (public.is_admin());

-- Attendance records (join-through to employees.sales_id): no approval
-- workflow in v1, self can log/edit own rows freely.
create policy "Select own or admin" on public.attendance_records for select to authenticated using (public.is_admin() or exists (
    select 1 from public.employees e where e.id = attendance_records.employee_id and e.sales_id = public.current_sales_id()
));
create policy "Insert own or admin" on public.attendance_records for insert to authenticated with check (public.is_admin() or exists (
    select 1 from public.employees e where e.id = attendance_records.employee_id and e.sales_id = public.current_sales_id()
));
create policy "Update own or admin" on public.attendance_records for update to authenticated using (public.is_admin() or exists (
    select 1 from public.employees e where e.id = attendance_records.employee_id and e.sales_id = public.current_sales_id()
));
create policy "Admin delete only" on public.attendance_records for delete to authenticated using (public.is_admin());

-- Payroll (join-through to employees.sales_id): fully admin-managed writes,
-- employees get read-only access to their own rows.
create policy "Select own or admin" on public.salary_structures for select to authenticated using (public.is_admin() or exists (
    select 1 from public.employees e where e.id = salary_structures.employee_id and e.sales_id = public.current_sales_id()
));
create policy "Admin write only" on public.salary_structures for insert to authenticated with check (public.is_admin());
create policy "Admin update only" on public.salary_structures for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin delete only" on public.salary_structures for delete to authenticated using (public.is_admin());

create policy "Select own or admin" on public.payslips for select to authenticated using (public.is_admin() or exists (
    select 1 from public.employees e where e.id = payslips.employee_id and e.sales_id = public.current_sales_id()
));
create policy "Admin write only" on public.payslips for insert to authenticated with check (public.is_admin());
create policy "Admin update only" on public.payslips for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin delete only" on public.payslips for delete to authenticated using (public.is_admin());

-- Accounts (fully admin-only, no self-service scoping)
create policy "Admin only" on public.statement_imports for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin only" on public.transactions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Personal notes (self-owned). Delete does NOT require admin, unlike every
-- other table above — private scratch content, not shared business/HR data.
create policy "Select own, shared, or admin" on public.personal_notes for select to authenticated using (public.is_admin() or sales_id = public.current_sales_id() or exists (
    select 1 from public.personal_note_shares ps where ps.note_id = personal_notes.id and ps.shared_with_sales_id = public.current_sales_id()
));
create policy "Insert own or admin" on public.personal_notes for insert to authenticated with check (public.is_admin() or sales_id = public.current_sales_id());
create policy "Update own or admin" on public.personal_notes for update to authenticated using (public.is_admin() or sales_id = public.current_sales_id()) with check (public.is_admin() or sales_id = public.current_sales_id());
create policy "Delete own or admin" on public.personal_notes for delete to authenticated using (public.is_admin() or sales_id = public.current_sales_id());

-- Personal note version history (join-through, immutable — no update policy)
create policy "Select own or admin" on public.personal_note_versions for select to authenticated using (public.is_admin() or exists (
    select 1 from public.personal_notes pn where pn.id = personal_note_versions.note_id and pn.sales_id = public.current_sales_id()
));
create policy "Insert own or admin" on public.personal_note_versions for insert to authenticated with check (public.is_admin() or exists (
    select 1 from public.personal_notes pn where pn.id = note_id and pn.sales_id = public.current_sales_id()
));
create policy "Delete own or admin" on public.personal_note_versions for delete to authenticated using (public.is_admin() or exists (
    select 1 from public.personal_notes pn where pn.id = personal_note_versions.note_id and pn.sales_id = public.current_sales_id()
));

-- Personal note sharing: owner/admin manage shares, recipient can see their
-- own share row. Read-only for the recipient (no update/delete grant on
-- personal_notes itself — see the "Select own, shared, or admin" policy).
-- Cross-table checks go through owns_personal_note() (SECURITY DEFINER),
-- not a raw subquery against personal_notes -- personal_notes' own select
-- policy queries personal_note_shares directly, so a raw subquery here
-- would create a mutual RLS cross-reference (infinite recursion). See
-- 20260831170000_fix_personal_notes_rls_recursion.sql.
create policy "Owner, recipient, or admin can view a share" on public.personal_note_shares for select to authenticated using (
    public.is_admin()
    or shared_with_sales_id = public.current_sales_id()
    or public.owns_personal_note(note_id)
);
create policy "Owner or admin manages shares" on public.personal_note_shares for insert to authenticated with check (
    public.is_admin() or public.owns_personal_note(note_id)
);
create policy "Owner or admin removes shares" on public.personal_note_shares for delete to authenticated using (
    public.is_admin() or public.owns_personal_note(note_id)
);

-- Leads (visible/editable by their owner OR the rep they're assigned to,
-- or any admin -- self-service like companies/contacts/deals, not
-- admin-only, since any rep should be able to work leads assigned to them)
create policy "Select own, assignee, or admin" on public.leads for select to authenticated using (
    public.is_admin() or sales_id = public.current_sales_id() or assignee_id = public.current_sales_id()
);
create policy "Insert own or admin" on public.leads for insert to authenticated with check (
    public.is_admin() or sales_id = public.current_sales_id()
);
create policy "Update own, assignee, or admin" on public.leads for update to authenticated using (
    public.is_admin() or sales_id = public.current_sales_id() or assignee_id = public.current_sales_id()
) with check (
    public.is_admin() or sales_id = public.current_sales_id() or assignee_id = public.current_sales_id()
);
create policy "Admin delete only" on public.leads for delete to authenticated using (public.is_admin());
