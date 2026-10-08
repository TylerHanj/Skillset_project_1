-- Metadata required by Smart Brain Dump. Existing task rows continue to work:
-- their legacy values are mapped to these fields by src/lib/db.ts.
alter table public.tasks
  add column if not exists category text not null default 'general'
    check (category in ('study', 'personal', 'general')),
  add column if not exists has_time boolean not null default false,
  add column if not exists is_completed boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

-- A thought without a deadline is valid input from a brain dump.
alter table public.tasks alter column due_date drop not null;

-- Keep the structured completion flag in sync when existing UI updates status.
update public.tasks
set is_completed = (status = 'Done')
where is_completed is distinct from (status = 'Done');
