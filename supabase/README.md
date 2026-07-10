# Supabase — Migraciones

Ejecuta estos archivos en orden desde el SQL Editor de tu proyecto Supabase (o pega `MIGRATIONS_ALL.sql` de una sola vez):

1. `migrations/001_create_schema.sql` — Tablas `profiles`, `habits`, `check_ins` + índices.
2. `migrations/002_enable_rls.sql` — Row Level Security: cada usuario solo ve/edita sus propios datos.
3. `migrations/003_create_profiles_trigger.sql` — Trigger que crea automáticamente una fila en `profiles` cuando alguien se registra.
4. `migrations/004_add_onboarding_completed.sql` — Solo necesaria si tu proyecto ya tenía las tablas creadas **sin** la columna `onboarding_completed` (usa `add column if not exists`, así que es seguro correrla aunque ya exista).
5. `migrations/005_add_timezone_to_profiles.sql` — Columna `profiles.timezone`, detectada y sincronizada por el cliente en cada login.
6. `migrations/006_add_has_seen_welcome_tour.sql` — Columna `profiles.has_seen_welcome_tour` + backfill a `true` para usuarios ya existentes.
7. `migrations/007_add_push_subscriptions.sql` — Tabla `push_subscriptions` (RLS incluida) + columna `profiles.last_push_reminder_date`.
8. `migrations/008_schedule_habit_reminders.sql` — Programa el cron horario que llama a la Edge Function de recordatorios. **Requiere el paso manual de Vault descrito abajo antes de correrla.**

## Notas

- `profiles.onboarding_completed` controla si el usuario ya pasó las 5 pantallas de onboarding. Se marca `true` en el último paso (creación del primer hábito).
- Habilita el proveedor **Email** en Authentication → Providers. Si quieres exigir confirmación por email, ajusta el flujo de signup en consecuencia (Fase 1 asume confirmación desactivada para pruebas rápidas).

## Notificaciones push reales (recordatorio aunque la app esté cerrada)

Esto es distinto del recordatorio local que ya existía (`src/lib/notifications.js`, solo se muestra si el usuario abre la app). Esta parte manda un push real de servidor, vía Web Push + una Edge Function programada por cron.

### 1. Claves VAPID

Ya generadas para este proyecto y ya configuradas como secret de la Edge Function (par único — no regenerar salvo que quieras invalidar todas las suscripciones existentes). La clave privada **no se documenta acá**: nunca debe quedar en texto plano en ningún archivo del repo, solo como secret de la Edge Function.

- La **pública** ya está en `.env.local` como `VITE_VAPID_PUBLIC_KEY` (y en `.env.example` como placeholder). Agrégala también como variable de entorno en Netlify (Site settings → Environment variables) para que el build de producción la incluya.
- La **privada** NUNCA va en el cliente ni en ningún archivo del repo. Se configura como secret de la Edge Function:

```bash
supabase secrets set VAPID_PRIVATE_KEY=<tu-vapid-private-key>
supabase secrets set VAPID_PUBLIC_KEY=<tu-vapid-public-key>
supabase secrets set VAPID_SUBJECT=mailto:tu-email-de-contacto@ejemplo.com
supabase secrets set CRON_SECRET=<genera-uno-random-largo, ej. openssl rand -hex 32>
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` no hace falta configurarlos: Supabase los inyecta automáticamente en toda Edge Function.

### 2. Desplegar la Edge Function

```bash
supabase link --project-ref tbwrpobiykmecsgdswyi
supabase functions deploy send-habit-reminders
```

`supabase/config.toml` ya marca esta función con `verify_jwt = false` — la autenticación la hace el propio código de la función comparando el header `x-cron-secret` contra el secret `CRON_SECRET` (la key "anon" es pública en el cliente, así que confiar en `verify_jwt` por sí solo no habría restringido nada).

### 3. Programar el cron

1. En el SQL Editor, crea el secret de Vault que usará `net.http_post` para autenticar la llamada — usa **el mismo valor** que pusiste como `CRON_SECRET` en el paso 1:
   ```sql
   select vault.create_secret('<el-mismo-valor-de-CRON_SECRET>', 'send_habit_reminders_cron_secret');
   ```
2. Corre `migrations/008_schedule_habit_reminders.sql`. Programa la función para correr cada hora en punto; la propia función decide si "ya es tarde" según el timezone de cada usuario, así que una sola programación cubre todas las zonas horarias.
3. Si `create extension pg_cron` / `pg_net` falla por permisos, habilítalas primero desde Database → Extensions en el dashboard, y vuelve a correr la migración.

### 4. Probar sin esperar al cron

Invoca la función manualmente para testear:

```bash
curl -i -X POST 'https://tbwrpobiykmecsgdswyi.supabase.co/functions/v1/send-habit-reminders' \
  -H "x-cron-secret: <tu-CRON_SECRET>"
```

La respuesta es un JSON resumen (`{ checked, sent, skippedNotLate, skippedAlreadySentToday, skippedNoPending, expiredSubscriptionsRemoved, errors }`) — úsalo para confirmar qué pasó en cada corrida en vez de solo confiar en si llegó o no una notificación. También revisa:

- **Supabase → Edge Functions → send-habit-reminders → Logs**: cada invocación (manual o por cron) queda registrada ahí.
- **Table Editor → push_subscriptions**: confirma que se creó una fila al aceptar el permiso de notificaciones desde el navegador (no solo que "se vio el banner").
- **Table Editor → profiles → last_push_reminder_date**: debe actualizarse al día local del usuario después de un envío exitoso, y evitar que se le mande un segundo aviso ese mismo día aunque el cron corra de nuevo.
- Para forzar que un usuario de prueba caiga en la ventana "tarde" sin esperar a que sean las 21:00 en tu timezone real: bajale la constante `REMINDER_HOUR_LOCAL` en `supabase/functions/send-habit-reminders/index.ts` temporalmente, o cambia `profiles.timezone` de esa fila de prueba a un timezone donde ya sean las 21:00+.

### 5. Limitación de iOS

Las push solo funcionan en iPhone si la PWA está instalada en pantalla de inicio (iOS 16.4+) — desde Safari sin instalar, `Notification`/`PushManager` no existen en absoluto. `NotificationsBanner.jsx` detecta esto y muestra instrucciones de instalación en vez del botón de activar cuando corresponde.
