-- Personal vs. business, one column, not a separate app/DB -- see
-- docs/accounts-roadmap.md. Every transaction (manual entry or statement
-- import) gets tagged so reports/dashboards can filter "personal only" /
-- "business only" / "everything" as a plain where clause. Defaulted to
-- 'business' rather than nullable: every existing row (all imported before
-- this column existed) really is business income/expense per this app's
-- actual usage so far, and a NOT NULL column with a real default is safer
-- than leaving old rows in an ambiguous null-scope state that every future
-- query has to remember to handle.
alter table public.transactions add column scope text not null default 'business';
alter table public.transactions add constraint transactions_scope_check check (scope in ('business', 'personal'));
