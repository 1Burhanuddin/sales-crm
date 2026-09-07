-- assignment_notes' and issue_notes' insert policies never verified
-- sales_id matched the caller (only the UI's transform set it correctly)
-- -- any authenticated user with access to the parent record could POST
-- a comment with an arbitrary sales_id, spoofing another rep's
-- authorship. Same "sales_id is null or = current_sales_id() or admin"
-- guard already established on lead_activities' insert policy --
-- set_sales_id_default() only fills sales_id in when it's null, it
-- doesn't overwrite an explicit value, so this has to be enforced here
-- too, not left to the trigger.
drop policy "Insert via assignment access, not notes-only" on public.assignment_notes;
create policy "Insert via assignment access, not notes-only" on public.assignment_notes for insert to authenticated with check (
    not public.is_notes_only()
    and (sales_id is null or sales_id = public.current_sales_id() or public.is_admin())
    and public.can_access_assignment(assignment_id)
);

drop policy "Project member or admin insert" on public.issue_notes;
create policy "Project member or admin insert" on public.issue_notes for insert to authenticated with check (
    (sales_id is null or sales_id = public.current_sales_id() or public.is_admin())
    and exists (select 1 from public.issues i where i.id = issue_notes.issue_id and public.can_access_project(i.project_id))
);
