import { toISODate } from './dates'

const RECENT_WINDOW_DAYS = 7
const RECENT_WEIGHT = 2
const OLDER_WEIGHT = 1
const MAX_WINDOW_DAYS = 30
const MIN_DAYS_FOR_SCORE = 3

// Devuelve un entero 0-100, o null si el hábito es demasiado nuevo para tener un score fiable.
export function calculateHabitScore(createdAt, checkInDates) {
  const createdDate = new Date(createdAt)
  createdDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysSinceCreation = Math.floor((today - createdDate) / 86400000) + 1
  if (daysSinceCreation < MIN_DAYS_FOR_SCORE) {
    return null
  }

  const windowDays = Math.min(daysSinceCreation, MAX_WINDOW_DAYS)
  const checkInSet = new Set(checkInDates)

  let earned = 0
  let possible = 0
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const weight = i < RECENT_WINDOW_DAYS ? RECENT_WEIGHT : OLDER_WEIGHT
    possible += weight
    if (checkInSet.has(toISODate(d))) earned += weight
  }

  return Math.round((earned / possible) * 100)
}

export function averageScore(scores) {
  const valid = scores.filter((s) => s !== null && s !== undefined)
  if (valid.length === 0) return null
  return Math.round(valid.reduce((sum, s) => sum + s, 0) / valid.length)
}
