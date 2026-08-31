-- PM timeline view (#66) needs a start date to draw a bar, not just the
-- existing due_date -- an issue with only a due_date renders as a
-- single-day marker instead.
alter table public.issues add column start_date date;
