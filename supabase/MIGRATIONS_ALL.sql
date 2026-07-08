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
alter table profiles enable row level security;
alter table habits enable row level security;
alter table check_ins enable row level security;

-- Profiles: el usuario solo ve/edita su propia fila
create policy "Profiles are viewable by owner"
  on profiles for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on profiles for update
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on profiles for insert
  with check (auth.uid() = id);

-- Habits: el usuario solo ve/edita sus propios hábitos
create policy "Habits are viewable by owner"
  on habits for select
  using (auth.uid() = user_id);

create policy "Habits are insertable by owner"
  on habits for insert
  with check (auth.uid() = user_id);

create policy "Habits are updatable by owner"
  on habits for update
  using (auth.uid() = user_id);

create policy "Habits are deletable by owner"
  on habits for delete
  using (auth.uid() = user_id);

-- Check-ins: el usuario solo ve/edita check-ins de sus propios hábitos
create policy "Check-ins are viewable by owner"
  on check_ins for select
  using (
    exists (
      select 1 from habits
      where habits.id = check_ins.habit_id
      and habits.user_id = auth.uid()
    )
  );

create policy "Check-ins are insertable by owner"
  on check_ins for insert
  with check (
    exists (
      select 1 from habits
      where habits.id = check_ins.habit_id
      and habits.user_id = auth.uid()
    )
  );

create policy "Check-ins are updatable by owner"
  on check_ins for update
  using (
    exists (
      select 1 from habits
      where habits.id = check_ins.habit_id
      and habits.user_id = auth.uid()
    )
  );

create policy "Check-ins are deletable by owner"
  on check_ins for delete
  using (
    exists (
      select 1 from habits
      where habits.id = check_ins.habit_id
      and habits.user_id = auth.uid()
    )
  );
-- Auto-crea una fila en profiles cuando se registra un usuario nuevo en auth.users
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- La app usa profiles.onboarding_completed para decidir si mostrar el flujo
-- de onboarding o el Dashboard. Columna añadida tras detectar que faltaba
-- en el proyecto Supabase ya existente (tablas creadas sin esta columna).
alter table profiles
  add column if not exists onboarding_completed boolean default false;
