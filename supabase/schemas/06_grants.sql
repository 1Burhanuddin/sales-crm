--
-- Grants
-- This file declares all grants and default privileges for the public schema.
--

-- Schema usage
grant usage on schema public to postgres;
grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant usage on schema public to service_role;

-- Function grants
grant all on function public.cleanup_note_attachments() to anon;
grant all on function public.cleanup_note_attachments() to authenticated;
grant all on function public.cleanup_note_attachments() to service_role;

grant all on function public.get_avatar_for_email(text) to anon;
grant all on function public.get_avatar_for_email(text) to authenticated;
grant all on function public.get_avatar_for_email(text) to service_role;

grant all on function public.get_domain_favicon(text) to anon;
grant all on function public.get_domain_favicon(text) to authenticated;
grant all on function public.get_domain_favicon(text) to service_role;

grant all on function public.get_note_attachments_function_url() to anon;
grant all on function public.get_note_attachments_function_url() to authenticated;
grant all on function public.get_note_attachments_function_url() to service_role;

revoke all on function public.get_user_id_by_email(text) from public;
grant all on function public.get_user_id_by_email(text) to service_role;

grant all on function public.handle_company_saved() to anon;
grant all on function public.handle_company_saved() to authenticated;
grant all on function public.handle_company_saved() to service_role;

grant all on function public.handle_contact_note_created_or_updated() to anon;
grant all on function public.handle_contact_note_created_or_updated() to authenticated;
grant all on function public.handle_contact_note_created_or_updated() to service_role;

grant all on function public.handle_contact_saved() to anon;
grant all on function public.handle_contact_saved() to authenticated;
grant all on function public.handle_contact_saved() to service_role;

grant all on function public.handle_new_user() to anon;
grant all on function public.handle_new_user() to authenticated;
grant all on function public.handle_new_user() to service_role;

grant all on function public.handle_update_user() to anon;
grant all on function public.handle_update_user() to authenticated;
grant all on function public.handle_update_user() to service_role;

grant all on function public.is_admin() to anon;
grant all on function public.is_admin() to authenticated;
grant all on function public.is_admin() to service_role;

grant all on function public.current_sales_id() to anon;
grant all on function public.current_sales_id() to authenticated;
grant all on function public.current_sales_id() to service_role;

grant all on function public.owns_personal_note(bigint) to anon;
grant all on function public.owns_personal_note(bigint) to authenticated;
grant all on function public.owns_personal_note(bigint) to service_role;

grant all on function public.is_developer() to anon;
grant all on function public.is_developer() to authenticated;
grant all on function public.is_developer() to service_role;

grant all on function public.has_pm_access() to anon;
grant all on function public.has_pm_access() to authenticated;
grant all on function public.has_pm_access() to service_role;

grant all on function public.generate_employee_code() to anon;
grant all on function public.generate_employee_code() to authenticated;
grant all on function public.generate_employee_code() to service_role;

grant all on function public.calculate_payslip_totals() to anon;
grant all on function public.calculate_payslip_totals() to authenticated;
grant all on function public.calculate_payslip_totals() to service_role;

grant all on function public.snapshot_personal_note_version() to anon;
grant all on function public.snapshot_personal_note_version() to authenticated;
grant all on function public.snapshot_personal_note_version() to service_role;

grant all on function public.lowercase_email_jsonb() to anon;
grant all on function public.lowercase_email_jsonb() to authenticated;
grant all on function public.lowercase_email_jsonb() to service_role;

grant all on function public.merge_contacts(bigint, bigint) to anon;
grant all on function public.merge_contacts(bigint, bigint) to authenticated;
grant all on function public.merge_contacts(bigint, bigint) to service_role;

grant all on function public.set_sales_id_default() to anon;
grant all on function public.set_sales_id_default() to authenticated;
grant all on function public.set_sales_id_default() to service_role;

-- Table grants
grant all on table public.companies to anon;
grant all on table public.companies to authenticated;
grant all on table public.companies to service_role;

grant all on table public.contacts to anon;
grant all on table public.contacts to authenticated;
grant all on table public.contacts to service_role;

grant all on table public.contact_notes to anon;
grant all on table public.contact_notes to authenticated;
grant all on table public.contact_notes to service_role;

grant all on table public.deals to anon;
grant all on table public.deals to authenticated;
grant all on table public.deals to service_role;

grant all on table public.deal_notes to anon;
grant all on table public.deal_notes to authenticated;
grant all on table public.deal_notes to service_role;

grant all on table public.sales to anon;
grant all on table public.sales to authenticated;
grant all on table public.sales to service_role;

grant all on table public.tags to anon;
grant all on table public.tags to authenticated;
grant all on table public.tags to service_role;

grant all on table public.tasks to anon;
grant all on table public.tasks to authenticated;
grant all on table public.tasks to service_role;

grant all on table public.configuration to anon;
grant all on table public.configuration to authenticated;
grant all on table public.configuration to service_role;

grant all on table public.favicons_excluded_domains to anon;
grant all on table public.favicons_excluded_domains to authenticated;
grant all on table public.favicons_excluded_domains to service_role;

