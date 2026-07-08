-- Perfiles (extensión de auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  phone text,
  marketing_opt_in boolean default false,
  followed_socials boolean default false,
  onboarding_completed boolean default false
);

-- Hábitos
create table habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  identity_phrase text,
  frequency jsonb not null, -- { "type": "daily" } o { "type": "weekly", "days": [1,3,5] }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Check-ins
create table check_ins (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references habits(id) on delete cascade not null,
  date date not null,
  reflection_emoji text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(habit_id, date)
);

create index habits_user_id_idx on habits(user_id);
create index check_ins_habit_id_idx on check_ins(habit_id);
create index check_ins_date_idx on check_ins(date);
