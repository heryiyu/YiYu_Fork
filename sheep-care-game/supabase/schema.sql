-- Originally: supabase_schema.sql
-- Reference schema. Production may differ. See MIGRATIONS.md for evolution.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid references auth.users not null primary key,
  display_name text,
  line_user_id text unique, -- For LINE Login mapping
  coins int default 0,
  last_login_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS for users
alter table public.users enable row level security;

-- Policies for users
create policy "Users can view their own profile"
  on public.users for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.users for update
  using ( auth.uid() = id );

-- SHEEP TABLE
create table public.sheep (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  status text default 'healthy',
  health float default 100.0,
  care_level float default 50.0,
  type text default 'LAMB',
  visual jsonb default '{}'::jsonb,
  spiritual_maturity text default '新朋友',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for sheep
alter table public.sheep enable row level security;

-- Policies for sheep
create policy "Users can view their own sheep"
  on public.sheep for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own sheep"
  on public.sheep for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own sheep"
  on public.sheep for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own sheep"
  on public.sheep for delete
  using ( auth.uid() = user_id );

-- Function to handle new user creation automatically (if using Supabase Auth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
