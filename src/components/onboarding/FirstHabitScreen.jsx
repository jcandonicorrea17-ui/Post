import { useState } from 'react'
import { createHabit, updateProfile } from '../../lib/api'
import { formatWeeklyDaysHint } from '../../lib/dates'
import HabitTemplates from '../HabitTemplates.jsx'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function FirstHabitScreen({ session, onComplete }) {
  const [view, setView] = useState('choice') // 'choice' | 'templates' | 'custom'
  const [name, setName] = useState('')
  const [identityPhrase, setIdentityPhrase] = useState('')
  const [frequencyType, setFrequencyType] = useState('daily')
  const [selectedDays, setSelectedDays] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleDay(index) {
    setSelectedDays((days) =>
      days.includes(index) ? days.filter((d) => d !== index) : [...days, index]
    )
  }

  async function finish(habitData) {
    setError('')
    setLoading(true)
    try {
      await createHabit(session.user.id, habitData)
      await updateProfile(session.user.id, { onboarding_completed: true })
      onComplete()
    } catch (err) {
      setError(err.message || 'No se pudo crear el hábito.')
      setLoading(false)
    }
  }

  async function handleTemplateSelect(template) {
    await finish({
      name: template.name,
      identityPhrase: template.identityPhrase,
      frequency: template.frequency,
    })
  }

  async function handleCustomSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre del hábito es obligatorio.')
      return
    }
    if (frequencyType === 'weekly' && selectedDays.length === 0) {
      setError('Selecciona al menos un día.')
      return
    }

    const frequency =
      frequencyType === 'daily' ? { type: 'daily' } : { type: 'weekly', days: selectedDays }

    await finish({ name: name.trim(), identityPhrase: identityPhrase.trim(), frequency })
  }

  if (view === 'choice') {
    return (
      <div className="onboarding-step">
        <h2 className="onboarding-title">Crea tu primer hábito</h2>
        <p className="onboarding-subtitle">Elige una plantilla o crea el tuyo desde cero.</p>
        <button
          type="button"
          className="btn-primary onboarding-cta"
          onClick={() => setView('templates')}
        >
          Ver plantillas
        </button>
        <button
          type="button"
          className="btn-secondary onboarding-cta"
          onClick={() => setView('custom')}
        >
          Crear personalizado
        </button>
      </div>
    )
  }

  if (view === 'templates') {
    return (
      <div className="onboarding-step">
        <h2 className="onboarding-title">Elige una plantilla</h2>
        {error && <p className="error-message">{error}</p>}
        <HabitTemplates onSelect={handleTemplateSelect} />
        <button
          type="button"
          className="onboarding-switch"
          onClick={() => setView('choice')}
          disabled={loading}
        >
          Volver
        </button>
      </div>
    )
  }

  const weeklyDaysHint = formatWeeklyDaysHint(selectedDays)

  return (
    <div className="onboarding-step">
      <h2 className="onboarding-title">Crea tu hábito</h2>

      <form className="onboarding-form" onSubmit={handleCustomSubmit}>
        <input
          type="text"
          className="input-field"
          placeholder="Nombre del hábito"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          className="input-field"
          placeholder="Identity phrase (ej. Soy alguien que...)"
          value={identityPhrase}
          onChange={(e) => setIdentityPhrase(e.target.value)}
        />

        <div className="frequency-toggle">
          <button
            type="button"
            className={frequencyType === 'daily' ? 'frequency-option active' : 'frequency-option'}
            onClick={() => setFrequencyType('daily')}
          >
            Diario
          </button>
          <button
            type="button"
            className={frequencyType === 'weekly' ? 'frequency-option active' : 'frequency-option'}
            onClick={() => setFrequencyType('weekly')}
          >
            Semanal
          </button>
        </div>

        {frequencyType === 'weekly' && (
          <>
            <div className="weekday-picker">
              {WEEKDAYS.map((label, index) => (
                <button
                  key={index}
                  type="button"
                  className={selectedDays.includes(index) ? 'weekday active' : 'weekday'}
                  onClick={() => toggleDay(index)}
                >
                  {label}
                </button>
              ))}
            </div>
            {weeklyDaysHint && (
              <p className="weekday-hint">
                Este hábito solo aparecerá en &quot;Hoy&quot; {weeklyDaysHint}.
              </p>
            )}
          </>
        )}

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="btn-primary onboarding-cta" disabled={loading}>
          {loading ? 'Creando...' : 'Crear hábito'}
        </button>
      </form>

      <button
        type="button"
        className="onboarding-switch"
        onClick={() => setView('choice')}
        disabled={loading}
      >
        Volver
      </button>
    </div>
  )
}
