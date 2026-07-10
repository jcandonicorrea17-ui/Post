// Edge Function invocada cada hora por pg_cron (ver migración
// 008_schedule_habit_reminders.sql). Para cada usuario con timezone y al
// menos una suscripción push activa: si ya es tarde en su día local (>= las
// 21:00 hora local) y todavía tiene hábitos de hoy sin completar, le manda
// un push. profiles.last_push_reminder_date evita mandar más de uno por
// usuario por día local, aunque el cron corra varias veces dentro de la
// ventana horaria.
//
// No usa verify_jwt (ver supabase/config.toml): en su lugar valida un header
// x-cron-secret propio, porque la key "anon" ya es pública en el cliente y no
// alcanza para restringir quién puede invocar esta función.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const REMINDER_HOUR_LOCAL = 21 // hora local a partir de la cual se considera "tarde"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')
const CRON_SECRET = Deno.env.get('CRON_SECRET')

// Réplica minimalista de src/lib/dates.js#mondayIndex (0=lunes…6=domingo):
// esta función corre en Deno, aislada del bundle de Vite, así que no puede
// importar ese archivo directamente.
function mondayIndex(jsDay: number) {
  return (jsDay + 6) % 7
}

const WEEKDAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

// Fecha (YYYY-MM-DD), día de semana (0=lunes) y hora (0-23) en el timezone
// local del usuario — sin esto "hoy" y "tarde" no significan lo mismo para
// alguien en Tokio que para alguien en Madrid.
function getLocalParts(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  let hour = Number(get('hour'))
  if (hour === 24) hour = 0 // algunas locales formatean medianoche como "24"

  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    weekdayIndex: mondayIndex(WEEKDAY_MAP[get('weekday')] ?? 0),
    hour,
  }
}

function isHabitScheduledOn(habit: { frequency: { type: string; days?: number[] } }, weekdayIndex: number) {
  if (habit.frequency?.type === 'daily') return true
  return (habit.frequency?.days || []).includes(weekdayIndex)
}

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  }
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return new Response(JSON.stringify({ error: 'Faltan variables VAPID_* en la Edge Function' }), {
      status: 500,
    })
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!)

  const now = new Date()
  const summary = {
    checked: 0,
    sent: 0,
    skippedNotLate: 0,
    skippedAlreadySentToday: 0,
    skippedNoPending: 0,
    expiredSubscriptionsRemoved: 0,
    errors: [] as unknown[],
  }

  // !inner: solo perfiles con al menos una suscripción push activa.
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, timezone, last_push_reminder_date, push_subscriptions!inner(endpoint, p256dh, auth)')

  if (profilesError) {
    return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 })
  }

  for (const profile of profiles) {
    summary.checked++
    const timeZone = profile.timezone || 'UTC'
    const { dateStr, weekdayIndex, hour } = getLocalParts(timeZone, now)

    if (hour < REMINDER_HOUR_LOCAL) {
      summary.skippedNotLate++
      continue
    }
    if (profile.last_push_reminder_date === dateStr) {
      summary.skippedAlreadySentToday++
      continue
    }

    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, frequency')
      .eq('user_id', profile.id)

    if (habitsError) {
      summary.errors.push({ userId: profile.id, error: habitsError.message })
      continue
    }

    const scheduledToday = habits.filter((h) => isHabitScheduledOn(h, weekdayIndex))
    if (scheduledToday.length === 0) {
      summary.skippedNoPending++
      continue
    }

    const { data: checkIns, error: checkInsError } = await supabase
      .from('check_ins')
      .select('habit_id')
      .eq('date', dateStr)
      .in(
        'habit_id',
        scheduledToday.map((h) => h.id)
      )

    if (checkInsError) {
      summary.errors.push({ userId: profile.id, error: checkInsError.message })
      continue
    }

    const doneIds = new Set(checkIns.map((c) => c.habit_id))
    const pending = scheduledToday.filter((h) => !doneIds.has(h.id)).length

    if (pending === 0) {
      summary.skippedNoPending++
      continue
    }

    const body =
      pending === 1
        ? 'Te queda 1 hábito por completar hoy 🔥 no rompas tu racha.'
        : `Te quedan ${pending} hábitos por completar hoy 🔥 no rompas tu racha.`
    const payload = JSON.stringify({ title: 'Racha', body, url: '/' })

    for (const sub of profile.push_subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        summary.sent++
      } catch (err) {
        // 404/410: el navegador invalidó la suscripción (desinstaló la PWA, revocó
        // el permiso, etc.) — se borra para no seguir intentando en vano.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          summary.expiredSubscriptionsRemoved++
        } else {
          summary.errors.push({ userId: profile.id, endpoint: sub.endpoint, error: String(err) })
        }
      }
    }

    await supabase.from('profiles').update({ last_push_reminder_date: dateStr }).eq('id', profile.id)
  }

  return new Response(JSON.stringify(summary), { headers: { 'Content-Type': 'application/json' } })
})
