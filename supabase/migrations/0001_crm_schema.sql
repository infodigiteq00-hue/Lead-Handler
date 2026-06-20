-- =====================================================================
-- QuoteGen CRM — schema migration
-- Project: vllymwxevoftgsilvyng (ap-south-1) · PostgreSQL 17
--
-- Safe to run multiple times (idempotent).
-- Does NOT drop or recreate the existing "Lead Details" table — it only
-- ADDs columns, so the live lead data and the allow_anon_insert policy
-- used by quotegen.in are preserved.
--
-- Auth model: Supabase Auth owns credentials. employees.id == auth.users.id
-- (the plaintext `password` column from the original spec is intentionally
-- omitted). `first_viewed_by` is stored as uuid -> employees(id) rather than
-- TEXT, for referential integrity with the rest of the schema.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. employees  (created FIRST: "Lead Details".assigned_to references it)
-- ---------------------------------------------------------------------
create table if not exists public.employees (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  email      text unique not null,
  created_at timestamptz not null default now()
);

comment on table public.employees is 'CRM users. id mirrors auth.users.id.';

-- ---------------------------------------------------------------------
-- 2. Extend the existing "Lead Details" table (live data preserved)
-- ---------------------------------------------------------------------
alter table "Lead Details" add column if not exists customer_name      text;
alter table "Lead Details" add column if not exists company_name       text;
alter table "Lead Details" add column if not exists city               text;
alter table "Lead Details" add column if not exists product_interested text;
alter table "Lead Details" add column if not exists status             text default 'new';
alter table "Lead Details" add column if not exists customer_status    text default 'Fresh';
alter table "Lead Details" add column if not exists utm_source         text;
alter table "Lead Details" add column if not exists utm_campaign       text;
alter table "Lead Details" add column if not exists utm_content        text;
alter table "Lead Details" add column if not exists first_viewed_at    timestamptz;
alter table "Lead Details" add column if not exists first_viewed_by    uuid references public.employees (id);
alter table "Lead Details" add column if not exists assigned_to        uuid references public.employees (id);
alter table "Lead Details" add column if not exists updated_at         timestamptz not null default now();

