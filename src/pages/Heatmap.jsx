import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCheckInsForRange } from '../lib/api'
import { toISODate, startOfMonth, endOfMonth, mondayIndex } from '../lib/dates'
import '../styles/Heatmap.css'

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const LEGEND_LEVELS = [0, 1, 2, 3, 4]

// Cuántos check-ins eran posible para un hábito entre rangeStart y rangeEnd
// (respeta su frecuencia semanal y la fecha en que se creó).
function possibleDaysForHabit(habit, rangeStart, rangeEnd) {
  const createdDate = new Date(habit.created_at)
  createdDate.setHours(0, 0, 0, 0)
  const start = createdDate > rangeStart ? createdDate : rangeStart
  if (start > rangeEnd) return 0

  let count = 0
  const cursor = new Date(start)
  while (cursor <= rangeEnd) {
    if (habit.frequency.type === 'daily') {
      count++
    } else if ((habit.frequency.days || []).includes(mondayIndex(cursor.getDay()))) {
      count++
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

export default function Heatmap({ session, habits }) {
  const now = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedHabitId, setSelectedHabitId] = useState('all')
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeDate, setActiveDate] = useState(null)

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

  useEffect(() => {
    setActiveDate(null)
  }, [viewYear, viewMonth, selectedHabitId])

  // --- Lógica de color del heatmap (sin tocar) ---
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
  // --- Fin lógica de color (sin tocar) ---

  const firstDay = startOfMonth(viewYear, viewMonth)
  const lastDay = endOfMonth(viewYear, viewMonth)
  const leadingBlanks = mondayIndex(firstDay.getDay())
  const daysInMonth = lastDay.getDate()

  const cells = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  // Resumen del mes: check-ins reales vs. posibles según frecuencia de cada hábito,
  // respetando el mismo filtro (todos / un hábito) que ya aplican los colores.
  const monthSummary = useMemo(() => {
    const relevantHabits =
      selectedHabitId === 'all' ? habits : habits.filter((h) => h.id === selectedHabitId)
    const rangeEnd = isCurrentMonth ? now : lastDay
    if (rangeEnd < firstDay) return null

    let possible = 0
    for (const habit of relevantHabits) {
      possible += possibleDaysForHabit(habit, firstDay, rangeEnd)
    }
    if (possible === 0) return null

    const relevantCheckIns =
      selectedHabitId === 'all' ? checkIns : checkIns.filter((c) => c.habit_id === selectedHabitId)

    // Clamp a 100: un check-in fechado antes de la creación del hábito (solo posible con
    // datos de prueba insertados a mano) no debería mostrar un porcentaje absurdo.
    return Math.min(100, Math.round((relevantCheckIns.length / possible) * 100))
  }, [selectedHabitId, habits, checkIns, firstDay, lastDay, isCurrentMonth, now])

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

  function detailTextFor(day) {
    const dateStr = toISODate(new Date(viewYear, viewMonth, day))
    const count = countsByDate[dateStr] || 0
    const label = `${day} de ${MONTH_LABELS[viewMonth].toLowerCase()}`
    if (count === 0 || total === 0) {
      return `${label} — Sin datos`
    }
    return `${label} — ${count} de ${total} hábito${total === 1 ? '' : 's'} completado${count === 1 ? '' : 's'}`
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

      <p className="heatmap-summary">
        {monthSummary === null
          ? 'Sin datos suficientes para este mes todavía.'
          : `Este mes completaste el ${monthSummary}% de tus hábitos.`}
      </p>

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
                <button
                  type="button"
                  key={dateStr}
                  className={`heatmap-cell heatmap-level-${level}`}
                  onMouseEnter={() => setActiveDate(day)}
                  onClick={() => setActiveDate(day)}
                >
                  <span className="heatmap-day-number">{day}</span>
                </button>
              )
            })}
          </div>

          <p className="heatmap-detail">
            {activeDate === null
              ? 'Toca o pasa el mouse sobre un día para ver el detalle.'
              : detailTextFor(activeDate)}
          </p>

          <div className="heatmap-legend">
            <div className="heatmap-legend-scale">
              {LEGEND_LEVELS.map((level) => (
                <span key={level} className={`heatmap-cell heatmap-legend-swatch heatmap-level-${level}`} />
              ))}
            </div>
            <span className="heatmap-legend-label">
              Más oscuro = menos completado · Dorado intenso = día perfecto
            </span>
          </div>
        </>
      )}
    </div>
  )
}
