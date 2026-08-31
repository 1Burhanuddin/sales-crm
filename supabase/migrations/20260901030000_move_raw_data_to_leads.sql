--
-- Data cleanup: moves genuinely untouched raw contacts/companies into the
-- Leads funnel (status 'new'), same transformation as
-- BulkMoveToLeadsButton.tsx's contactToLead/companyToLead, just run once
-- against everything already sitting in the CRM instead of requiring a
-- manual per-page bulk-select.
--
-- Scope, deliberately conservative: "raw" means never used on a deal.
-- deals.company_id and contacts_company_id_fkey are both ON DELETE
-- CASCADE, so a naive "delete every company/contact" would silently wipe
-- out every deal in the pipeline too. Excluded from the move:
--   - any contact directly referenced by a deal's contact_ids array
--   - any contact whose company has its own deal (even if that specific
--     contact isn't on one yet -- a real client's staff stay put)
--   - any company with a deal of its own
--   - any company that still has a remaining contact after the contact
--     pass above (that contact was kept because IT has deal involvement,
--     so cascading the company delete onto it would be data loss)
--
-- Order matters: contacts are moved/deleted first, so the company pass
-- can check "zero remaining contacts" against already-cleaned-up state.
-- One-off DATA import, not a schema change -- not mirrored into
-- supabase/schemas/.
--

create temporary table _raw_contact_ids as
select c.id
from public.contacts c
where not exists (
    select 1 from public.deals d where c.id = any(d.contact_ids)
  )
  and (
    c.company_id is null
    or not exists (select 1 from public.deals d2 where d2.company_id = c.company_id)
  );

insert into public.leads (first_name, last_name, title, company_name, email, phone, source, status, sales_id)
select
  c.first_name,
  c.last_name,
  c.title,
  co.name,
  c.email_jsonb -> 0 ->> 'email',
  c.phone_jsonb -> 0 ->> 'number',
  'moved-from-contacts',
  'new',
  coalesce(c.sales_id, 1)
from public.contacts c
join _raw_contact_ids rc on rc.id = c.id
left join public.companies co on co.id = c.company_id;

delete from public.contacts where id in (select id from _raw_contact_ids);

create temporary table _raw_company_ids as
select co.id
from public.companies co
where not exists (select 1 from public.deals d where d.company_id = co.id)
  and not exists (select 1 from public.contacts c where c.company_id = co.id);

insert into public.leads (company_name, phone, source, status, sales_id)
select co.name, co.phone_number, 'moved-from-companies', 'new', coalesce(co.sales_id, 1)
from public.companies co
join _raw_company_ids rci on rci.id = co.id;

delete from public.companies where id in (select id from _raw_company_ids);

drop table _raw_contact_ids;
drop table _raw_company_ids;
