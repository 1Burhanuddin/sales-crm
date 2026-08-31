--
-- Employee module improvements:
-- 1. employee_code auto-generates (EMP-0001, EMP-0002, ...) instead of
--    being a manually-typed field on the create form.
-- 2. New columns for personal/bank details, past employment, and
--    background -- captured on the employee record rather than a full
--    Frappe-HRMS-style set of child tables (multiple bank accounts, full
--    work history), which is a much bigger undertaking than this app
--    needs right now. Single most-recent previous employer + one bank
--    account is enough for this team's size; can grow into real child
--    tables later if that stops being true.
--

alter table public.employees
    add column date_of_birth date,
    add column address text,
    add column emergency_contact_name text,
    add column emergency_contact_phone text,
    add column bank_name text,
    add column bank_account_name text,
    add column bank_account_number text,
    add column bank_ifsc text,
    add column previous_employer text,
    add column previous_designation text,
    add column total_experience_years numeric(4,1),
    add column qualification text,
    add column background text;

create sequence if not exists public.employee_code_seq start 1;

create or replace function public.generate_employee_code() returns trigger
    language plpgsql security definer
    set search_path to ''
    as $$
begin
  if new.employee_code is null then
    new.employee_code := 'EMP-' || lpad(nextval('public.employee_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger generate_employee_code_trigger
    before insert on public.employees
    for each row execute function public.generate_employee_code();

grant usage on sequence public.employee_code_seq to anon, authenticated, service_role;
grant all on function public.generate_employee_code() to anon, authenticated, service_role;
