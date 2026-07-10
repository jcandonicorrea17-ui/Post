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
