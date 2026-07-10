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
