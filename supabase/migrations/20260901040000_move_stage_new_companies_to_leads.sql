--
-- Follow-up to 20260901030000: that pass only caught companies/contacts
-- with zero deals, which turned out to be almost nothing (2 of 262
-- companies) -- the earlier Rajkot leads import (see
-- 20260825*_sales_scoped_visibility era) created one deal per company at
-- import time regardless of whether a rep ever looked at it, so "has a
-- deal" didn't actually mean "processed" for this dataset.
--
-- Refined rule: a company is still raw if every deal it has is sitting
-- in the pipeline's first stage ('new') -- i.e. nobody has moved it
-- since import. A company with even one deal that's progressed past
-- 'new' (including to 'not-interested' -- a rep did look at it) stays
-- put. Deleting the company cascades its 'new' deal(s) away too
-- (deals_company_id_fkey on delete cascade) -- that's fine here since,
-- by definition, those deals were never worked.
--
-- No contacts exist in this dataset any more (0 left after the prior
-- pass), so the "don't orphan a deal-linked contact" concern from that
-- migration doesn't apply this round.
--
-- Carries the company's description (holds "Category: X" from the
-- original import) into the lead's notes, so that context isn't lost.
-- One-off DATA import, not a schema change -- not mirrored into
-- supabase/schemas/.
--

create temporary table _stage_new_company_ids as
select co.id
from public.companies co
where exists (select 1 from public.deals d where d.company_id = co.id)
  and not exists (
    select 1 from public.deals d2
    where d2.company_id = co.id and d2.stage <> 'new'
  );

insert into public.leads (company_name, phone, notes, source, status, sales_id)
select co.name, co.phone_number, co.description, 'moved-from-companies', 'new', coalesce(co.sales_id, 1)
from public.companies co
join _stage_new_company_ids sc on sc.id = co.id;

delete from public.companies where id in (select id from _stage_new_company_ids);

drop table _stage_new_company_ids;
