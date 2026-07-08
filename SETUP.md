# Guía de Instalación

## 1. Crear proyecto en Supabase

1. Ve a https://supabase.com y crea un proyecto nuevo.
2. En **Project Settings → API** copia:
   - **Project URL** (formato `https://<ref>.supabase.co`)
   - **anon / publishable key**
3. En **Authentication → Providers**, confirma que **Email** está habilitado.

## 2. Ejecutar migraciones

En el SQL Editor de tu proyecto Supabase, pega y ejecuta (en orden, o todo junto desde `supabase/MIGRATIONS_ALL.sql`):

1. `supabase/migrations/001_create_schema.sql`
2. `supabase/migrations/002_enable_rls.sql`
3. `supabase/migrations/003_create_profiles_trigger.sql`

## 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y completa con tus credenciales reales:

```bash
VITE_SUPABASE_URL=https://<tu-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

`.env.local` nunca se sube a git (está en `.gitignore`).

## 4. Instalar dependencias y correr

```bash
npm install
npm run dev
```

Accede en http://localhost:3000

## 5. Testing en móvil (misma red local)

```bash
npm run dev -- --host
```

Abre la IP que muestre Vite (ej. `http://192.168.1.x:3000`) desde el navegador de tu teléfono.

## 6. Build para producción

```bash
npm run build
npm run preview
```

## 7. Deploy a Netlify

1. Conecta el repo en Netlify (o arrastra la carpeta `dist/` tras `npm run build`).
2. Build command: `npm run build` — Publish directory: `dist` (ya configurado en `netlify.toml`).
3. Añade las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en **Site settings → Environment variables**.

## Troubleshooting

- **"Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY"**: revisa que `.env.local` exista y tenga ambos valores, y reinicia `npm run dev`.
- **Login/signup falla con error de red**: verifica que la URL de Supabase use el dominio `.supabase.co` (no `.com`).
- **El perfil no se crea al registrarse**: confirma que el trigger `003_create_profiles_trigger.sql` se ejecutó correctamente.
