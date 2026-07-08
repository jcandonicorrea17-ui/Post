import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getHabits, getCheckInsForRange, deleteHabit as deleteHabitApi } from '../lib/api'
import { toISODate, daysAgo } from '../lib/dates'
import { calculateHabitScore, averageScore } from '../lib/habitScore'
import Today from './Today.jsx'
import Heatmap from './Heatmap.jsx'
import HabitCard from '../components/HabitCard.jsx'
import CreateHabitModal from '../components/CreateHabitModal.jsx'
import '../styles/Dashboard.css'

const SCORE_WINDOW_DAYS = 30

export default function Dashboard({ session, profile }) {
  const [view, setView] = useState('today') // 'today' | 'heatmap' | 'habits'
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [habitScores, setHabitScores] = useState({})

  const loadHabits = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getHabits(session.user.id)
      setHabits(data)
    } catch (err) {
      console.error('Error cargando hábitos:', err.message)
    } finally {
      setLoading(false)
    }
  }, [session.user.id])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  const loadHabitScores = useCallback(async () => {
    try {
      const start = toISODate(daysAgo(SCORE_WINDOW_DAYS - 1))
      const end = toISODate(new Date())
      const checkIns = await getCheckInsForRange(session.user.id, start, end)
      const datesByHabit = {}
      for (const c of checkIns) {
        if (!datesByHabit[c.habit_id]) datesByHabit[c.habit_id] = []
        datesByHabit[c.habit_id].push(c.date)
      }
      const scores = {}
      for (const habit of habits) {
        scores[habit.id] = calculateHabitScore(habit.created_at, datesByHabit[habit.id] || [])
      }
      setHabitScores(scores)
    } catch (err) {
      console.error('Error calculando habit score:', err.message)
    }
  }, [session.user.id, habits])

  useEffect(() => {
    if (view === 'habits' && habits.length > 0) {
      loadHabitScores()
    }
  }, [view, habits, loadHabitScores])

  const generalAverage = averageScore(Object.values(habitScores))

  async function handleDelete(habitId) {
    if (!window.confirm('¿Eliminar este hábito? Esta acción no se puede deshacer.')) return
    try {
      await deleteHabitApi(habitId)
      setHabits((prev) => prev.filter((h) => h.id !== habitId))
    } catch (err) {
      console.error('Error eliminando hábito:', err.message)
    }
  }

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <span className="dashboard-brand">Racha</span>
        {profile?.username && <span className="dashboard-username">{profile.username}</span>}
        <button type="button" className="dashboard-logout" onClick={() => supabase.auth.signOut()}>
          Salir
        </button>
      </header>

      <main className="dashboard-content">
        <div key={view} className="view-transition">
        {view === 'today' && (
          <Today session={session} habits={habits} loading={loading} />
        )}

        {view === 'heatmap' && <Heatmap session={session} habits={habits} />}

        {view === 'habits' && (
          <div className="habits-view">
            <div className="habits-view-header">
              <h2>Mis Hábitos</h2>
              <button
                type="button"
                className="btn-primary habits-new-btn"
                onClick={() => setShowCreateModal(true)}
              >
                + Nuevo hábito
              </button>
            </div>

            {habits.length > 0 && (
              <p className="habits-general-average">
                Promedio general:{' '}
                <strong>{generalAverage === null ? 'Sin datos aún' : `${generalAverage}%`}</strong>
              </p>
            )}

            {loading && <p className="dashboard-empty">Cargando...</p>}
            {!loading && habits.length === 0 && (
              <p className="dashboard-empty">Aún no tienes hábitos. Crea el primero.</p>
            )}

            <div className="habits-list">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  score={habitScores[habit.id]}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            <a
              href="https://tally.so/r/ja2XD4"
              target="_blank"
              rel="noopener noreferrer"
              className="feedback-link"
            >
              💬 ¿Tienes una idea? Cuéntanosla
            </a>
          </div>
        )}
        </div>
      </main>

      <nav className="dashboard-nav">
        <button
          type="button"
          className={view === 'today' ? 'nav-item active' : 'nav-item'}
          onClick={() => setView('today')}
        >
          <span className="nav-icon">📅</span>
          <span>Hoy</span>
        </button>
        <button
          type="button"
          className={view === 'heatmap' ? 'nav-item active' : 'nav-item'}
          onClick={() => setView('heatmap')}
        >
          <span className="nav-icon">📊</span>
          <span>Progreso</span>
        </button>
        <button
          type="button"
          className={view === 'habits' ? 'nav-item active' : 'nav-item'}
          onClick={() => setView('habits')}
        >
          <span className="nav-icon">📝</span>
          <span>Mis Hábitos</span>
        </button>
      </nav>

      {showCreateModal && (
        <CreateHabitModal
          session={session}
          onClose={() => setShowCreateModal(false)}
          onCreated={(habit) => {
            setHabits((prev) => [...prev, habit])
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}
