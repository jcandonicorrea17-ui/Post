# Notificaciones — estado real y qué se puede prometer en marketing

## Qué se construyó

Un recordatorio **local**, no un push real de servidor:

- Al entrar a "Hoy", si hay hábitos pendientes y el usuario dio permiso de notificaciones, la app muestra una notificación tipo "Te quedan X hábitos por completar hoy" (una vez al día, vía `localStorage`).
- Un banner discreto ("Activa recordatorios diarios...") aparece la primera vez, ya que los navegadores exigen que el usuario dé permiso con un clic — no se puede pedir automáticamente.
- El Service Worker sabe manejar el clic en la notificación (abre/enfoca la app).

## Qué NO se construyó (y por qué)

**Esto NO es un push real que llegue con la app cerrada.** Un recordatorio de verdad en segundo plano (por ejemplo, avisar a las 8pm aunque nadie haya abierto la app ese día) requiere:

1. Claves VAPID + una tabla de suscripciones push en Supabase.
2. Un proceso en el servidor (Edge Function + cron) que dispare el envío todos los días a la hora programada.

Esa infraestructura no está implementada en esta fase — es un desarrollo más grande y aparte, no algo que se pueda añadir "gratis" sobre lo que ya existe.

## Limitación crítica de iOS (Apple)

En iPhone, las notificaciones de una PWA **solo funcionan si el usuario instaló la app en la pantalla de inicio** (Compartir → "Añadir a pantalla de inicio"). Desde Safari normal, sin instalar, no hay notificaciones en absoluto — es una restricción de Apple, no algo que se pueda evitar con código.

## No pude probarlo en un dispositivo Android real

**Importante:** no tengo acceso a un teléfono Android físico en este entorno de desarrollo — solo pude verificar que el código compila y que la lógica de permisos/notificación es correcta. **Antes de anunciar esta función en TikTok o cualquier canal de marketing, alguien debe probarla en un Android real**: instalar la PWA (o simplemente abrirla en Chrome), aceptar el permiso, marcar/dejar pendiente un hábito, y confirmar que la notificación aparece.

## Recomendación para lo que se comunica ahora

- **No prometer** "te avisamos aunque no abras la app" — eso no está construido.
- Si acaso, comunicar algo como "recibe un recordatorio cuando abres Racha y te faltan hábitos por hacer" — eso sí es lo que existe hoy.
- Verificar primero en Android real antes de mencionar notificaciones en cualquier pieza de marketing.
