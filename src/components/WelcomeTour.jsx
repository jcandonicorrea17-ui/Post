import { useEffect, useRef, useState } from 'react'
import BellIcon from './BellIcon.jsx'
import '../styles/TodayHabitCard.css'
import '../styles/Onboarding.css'
import '../styles/WelcomeTour.css'

const SLIDE_COUNT = 4
const SWIPE_THRESHOLD_PX = 50

const FAKE_HABITS = [
  { name: 'Meditar 10 minutos', done: true },
  { name: 'Leer antes de dormir', done: false },
  { name: 'Sin redes sociales hasta el mediodía', done: false },
]

const WEEK_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const CELL_INTERVAL_MS = 350
const PAUSE_AFTER_FULL_MS = 1000

// Ilumina las 7 casillas una por una y, al llegar a la última, espera un
// segundo y reinicia — así la animación nunca se ve "muerta" si el usuario
// se queda parado en esta pantalla.
function WeekStreakDemo({ active }) {
  const [lit, setLit] = useState(0)

  useEffect(() => {
    if (!active) {
      setLit(0)
      return
    }

    let cancelled = false
    let timeoutId

    function step(n) {
      if (cancelled) return
      setLit(n)
      const delay = n >= WEEK_LABELS.length ? PAUSE_AFTER_FULL_MS : CELL_INTERVAL_MS
      timeoutId = setTimeout(() => step(n >= WEEK_LABELS.length ? 0 : n + 1), delay)
    }
    step(0)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [active])

  const complete = lit === WEEK_LABELS.length

  return (
    <>
      <div className={complete ? 'tour-week-grid complete' : 'tour-week-grid'}>
        {WEEK_LABELS.map((label, i) => (
          <span key={i} className={i < lit ? 'weekday tour-week-cell lit' : 'weekday tour-week-cell'}>
            {label}
          </span>
        ))}
      </div>
      <p className="tour-streak-counter">
        🔥 {lit} día{lit === 1 ? '' : 's'} seguido{lit === 1 ? '' : 's'}
      </p>
    </>
  )
}

export default function WelcomeTour({ notif, onFinish }) {
  const [index, setIndex] = useState(0)
  const dragStartX = useRef(null)
  const [dragDeltaPx, setDragDeltaPx] = useState(0)

  function goTo(i) {
    setIndex(Math.max(0, Math.min(SLIDE_COUNT - 1, i)))
  }

  function handleNext() {
    if (index === SLIDE_COUNT - 1) {
      onFinish()
    } else {
      goTo(index + 1)
    }
  }

  function handleTouchStart(e) {
    dragStartX.current = e.touches[0].clientX
  }

  function handleTouchMove(e) {
    if (dragStartX.current === null) return
    setDragDeltaPx(e.touches[0].clientX - dragStartX.current)
  }

  function handleTouchEnd() {
    if (dragDeltaPx <= -SWIPE_THRESHOLD_PX) goTo(index + 1)
    else if (dragDeltaPx >= SWIPE_THRESHOLD_PX) goTo(index - 1)
    dragStartX.current = null
    setDragDeltaPx(0)
  }

  return (
    <div className="tour-overlay">
      <button type="button" className="tour-skip" onClick={onFinish}>
        Saltar
      </button>

      <div
        className="tour-track"
        style={{ transform: `translateX(calc(${-index * 100}% + ${dragDeltaPx}px))` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="tour-slide">
          <p className="tour-message">
            Esto es tu día. Cada hábito que ves aquí es algo que quieres hacer hoy.
          </p>
          <div className="tour-mockup tour-mockup-today">
            {FAKE_HABITS.map((habit) => (
              <div key={habit.name} className="today-habit-card">
                <div className="today-habit-check-wrap">
                  <span className={habit.done ? 'check-circle done' : 'check-circle'}>
                    {habit.done ? '✓' : '○'}
                  </span>
                </div>
                <div className="today-habit-info">
                  <span className="today-habit-name">{habit.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tour-slide">
          <p className="tour-message">Toca el círculo cuando lo completes.</p>
          <div className="tour-mockup tour-mockup-tap">
            <span className="tour-demo-circle" aria-hidden="true">
              <span className="tour-tap-ripple" />
              <span className="tour-demo-mark tour-demo-mark-empty">○</span>
              <span className="tour-demo-mark tour-demo-mark-done">✓</span>
            </span>
          </div>
        </div>

        <div className="tour-slide">
          <p className="tour-message">
            Cuantos más días seguidos lo hagas, más crece tu racha 🔥
          </p>
          <div className="tour-mockup tour-mockup-heatmap">
            <WeekStreakDemo active={index === 2} />
          </div>
        </div>

        <div className="tour-slide">
          <p className="tour-message">Activa recordatorios para no perder tu racha 🔔</p>

          <div className="tour-mockup tour-mockup-notifications">
            <BellIcon on={notif.on} inactive={notif.inactive} animate={notif.animate} size={64} />

            {notif.inactive && (
              <p className="tour-notif-note">
                {notif.iosNeedsInstall
                  ? 'Para recibir recordatorios en iPhone, instala Racha en tu pantalla de inicio (Compartir → Añadir a pantalla de inicio) y actívalas después desde la campana.'
                  : 'Las notificaciones no están disponibles en este navegador.'}
              </p>
            )}

            {!notif.inactive && notif.subscribed && (
              <p className="tour-notif-note">Ya tienes los recordatorios activados.</p>
            )}

            {notif.inactive || notif.subscribed ? (
              <button type="button" className="btn-primary onboarding-cta" onClick={onFinish}>
                Continuar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-primary onboarding-cta"
                  onClick={notif.activate}
                  disabled={notif.busy || notif.subscribed === null}
                >
                  {notif.busy ? 'Activando...' : 'Activar ahora'}
                </button>
                <button type="button" className="onboarding-switch" onClick={onFinish}>
                  Ahora no
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="tour-footer">
        <div className="tour-dots">
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <span key={i} className={i === index ? 'tour-dot active' : 'tour-dot'} />
          ))}
        </div>
        {index !== SLIDE_COUNT - 1 && (
          <button type="button" className="btn-primary tour-next" onClick={handleNext}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  )
}
