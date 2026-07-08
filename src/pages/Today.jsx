import { useCallback, useEffect, useState } from 'react'
import { getCheckInsForDate, toggleCheckIn, setCheckInReflection } from '../lib/api'
import { maybeShowDailyReminder } from '../lib/notifications'
import TodayHabitCard from '../components/TodayHabitCard.jsx'
import NotificationsBanner from '../components/NotificationsBanner.jsx'
import '../styles/Today.css'

function todayISODate() {
  return new Date().toISOString().split('T')[0]
}

export default function Today({ session, habits, loading }) {
  const [checkIns, setCheckIns] = useState([])
  const [checkInsLoaded, setCheckInsLoaded] = useState(false)
  const [error, setError] = useState('')
  const date = todayISODate()

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
      maybeShowDailyReminder(habits.length - checkIns.length)
    }
  }, [loading, checkInsLoaded, habits.length, checkIns.length])

  async function handleToggle(habitId) {
    setError('')
    const existing = checkIns.find((c) => c.habit_id === habitId)
    try {
      const result = await toggleCheckIn(habitId, date, existing?.id)
      if (result) {
        setCheckIns((prev) => [...prev, result])
      } else {
        setCheckIns((prev) => prev.filter((c) => c.habit_id !== habitId))
      }
    } catch (err) {
      console.error('Error en check-in:', err)
      setError(`No se pudo guardar el check-in: ${err.message}`)
    }
  }

  async function handleReflection(habitId, emoji) {
    setError('')
    const existing = checkIns.find((c) => c.habit_id === habitId)
    if (!existing) return
    try {
      const updated = await setCheckInReflection(existing.id, emoji)
      setCheckIns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (err) {
      console.error('Error guardando reflexión:', err)
      setError(`No se pudo guardar la reflexión: ${err.message}`)
    }
  }

  const completedCount = checkIns.length
  const totalCount = habits.length

  if (loading) {
    return <p className="dashboard-empty">Cargando...</p>
  }

  if (habits.length === 0) {
    return <p className="dashboard-empty">Aún no tienes hábitos. Crea uno en &quot;Mis Hábitos&quot;.</p>
  }

  return (
    <div className="today-view">
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
        {habits.map((habit) => {
          const checkIn = checkIns.find((c) => c.habit_id === habit.id)
          return (
            <TodayHabitCard
              key={habit.id}
              habit={habit}
              checkIn={checkIn}
              onToggle={() => handleToggle(habit.id)}
              onReflect={(emoji) => handleReflection(habit.id, emoji)}
            />
          )
        })}
      </div>
    </div>
  )
}