-- keep updated_at fresh on edits (lightweight BEFORE UPDATE trigger)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lead_details_updated_at on "Lead Details";
create trigger trg_lead_details_updated_at
  before update on "Lead Details"
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 3. call_logs
-- ---------------------------------------------------------------------
create table if not exists public.call_logs (
  id           uuid primary key default gen_random_uuid(),
  lead_id      bigint not null references "Lead Details" (id) on delete cascade,
  call_status  text,                      -- 'Call Done' | 'Didn''t Pickup' | 'Busy'
  remark       text,
  performed_by uuid references public.employees (id),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. meetings
-- ---------------------------------------------------------------------
create table if not exists public.meetings (
  id            uuid primary key default gen_random_uuid(),
  lead_id       bigint not null references "Lead Details" (id) on delete cascade,
  meeting_date  date not null,
  meeting_time  time not null,
  meeting_notes text,
  assigned_to   uuid references public.employees (id),
  status        text not null default 'Scheduled',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. demo_trials  (10-day trial; expiry auto-computed from start_date)
-- ---------------------------------------------------------------------
create table if not exists public.demo_trials (
  id              uuid primary key default gen_random_uuid(),
  lead_id         bigint not null references "Lead Details" (id) on delete cascade,
  start_date      date not null,
  expiry_date     date generated always as (start_date + 10) stored,  -- start_date + 10 days
  assigned_to     uuid references public.employees (id),
  interest_status text,
  notes           text,
  last_followup   date,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. activity_logs
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id           uuid primary key default gen_random_uuid(),
  lead_id      bigint references "Lead Details" (id) on delete cascade,
  action       text not null,
  performed_by uuid references public.employees (id),
  notes        text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. notifications  (+ optional lead_id for deep-linking from the bell)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid references public.employees (id) on delete cascade,
  title         text not null,
  message       text not null,
  type          text,                    -- 'meeting' | 'followup' | 'trial' | 'new_lead'
  is_read       boolean not null default false,
  scheduled_for timestamptz,
  lead_id       bigint references "Lead Details" (id) on delete cascade,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. Indexes
-- ---------------------------------------------------------------------
create index if not exists idx_lead_details_status          on "Lead Details" (status);
create index if not exists idx_lead_details_customer_status on "Lead Details" (customer_status);
create index if not exists idx_lead_details_first_viewed    on "Lead Details" (first_viewed_at);
create index if not exists idx_lead_details_assigned_to     on "Lead Details" (assigned_to);
create index if not exists idx_call_logs_lead      on public.call_logs (lead_id);
create index if not exists idx_meetings_lead       on public.meetings (lead_id);
create index if not exists idx_meetings_date       on public.meetings (meeting_date);
create index if not exists idx_demo_trials_lead    on public.demo_trials (lead_id);
create index if not exists idx_demo_trials_expiry  on public.demo_trials (expiry_date);
create index if not exists idx_activity_logs_lead  on public.activity_logs (lead_id);
create index if not exists idx_notifications_emp   on public.notifications (employee_id, is_read);

-- ---------------------------------------------------------------------
-- 9. Auto-create an employees row when an auth user is created
-- ---------------------------------------------------------------------
create or replace function public.handle_new_employee()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.employees (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_employee_created on auth.users;
create trigger on_auth_employee_created
  after insert on auth.users
  for each row execute function public.handle_new_employee();

-- ---------------------------------------------------------------------
-- 10. Row Level Security
-- ---------------------------------------------------------------------
alter table "Lead Details"        enable row level security;
alter table public.employees      enable row level security;
alter table public.call_logs      enable row level security;
alter table public.meetings       enable row level security;
alter table public.demo_trials    enable row level security;
alter table public.activity_logs  enable row level security;
alter table public.notifications  enable row level security;

-- "Lead Details": authenticated employees share full read/insert/update.
-- (The pre-existing allow_anon_insert policy for quotegen.in is left intact.)
drop policy if exists "leads_auth_select" on "Lead Details";
create policy "leads_auth_select" on "Lead Details"
  for select to authenticated using (true);
drop policy if exists "leads_auth_insert" on "Lead Details";
create policy "leads_auth_insert" on "Lead Details"
  for insert to authenticated with check (true);
drop policy if exists "leads_auth_update" on "Lead Details";
create policy "leads_auth_update" on "Lead Details"
  for update to authenticated using (true) with check (true);

-- employees: everyone reads the directory; you may only write your own row.
drop policy if exists "emp_select_all" on public.employees;
create policy "emp_select_all" on public.employees
  for select to authenticated using (true);
drop policy if exists "emp_insert_self" on public.employees;
create policy "emp_insert_self" on public.employees
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "emp_update_self" on public.employees;
create policy "emp_update_self" on public.employees
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Shared team tables: any authenticated employee has full access.
do $$
declare
  t text;
begin
  foreach t in array array['call_logs', 'meetings', 'demo_trials', 'activity_logs']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (true)', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (true) with check (true)', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (true)', t || '_delete', t);
  end loop;
end $$;

-- notifications: you only see/modify your own; anyone may create one for a peer.
drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_own" on public.notifications
  for select to authenticated using (employee_id = auth.uid());
drop policy if exists "notif_insert_any" on public.notifications;
create policy "notif_insert_any" on public.notifications
  for insert to authenticated with check (true);
drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own" on public.notifications
  for update to authenticated using (employee_id = auth.uid()) with check (employee_id = auth.uid());
drop policy if exists "notif_delete_own" on public.notifications;
create policy "notif_delete_own" on public.notifications
  for delete to authenticated using (employee_id = auth.uid());

-- ---------------------------------------------------------------------
-- 11. Privileges (RLS still gates row visibility; these grant table access)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update on "Lead Details" to authenticated;
grant select, insert, update, delete on
  public.employees, public.call_logs, public.meetings,
  public.demo_trials, public.activity_logs, public.notifications
  to authenticated;

-- ---------------------------------------------------------------------
-- 12. Realtime — add tables to the supabase_realtime publication
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare
  rel text;
begin
  foreach rel in array array[
    '"Lead Details"', 'public.call_logs', 'public.meetings',
    'public.demo_trials', 'public.activity_logs', 'public.notifications'
  ]
  loop
    begin
      execute 'alter publication supabase_realtime add table ' || rel;
    exception
      when duplicate_object then null;  -- already in the publication
    end;
  end loop;
end $$;

commit;
