-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- HABITS TABLE
create table if not exists public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- HABIT LOGS TABLE
create table if not exists public.habit_logs (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references public.habits(id) on delete cascade not null,
  date text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(habit_id, date)
);

-- SUBJECTS TABLE
create table if not exists public.subjects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WEEKLY SCHEDULE TABLE
create table if not exists public.weekly_schedule (
  id uuid default uuid_generate_v4() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  day text not null,
  start_time text not null,
  end_time text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ATTENDANCE LOGS TABLE
create table if not exists public.attendance_logs (
  id uuid default uuid_generate_v4() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  date text not null,
  status text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint check_status check (status in ('attended', 'missed', 'cancelled'))
);

-- RLS
alter table public.users enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.subjects enable row level security;
alter table public.weekly_schedule enable row level security;
alter table public.attendance_logs enable row level security;

-- Policies
create policy "Public users" on public.users for all using (true);
create policy "Public habits" on public.habits for all using (true);
create policy "Public habit_logs" on public.habit_logs for all using (true);
create policy "Public subjects" on public.subjects for all using (true);
create policy "Public weekly_schedule" on public.weekly_schedule for all using (true);
create policy "Public attendance_logs" on public.attendance_logs for all using (true);
