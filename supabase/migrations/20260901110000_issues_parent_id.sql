-- PM: sub-tasks (#69). A self-reference on issues -- a child issue's
-- parent_id points at its parent. on delete set null (not cascade): if
-- a parent issue is ever deleted, its sub-tasks become top-level issues
-- rather than being destroyed along with it -- matches this schema's
-- general conservative-delete posture elsewhere (leads' converted_*_id,
-- issues.sprint_id/milestone_id all set null, not cascade).
alter table public.issues add column parent_id bigint;
alter table public.issues
    add constraint issues_parent_id_fkey foreign key (parent_id) references public.issues(id) on delete set null;
create index issues_parent_id_idx on public.issues using btree (parent_id);
