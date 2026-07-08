# Supabase — Migraciones

Ejecuta estos archivos en orden desde el SQL Editor de tu proyecto Supabase (o pega `MIGRATIONS_ALL.sql` de una sola vez):

1. `migrations/001_create_schema.sql` — Tablas `profiles`, `habits`, `check_ins` + índices.
2. `migrations/002_enable_rls.sql` — Row Level Security: cada usuario solo ve/edita sus propios datos.
3. `migrations/003_create_profiles_trigger.sql` — Trigger que crea automáticamente una fila en `profiles` cuando alguien se registra.
4. `migrations/004_add_onboarding_completed.sql` — Solo necesaria si tu proyecto ya tenía las tablas creadas **sin** la columna `onboarding_completed` (usa `add column if not exists`, así que es seguro correrla aunque ya exista).

## Notas

- `profiles.onboarding_completed` controla si el usuario ya pasó las 5 pantallas de onboarding. Se marca `true` en el último paso (creación del primer hábito).
- Habilita el proveedor **Email** en Authentication → Providers. Si quieres exigir confirmación por email, ajusta el flujo de signup en consecuencia (Fase 1 asume confirmación desactivada para pruebas rápidas).
