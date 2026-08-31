--
-- Data import: the HRMS module (employees/leave/attendance/payroll) has
-- been live for a while, but no employees table rows were ever created for
-- the actual team -- "Users" (public.sales, who can log in) and
-- "Employees" (public.employees, HR records: department, designation,
-- leave balance, payroll) are intentionally separate tables, linked by
-- employees.sales_id, but a sales row doesn't auto-create an employee row.
-- That's why the Employees list has been empty: nobody's ever been added
-- there. This links one employee record per existing sales account.
--
-- Department/designation intentionally left blank rather than guessed --
-- real HR details for real people, fill in via the Employee edit form.
-- One-off DATA import, not a schema change -- not mirrored into
-- supabase/schemas/.
--

insert into public.employees (sales_id, first_name, last_name, email, status)
select id, first_name, last_name, email, 'active'
from public.sales
where id not in (select sales_id from public.employees where sales_id is not null);
