# CLAUDE.md

Guía técnica para trabajar en este repo (Racha — app de seguimiento de hábitos).

## Overview

React 18 + Vite + Supabase. Sin SSR. Fase 1 (núcleo funcional): auth, onboarding obligatorio de 5 pantallas, CRUD de hábitos, check-in diario de un tap, PWA instalable. Fase 2 (retención y factor visual): heatmap mensual, Habit Score ponderado, modal de plantillas al crear hábito, recordatorio local de notificaciones.

## Objetivo de negocio

App gratuita para construir comunidad (captura teléfono + redes en onboarding) de cara a un producto de pago futuro. El onboarding es obligatorio — no se accede al Dashboard sin completarlo.

## Identidad visual

- Fondo negro (`#0a0a0a` / `#0d0d0d`), acento dorado (`#F5C518`, hover `#e5b50a`)
- Tono cercano y directo, sin frases corporativas — todo el copy en español
- Variables de diseño en `src/styles/global.css` (`--bg`, `--gold`, `--border`, etc.)

## Arquitectura

`src/App.jsx` es el enrutador lógico basado en estado de sesión/perfil, no en `react-router`:

- Sin sesión → `Onboarding` (que incluye registro/login en el paso 2)
- Con sesión pero `profile.onboarding_completed === false` → `Onboarding` (retoma en el paso 3 si ya hay sesión)
- Con sesión y onboarding completo → `Dashboard`

`Onboarding.jsx` es el contenedor de los 5 pasos (`WelcomeScreen`, `RegisterScreen`, `PhoneScreen`, `SocialsScreen`, `FirstHabitScreen`), con una barra de progreso propia.

`Dashboard.jsx` alterna entre `Today` (check-in diario), `Heatmap` (progreso mensual) y "Mis Hábitos" (CRUD) vía una barra de navegación inferior; las tres comparten el array de hábitos cargado en el propio Dashboard. El Habit Score (`src/lib/habitScore.js`) se recalcula cada vez que se entra a "Mis Hábitos", con una ventana de 30 días y más peso a los últimos 7.

## Modelo de datos (Supabase)

Ver `supabase/migrations/`. Tablas: `profiles` (extiende `auth.users`, incluye `onboarding_completed`), `habits`, `check_ins` (constraint `unique(habit_id, date)` para evitar doble check-in). RLS habilitado en las tres tablas — cada usuario solo ve/edita sus propios datos. Un trigger (`003_create_profiles_trigger.sql`) crea la fila de `profiles` automáticamente al registrarse.

## API layer

Toda la comunicación con Supabase pasa por `src/lib/api.js` (CRUD de perfil, hábitos, check-ins) sobre el cliente de `src/lib/supabase.js`. No se llama a `supabase.from(...)` directamente desde componentes.

## PWA

`public/service-worker.js` cachea assets estáticos con estrategia network-first + fallback a cache. `manifest.json` define los íconos (`public/icon-192.png`, `public/icon-512.png`, logo oficial de marca) y el modo `standalone`. Los íconos usan `purpose: "any"` (no `maskable`) a propósito, para que Android no le aplique el recorte adaptativo circular al logo.

## Notificaciones

Ver [NOTIFICATIONS.md](./NOTIFICATIONS.md) — es un recordatorio local (solo mientras la app está abierta), no push real de servidor. Documenta explícitamente qué falta y las limitaciones de iOS antes de usarlo en marketing.

## Roadmap (Fase 3+, no implementado)

- Push real en segundo plano (VAPID + tabla de suscripciones + Edge Function programada)
- Login con Google / OAuth
- Analytics y estadísticas de consistencia avanzadas