grant all on table public.projects to anon;
grant all on table public.projects to authenticated;
grant all on table public.projects to service_role;

grant all on table public.issues to anon;
grant all on table public.issues to authenticated;
grant all on table public.issues to service_role;

grant all on table public.sprints to anon;
grant all on table public.sprints to authenticated;
grant all on table public.sprints to service_role;

grant all on table public.milestones to anon;
grant all on table public.milestones to authenticated;
grant all on table public.milestones to service_role;

grant all on table public.issue_notes to anon;
grant all on table public.issue_notes to authenticated;
grant all on table public.issue_notes to service_role;

grant all on table public.issue_status_history to anon;
grant all on table public.issue_status_history to authenticated;
grant all on table public.issue_status_history to service_role;

grant all on table public.employees to anon;
grant all on table public.employees to authenticated;
grant all on table public.employees to service_role;

grant all on table public.leave_requests to anon;
grant all on table public.leave_requests to authenticated;
grant all on table public.leave_requests to service_role;

grant all on table public.attendance_records to anon;
grant all on table public.attendance_records to authenticated;
grant all on table public.attendance_records to service_role;

grant all on table public.salary_structures to anon;
grant all on table public.salary_structures to authenticated;
grant all on table public.salary_structures to service_role;

grant all on table public.payslips to anon;
grant all on table public.payslips to authenticated;
grant all on table public.payslips to service_role;

grant all on table public.statement_imports to anon;
grant all on table public.statement_imports to authenticated;
grant all on table public.statement_imports to service_role;

grant all on table public.transactions to anon;
grant all on table public.transactions to authenticated;
grant all on table public.transactions to service_role;

grant all on table public.recurring_expenses to anon;
grant all on table public.recurring_expenses to authenticated;
grant all on table public.recurring_expenses to service_role;

grant all on table public.people to anon;
grant all on table public.people to authenticated;
grant all on table public.people to service_role;

grant all on table public.loans to anon;
grant all on table public.loans to authenticated;
grant all on table public.loans to service_role;

grant all on table public.budgets to anon;
grant all on table public.budgets to authenticated;
grant all on table public.budgets to service_role;

grant all on table public.personal_notes to anon;
grant all on table public.personal_notes to authenticated;
grant all on table public.personal_notes to service_role;

grant all on table public.personal_note_versions to anon;
grant all on table public.personal_note_versions to authenticated;
grant all on table public.personal_note_versions to service_role;

grant all on table public.personal_note_shares to anon;
grant all on table public.personal_note_shares to authenticated;
grant all on table public.personal_note_shares to service_role;

grant all on table public.leads to anon;
grant all on table public.leads to authenticated;
grant all on table public.leads to service_role;

grant all on table public.lead_activities to anon;
grant all on table public.lead_activities to authenticated;
grant all on table public.lead_activities to service_role;

-- View grants
grant all on table public.activity_log to anon;
grant all on table public.activity_log to authenticated;
grant all on table public.activity_log to service_role;

grant all on table public.companies_summary to anon;
grant all on table public.companies_summary to authenticated;
grant all on table public.companies_summary to service_role;

grant all on table public.contacts_summary to anon;
grant all on table public.contacts_summary to authenticated;
grant all on table public.contacts_summary to service_role;

grant all on table public.init_state to anon;
grant all on table public.init_state to authenticated;
grant all on table public.init_state to service_role;

grant all on table public.leads_summary to anon;
grant all on table public.leads_summary to authenticated;
grant all on table public.leads_summary to service_role;

grant all on table public.projects_summary to anon;
grant all on table public.projects_summary to authenticated;
grant all on table public.projects_summary to service_role;

-- Sequence grants
grant usage on sequence public.employee_code_seq to anon;
grant usage on sequence public.employee_code_seq to authenticated;
grant usage on sequence public.employee_code_seq to service_role;

grant all on sequence public.companies_id_seq to anon;
grant all on sequence public.companies_id_seq to authenticated;
grant all on sequence public.companies_id_seq to service_role;

grant all on sequence public."contactNotes_id_seq" to anon;
grant all on sequence public."contactNotes_id_seq" to authenticated;
grant all on sequence public."contactNotes_id_seq" to service_role;

grant all on sequence public.contacts_id_seq to anon;
grant all on sequence public.contacts_id_seq to authenticated;
grant all on sequence public.contacts_id_seq to service_role;

grant all on sequence public."dealNotes_id_seq" to anon;
grant all on sequence public."dealNotes_id_seq" to authenticated;
grant all on sequence public."dealNotes_id_seq" to service_role;

grant all on sequence public.deals_id_seq to anon;
grant all on sequence public.deals_id_seq to authenticated;
grant all on sequence public.deals_id_seq to service_role;

grant all on sequence public.favicons_excluded_domains_id_seq to anon;
grant all on sequence public.favicons_excluded_domains_id_seq to authenticated;
grant all on sequence public.favicons_excluded_domains_id_seq to service_role;

grant all on sequence public.sales_id_seq to anon;
grant all on sequence public.sales_id_seq to authenticated;
grant all on sequence public.sales_id_seq to service_role;

