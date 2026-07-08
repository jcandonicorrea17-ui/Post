export function toISODate(d) {
  return d.toISOString().split('T')[0]
}

export function startOfMonth(year, month) {
  return new Date(year, month, 1)
}

export function endOfMonth(year, month) {
  return new Date(year, month + 1, 0)
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

// ¿Este hábito toca hacerse en `date` según su frecuencia (diario, o el día de la
// semana que corresponda si es semanal)?
export function isHabitScheduledOn(habit, date) {
  if (habit.frequency.type === 'daily') return true
  return (habit.frequency.days || []).includes(mondayIndex(date.getDay()))
}
