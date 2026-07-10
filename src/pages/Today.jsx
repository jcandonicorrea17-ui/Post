import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getCheckInsForDate, toggleCheckIn, setCheckInReflection } from '../lib/api'
import { maybeShowDailyReminder } from '../lib/notifications'
import { isHabitScheduledOn, toISODate } from '../lib/dates'
import TodayHabitCard from '../components/TodayHabitCard.jsx'
import NotificationsBanner from '../components/NotificationsBanner.jsx'
import TimezoneDebug from '../components/TimezoneDebug.jsx' // TODO: quitar debug timezone
import '../styles/Today.css'

export default function Today({ session, habits, loading }) {
  const [checkIns, setCheckIns] = useState([])
  const [checkInsLoaded, setCheckInsLoaded] = useState(false)
  const [error, setError] = useState('')
  const date = toISODate(new Date())

  // Solo los hábitos cuya frecuencia (diaria, o semanal con el día de hoy incluido)
  // corresponde a hoy — antes se mostraban todos los hábitos todos los días.
  const scheduledHabits = useMemo(
    () => habits.filter((h) => isHabitScheduledOn(h, new Date())),
    [habits]
  )
  const scheduledHabitIds = useMemo(
    () => new Set(scheduledHabits.map((h) => h.id)),
    [scheduledHabits]
  )

  // Los callbacks de abajo necesitan leer el checkIn más reciente de un hábito sin
  // depender de `checkIns` en su lista de dependencias — si dependieran de `checkIns`,
  // cambiarían de referencia en cada toggle y anularían el React.memo de cada card.
  const checkInsRef = useRef(checkIns)
  useEffect(() => {
    checkInsRef.current = checkIns
  }, [checkIns])

  const loadCheckIns = useCallback(async () => {
    try {
      const data = await getCheckInsForDate(session.user.id, date)
      setCheckIns(data)
    } catch (err) {
      console.error('Error cargando check-ins:', err.message)
    } finally {
      setCheckInsLoaded(true)
    }
  }, [session.user.id, date])

  useEffect(() => {
    loadCheckIns()
  }, [loadCheckIns])

  useEffect(() => {
    if (!loading && checkInsLoaded) {
      const completed = checkIns.filter((c) => scheduledHabitIds.has(c.habit_id)).length
      maybeShowDailyReminder(scheduledHabits.length - completed)
    }
  }, [loading, checkInsLoaded, scheduledHabits, scheduledHabitIds, checkIns])

  // Devuelve { success, checked } para que la card decida si celebrar — nunca antes
  // de que Supabase confirme, así el "juice" nunca se adelanta a un rollback.
  const handleToggle = useCallback(
    async (habitId) => {
      setError('')
      const existing = checkInsRef.current.find((c) => c.habit_id === habitId)
      try {
        const result = await toggleCheckIn(habitId, date, existing?.id)
        if (result) {
          setCheckIns((prev) => [...prev, result])
        } else {
          setCheckIns((prev) => prev.filter((c) => c.habit_id !== habitId))
        }
        return { success: true, checked: Boolean(result) }
      } catch (err) {
        console.error('Error en check-in:', err)
        setError(`No se pudo guardar el check-in: ${err.message}`)
        return { success: false, checked: false }
      }
    },
    [date]
  )

  const handleReflection = useCallback(async (habitId, emoji) => {
    setError('')
    const existing = checkInsRef.current.find((c) => c.habit_id === habitId)
    if (!existing) return
    try {
      const updated = await setCheckInReflection(existing.id, emoji)
      setCheckIns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (err) {
      console.error('Error guardando reflexión:', err)
      setError(`No se pudo guardar la reflexión: ${err.message}`)
    }
  }, [])

  const completedCount = checkIns.filter((c) => scheduledHabitIds.has(c.habit_id)).length
  const totalCount = scheduledHabits.length

  if (loading) {
    return <p className="dashboard-empty">Cargando...</p>
  }

  if (habits.length === 0) {
    return <p className="dashboard-empty">Aún no tienes hábitos. Crea uno en &quot;Mis Hábitos&quot;.</p>
  }

  if (scheduledHabits.length === 0) {
    return <p className="dashboard-empty">Hoy no tienes hábitos programados. 🎉</p>
  }

  return (
    <div className="today-view">
      <TimezoneDebug localDate={date} /> {/* TODO: quitar debug timezone */}
      <NotificationsBanner />

      <div className="today-header">
        <h2>Hoy</h2>
        <p className="today-progress-label">
          {completedCount} de {totalCount} completados
        </p>
        <div className="today-progress-bar">
          <div
            className="today-progress-fill"
            style={{ width: totalCount ? `${(completedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="today-list">
        {scheduledHabits.map((habit) => (
          <TodayHabitCard
            key={habit.id}
            habitId={habit.id}
            habit={habit}
            checkIn={checkIns.find((c) => c.habit_id === habit.id)}
            onToggle={handleToggle}
            onReflect={handleReflection}
          />
        ))}
      </div>
    </div>
  )
}
