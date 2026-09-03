--
-- Triggers
-- This file declares all triggers.
--

-- Auto-populate sales_id from current auth user on insert
create or replace trigger set_company_sales_id_trigger
    before insert on public.companies
    for each row execute function public.set_sales_id_default();

create or replace trigger set_contact_sales_id_trigger
    before insert on public.contacts
    for each row execute function public.set_sales_id_default();

create or replace trigger set_contact_notes_sales_id_trigger
    before insert on public.contact_notes
    for each row execute function public.set_sales_id_default();

create or replace trigger set_deal_sales_id_trigger
    before insert on public.deals
    for each row execute function public.set_sales_id_default();

create or replace trigger set_deal_notes_sales_id_trigger
    before insert on public.deal_notes
    for each row execute function public.set_sales_id_default();

create or replace trigger set_task_sales_id_trigger
    before insert on public.tasks
    for each row execute function public.set_sales_id_default();

create or replace trigger generate_employee_code_trigger
    before insert on public.employees
    for each row execute function public.generate_employee_code();

create or replace trigger set_project_sales_id_trigger
    before insert on public.projects
    for each row execute function public.set_sales_id_default();

create or replace trigger set_sprint_sales_id_trigger
    before insert on public.sprints
    for each row execute function public.set_sales_id_default();

create or replace trigger set_milestone_sales_id_trigger
    before insert on public.milestones
    for each row execute function public.set_sales_id_default();

create or replace trigger set_issue_sales_id_trigger
    before insert on public.issues
    for each row execute function public.set_sales_id_default();

create or replace trigger set_issue_notes_sales_id_trigger
    before insert on public.issue_notes
    for each row execute function public.set_sales_id_default();

create or replace trigger log_issue_status_change_trigger
    after insert or update on public.issues
    for each row execute function public.log_issue_status_change();

create or replace trigger set_statement_import_sales_id_trigger
    before insert on public.statement_imports
    for each row execute function public.set_sales_id_default();

create or replace trigger set_transaction_sales_id_trigger
    before insert on public.transactions
    for each row execute function public.set_sales_id_default();

-- Auto-fetch company logo from website favicon on save
create or replace trigger company_saved
    before insert or update on public.companies
    for each row execute function public.handle_company_saved();

-- Lowercase contact emails before insert or update (must run before contact_saved)
create or replace trigger "10_lowercase_contact_emails"
    before insert or update on public.contacts
    for each row execute function public.lowercase_email_jsonb();

-- Auto-fetch contact avatar from email on save (runs after lowercase_contact_emails)
create or replace trigger "20_contact_saved"
    before insert or update on public.contacts
    for each row execute function public.handle_contact_saved();

-- Update contact.last_seen when a contact note is created
create or replace trigger on_public_contact_notes_created_or_updated
    after insert on public.contact_notes
    for each row execute function public.handle_contact_note_created_or_updated();

-- Cleanup storage attachments when contact notes are updated or deleted
create or replace trigger on_contact_notes_attachments_updated_delete_note_attachments
    after update on public.contact_notes
    for each row
    when (old.attachments is distinct from new.attachments)
    execute function public.cleanup_note_attachments();

create or replace trigger on_contact_notes_deleted_delete_note_attachments
    after delete on public.contact_notes
    for each row execute function public.cleanup_note_attachments();

-- Cleanup storage attachments when deal notes are updated or deleted
create or replace trigger on_deal_notes_attachments_updated_delete_note_attachments
    after update on public.deal_notes
    for each row
    when (old.attachments is distinct from new.attachments)
    execute function public.cleanup_note_attachments();

create or replace trigger on_deal_notes_deleted_delete_note_attachments
    after delete on public.deal_notes
    for each row execute function public.cleanup_note_attachments();

-- Cleanup storage attachments when issue notes are updated or deleted
create or replace trigger on_issue_notes_attachments_updated_delete_note_attachments
    after update on public.issue_notes
    for each row
    when (old.attachments is distinct from new.attachments)
    execute function public.cleanup_note_attachments();

create or replace trigger on_issue_notes_deleted_delete_note_attachments
    after delete on public.issue_notes
    for each row execute function public.cleanup_note_attachments();

-- HRMS: compute payslip gross/net pay before every insert/update
create or replace trigger calculate_payslip_totals_trigger
    before insert or update on public.payslips
    for each row execute function public.calculate_payslip_totals();

create or replace trigger set_personal_note_sales_id_trigger
    before insert on public.personal_notes
    for each row execute function public.set_sales_id_default();

create or replace trigger snapshot_personal_note_version_trigger
    before update on public.personal_notes
    for each row execute function public.snapshot_personal_note_version();

create or replace trigger set_lead_sales_id_trigger
    before insert on public.leads
    for each row execute function public.set_sales_id_default();

create or replace trigger set_lead_activities_sales_id_trigger
    before insert on public.lead_activities
    for each row execute function public.set_sales_id_default();

-- Auth triggers: sync auth.users to public.sales
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create or replace trigger on_auth_user_updated
    after update on auth.users
    for each row execute function public.handle_update_user();
