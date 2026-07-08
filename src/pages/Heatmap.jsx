import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCheckInsForRange } from '../lib/api'
import { toISODate, startOfMonth, endOfMonth, mondayIndex } from '../lib/dates'
import '../styles/Heatmap.css'

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function Heatmap({ session, habits }) {
  const now = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedHabitId, setSelectedHabitId] = useState('all')
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const start = toISODate(startOfMonth(viewYear, viewMonth))
      const end = toISODate(endOfMonth(viewYear, viewMonth))
      const data = await getCheckInsForRange(session.user.id, start, end)
      setCheckIns(data)
    } catch (err) {
      setError(err.message || 'No se pudo cargar el progreso.')
    } finally {
      setLoading(false)
    }
  }, [session.user.id, viewYear, viewMonth])

  useEffect(() => {
    load()
  }, [load])

  const countsByDate = useMemo(() => {
    const relevant =
      selectedHabitId === 'all'
        ? checkIns
        : checkIns.filter((c) => c.habit_id === selectedHabitId)
    const map = {}
    for (const c of relevant) {
      map[c.date] = (map[c.date] || 0) + 1
    }
    return map
  }, [checkIns, selectedHabitId])

  const total = selectedHabitId === 'all' ? habits.length : 1

  function levelFor(dateStr) {
    const count = countsByDate[dateStr] || 0
    if (count === 0 || total === 0) return 0
    const ratio = count / total
    if (ratio >= 1) return 4
    if (ratio >= 0.66) return 3
    if (ratio >= 0.33) return 2
    return 1
  }

  const firstDay = startOfMonth(viewYear, viewMonth)
  const lastDay = endOfMonth(viewYear, viewMonth)
  const leadingBlanks = mondayIndex(firstDay.getDay())
  const daysInMonth = lastDay.getDate()

  const cells = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function goNextMonth() {
    if (isCurrentMonth) return
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  if (habits.length === 0) {
    return <p className="dashboard-empty">Crea un hábito para empezar a ver tu progreso.</p>
  }

  return (
    <div className="heatmap-view">
      <div className="heatmap-header">
        <h2>Progreso</h2>
        <select
          className="heatmap-habit-select"
          value={selectedHabitId}
          onChange={(e) => setSelectedHabitId(e.target.value)}
        >
          <option value="all">Todos los hábitos</option>
          {habits.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <div className="heatmap-month-nav">
        <button type="button" onClick={goPrevMonth} aria-label="Mes anterior">
          ‹
        </button>
        <span>
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={goNextMonth}
          disabled={isCurrentMonth}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p className="dashboard-empty">Cargando...</p>
      ) : (
        <>
          <div className="heatmap-weekdays">
            {WEEKDAY_LABELS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="heatmap-grid">
            {cells.map((day, index) => {
              if (day === null) {
                return <div key={`blank-${index}`} className="heatmap-cell heatmap-blank" />
              }
              const dateStr = toISODate(new Date(viewYear, viewMonth, day))
              const level = levelFor(dateStr)
              return (
                <div
                  key={dateStr}
                  className={`heatmap-cell heatmap-level-${level}`}
                  title={`${dateStr}: ${countsByDate[dateStr] || 0}/${total} completados`}
                >
                  <span className="heatmap-day-number">{day}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
