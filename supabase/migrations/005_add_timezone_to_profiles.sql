-- Timezone IANA del dispositivo del usuario (ej. "Europe/Madrid"), detectado
-- en el cliente con Intl.DateTimeFormat().resolvedOptions().timeZone.
-- Permite que cálculos server-side (Edge Functions, cron) determinen el "día"
-- local del usuario en vez de asumir UTC.
alter table profiles add column timezone text;
