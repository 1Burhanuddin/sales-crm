--
-- Data fix: the Mar-May statement import (see
-- 20260901020000_import_bank_statement_mar_may.sql, #56) was missing one
-- transaction due to a statementParser.ts column-boundary bug (fixed in
-- the same PR as this migration) -- a wide 5-digit debit amount's text
-- started 0.1pt short of the debit column's old boundary, landing it in
-- the (normally empty) cheque-number column instead and silently
-- dropping the whole row. This is exactly the Rs 15,000 balance gap
-- flagged at the time.
--
-- Real transaction, confirmed against the original PDF (page 1, serial
-- 12): 2026-03-23, debit Rs 15,000.00,
-- "UPI/608278781931/22:21:01/UPI/hatimmerchant777@ok", balance after
-- Rs 3,233.75.
--
-- Guarded with NOT EXISTS so this is safe to re-run.
--

insert into public.transactions (date, description, amount, balance_after, source, statement_import_id)
select
  '2026-03-23'::date,
  'UPI/608278781931/22:21:01/UPI/hatimmerchant777@ok',
  -15000,
  3233.75,
  'statement',
  si.id
from public.statement_imports si
where si.filename = 'XXXXXXXXXX0309_20260831185439084786.pdf'
and not exists (
  select 1 from public.transactions t
  where t.date = '2026-03-23'
    and t.description = 'UPI/608278781931/22:21:01/UPI/hatimmerchant777@ok'
    and abs(t.amount - (-15000)) < 0.01
);
