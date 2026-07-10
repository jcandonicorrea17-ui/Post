// Devuelve el timezone IANA del dispositivo (ej. "Europe/Madrid").
export function getDeviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

// "Día" (YYYY-MM-DD) de `d` en el timezone local del dispositivo — nunca en UTC.
// Antes usaba d.toISOString(), que da el día en UTC: en España (UTC+1/+2) eso
// adelantaba o atrasaba el corte del día respecto a medianoche local y rompía
// las rachas cerca de la medianoche.
export function toISODate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfMonth(year, month) {
  return new Date(year, month, 1)
}

export function endOfMonth(year, month) {
  return new Date(year, month + 1, 0)
}

// ¿Este hábito toca hacerse en `date` según su frecuencia (diario, o el día de la
// semana que corresponda si es semanal)?
export function isHabitScheduledOn(habit, date) {
  if (habit.frequency.type === 'daily') return true
  return (habit.frequency.days || []).includes(mondayIndex(date.getDay()))
}

// Convierte el índice de día de JS (0=domingo) a semana que empieza en lunes (0=lunes)
export function mondayIndex(jsDay) {
  return (jsDay + 6) % 7
}

export function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// Instante (Date) de la próxima medianoche local — cuándo se reinicia el "día" de check-in.
export function nextLocalMidnight(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1, 0, 0, 0, 0)
  return d
}
