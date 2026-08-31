--
-- Data update: log Munira Bhabarawala's real joining date and last week's
-- leave. Looked up by email rather than a hardcoded id, matching the seed
-- migration's pattern.
--

update public.employees
set date_of_joining = '2026-07-25'
where sales_id = (select id from public.sales where email = 'munira.bhabarawala.quixsyn@gmail.com');

insert into public.leave_requests (employee_id, leave_type, from_date, to_date, status, approved_by, approved_at)
select
    e.id,
    'annual',
    '2026-08-24',
    '2026-08-28',
    'approved',
    (select id from public.sales where administrator = true order by id limit 1),
    '2026-08-23T10:00:00+05:30'
from public.employees e
where e.sales_id = (select id from public.sales where email = 'munira.bhabarawala.quixsyn@gmail.com');
