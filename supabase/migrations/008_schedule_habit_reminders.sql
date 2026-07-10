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
