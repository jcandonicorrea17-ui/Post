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

-- Timezone IANA del dispositivo del usuario (ej. "Europe/Madrid"), detectado
-- en el cliente con Intl.DateTimeFormat().resolvedOptions().timeZone.
-- Permite que cálculos server-side (Edge Functions, cron) determinen el "día"
-- local del usuario en vez de asumir UTC.
alter table profiles add column timezone text;

-- Controla si ya se le mostró al usuario el tour de bienvenida (3 pantallas,
-- ver src/components/WelcomeTour.jsx) que se muestra una sola vez, encima de
-- "Hoy", justo después de completar el onboarding obligatorio.
--
-- Distinta de profiles.onboarding_completed: esa marca el registro obligatorio
-- (teléfono, redes, primer hábito) que bloquea el acceso al Dashboard; esta
-- solo controla un overlay informativo que se puede saltar.
alter table profiles
  add column if not exists has_seen_welcome_tour boolean not null default false;

-- Los usuarios que ya usaban la app antes de este cambio ya saben cómo funciona:
-- no deben ver el tour retroactivamente, solo los que se registren de ahora en más.
update profiles set has_seen_welcome_tour = true where onboarding_completed = true;

-- Suscripciones Web Push (una fila por navegador/dispositivo suscrito).
-- endpoint es único: si el mismo dispositivo se vuelve a suscribir (ej. tras
-- reinstalar la PWA), se actualiza la fila existente en vez de duplicarla.
create table push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index push_subscriptions_user_id_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

create policy "Push subscriptions are viewable by owner"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Push subscriptions are insertable by owner"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Push subscriptions are updatable by owner"
  on push_subscriptions for update
  using (auth.uid() = user_id);

create policy "Push subscriptions are deletable by owner"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Último día local (YYYY-MM-DD, según profiles.timezone) en que se envió el
-- recordatorio push de hábitos pendientes. La Edge Function la usa para no
-- mandar más de un aviso por usuario por día aunque el cron corra cada hora.
alter table profiles add column if not exists last_push_reminder_date date;

-- Antes de correr este archivo, guarda el secreto que autentica las llamadas
-- del cron a la Edge Function (genera uno vos, ej. `openssl rand -hex 32`;
-- debe ser EL MISMO valor que pongas como env var CRON_SECRET de la función):
--
--   select vault.create_secret('<tu-secreto-largo-random>', 'send_habit_reminders_cron_secret');
--
-- No lo pongas en este archivo ni en ningún commit: se guarda cifrado en
-- Supabase Vault y esta migración solo lo referencia por nombre.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'send-habit-reminders-hourly',
  '0 * * * *', -- cada hora en punto; la Edge Function decide si es "tarde" en el timezone de cada usuario
  $$
  select net.http_post(
    url := 'https://tbwrpobiykmecsgdswyi.supabase.co/functions/v1/send-habit-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'send_habit_reminders_cron_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
