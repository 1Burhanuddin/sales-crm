-- Notes: reminders (#90). A single optional date/time per note --
-- surfaced as a badge on the card (overdue vs upcoming) and a
-- dedicated section at the top of the grid, no separate snooze/dismiss
-- mechanism: clearing the date (editing the note) is how you dismiss
-- one, matching this feature's intentionally light scope.
alter table public.personal_notes add column remind_at timestamptz;
