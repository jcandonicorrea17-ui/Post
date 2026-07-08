-- La app usa profiles.onboarding_completed para decidir si mostrar el flujo
-- de onboarding o el Dashboard. Columna añadida tras detectar que faltaba
-- en el proyecto Supabase ya existente (tablas creadas sin esta columna).
alter table profiles
  add column if not exists onboarding_completed boolean default false;