grant all on sequence public.tags_id_seq to anon;
grant all on sequence public.tags_id_seq to authenticated;
grant all on sequence public.tags_id_seq to service_role;

grant all on sequence public.tasks_id_seq to anon;
grant all on sequence public.tasks_id_seq to authenticated;
grant all on sequence public.tasks_id_seq to service_role;

grant all on sequence public.projects_id_seq to anon;
grant all on sequence public.projects_id_seq to authenticated;
grant all on sequence public.projects_id_seq to service_role;

grant all on sequence public.issues_id_seq to anon;
grant all on sequence public.issues_id_seq to authenticated;
grant all on sequence public.issues_id_seq to service_role;

grant all on sequence public.sprints_id_seq to anon;
grant all on sequence public.sprints_id_seq to authenticated;
grant all on sequence public.sprints_id_seq to service_role;

grant all on sequence public.milestones_id_seq to anon;
grant all on sequence public.milestones_id_seq to authenticated;
grant all on sequence public.milestones_id_seq to service_role;

grant all on sequence public.issue_notes_id_seq to anon;
grant all on sequence public.issue_notes_id_seq to authenticated;
grant all on sequence public.issue_notes_id_seq to service_role;

grant all on sequence public.issue_status_history_id_seq to anon;
grant all on sequence public.issue_status_history_id_seq to authenticated;
grant all on sequence public.issue_status_history_id_seq to service_role;

grant all on sequence public.employees_id_seq to anon;
grant all on sequence public.employees_id_seq to authenticated;
grant all on sequence public.employees_id_seq to service_role;

grant all on sequence public.leave_requests_id_seq to anon;
grant all on sequence public.leave_requests_id_seq to authenticated;
grant all on sequence public.leave_requests_id_seq to service_role;

grant all on sequence public.attendance_records_id_seq to anon;
grant all on sequence public.attendance_records_id_seq to authenticated;
grant all on sequence public.attendance_records_id_seq to service_role;

grant all on sequence public.salary_structures_id_seq to anon;
grant all on sequence public.salary_structures_id_seq to authenticated;
grant all on sequence public.salary_structures_id_seq to service_role;

grant all on sequence public.payslips_id_seq to anon;
grant all on sequence public.payslips_id_seq to authenticated;
grant all on sequence public.payslips_id_seq to service_role;

grant all on sequence public.statement_imports_id_seq to anon;
grant all on sequence public.statement_imports_id_seq to authenticated;
grant all on sequence public.statement_imports_id_seq to service_role;

grant all on sequence public.transactions_id_seq to anon;
grant all on sequence public.transactions_id_seq to authenticated;
grant all on sequence public.transactions_id_seq to service_role;

grant all on sequence public.recurring_expenses_id_seq to anon;
grant all on sequence public.recurring_expenses_id_seq to authenticated;
grant all on sequence public.recurring_expenses_id_seq to service_role;

grant all on sequence public.people_id_seq to anon;
grant all on sequence public.people_id_seq to authenticated;
grant all on sequence public.people_id_seq to service_role;

grant all on sequence public.loans_id_seq to anon;
grant all on sequence public.loans_id_seq to authenticated;
grant all on sequence public.loans_id_seq to service_role;

grant all on sequence public.budgets_id_seq to anon;
grant all on sequence public.budgets_id_seq to authenticated;
grant all on sequence public.budgets_id_seq to service_role;

grant all on sequence public.personal_notes_id_seq to anon;
grant all on sequence public.personal_notes_id_seq to authenticated;
grant all on sequence public.personal_notes_id_seq to service_role;

grant all on sequence public.personal_note_versions_id_seq to anon;
grant all on sequence public.personal_note_versions_id_seq to authenticated;
grant all on sequence public.personal_note_versions_id_seq to service_role;

grant all on sequence public.personal_note_shares_id_seq to anon;
grant all on sequence public.personal_note_shares_id_seq to authenticated;
grant all on sequence public.personal_note_shares_id_seq to service_role;

grant all on sequence public.leads_id_seq to anon;
grant all on sequence public.leads_id_seq to authenticated;
grant all on sequence public.leads_id_seq to service_role;

grant all on sequence public.lead_activities_id_seq to anon;
grant all on sequence public.lead_activities_id_seq to authenticated;
grant all on sequence public.lead_activities_id_seq to service_role;

-- Default privileges
alter default privileges for role postgres in schema public grant all on sequences to postgres;
alter default privileges for role postgres in schema public grant all on sequences to anon;
alter default privileges for role postgres in schema public grant all on sequences to authenticated;
alter default privileges for role postgres in schema public grant all on sequences to service_role;

alter default privileges for role postgres in schema public grant all on functions to postgres;
alter default privileges for role postgres in schema public grant all on functions to anon;
alter default privileges for role postgres in schema public grant all on functions to authenticated;
alter default privileges for role postgres in schema public grant all on functions to service_role;

alter default privileges for role postgres in schema public grant all on tables to postgres;
alter default privileges for role postgres in schema public grant all on tables to anon;
alter default privileges for role postgres in schema public grant all on tables to authenticated;
alter default privileges for role postgres in schema public grant all on tables to service_role;
