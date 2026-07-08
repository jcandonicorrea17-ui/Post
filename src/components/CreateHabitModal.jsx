import { useState } from 'react'
import { createHabit } from '../lib/api'
import HabitTemplates from './HabitTemplates.jsx'
import '../styles/CreateHabitModal.css'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function CreateHabitModal({ session, onClose, onCreated }) {
  const [showTemplates, setShowTemplates] = useState(true)
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

  function applyTemplate(template) {
    setName(template.name)
    setIdentityPhrase(template.identityPhrase)
    setFrequencyType(template.frequency.type)
    setSelectedDays(template.frequency.type === 'weekly' ? template.frequency.days : [])
    setShowTemplates(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

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

    setLoading(true)
    try {
      const habit = await createHabit(session.user.id, {
        name: name.trim(),
        identityPhrase: identityPhrase.trim(),
        frequency,
      })
      onCreated(habit)
    } catch (err) {
      setError(err.message || 'No se pudo crear el hábito.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="onboarding-title">Nuevo hábito</h2>

        {showTemplates ? (
          <>
            <p className="onboarding-subtitle">Elige una plantilla o crea uno personalizado.</p>
            <HabitTemplates onSelect={applyTemplate} />
            <button
              type="button"
              className="btn-secondary onboarding-cta"
              onClick={() => setShowTemplates(false)}
            >
              Crear personalizado
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </>
        ) : (
          <form className="onboarding-form" onSubmit={handleSubmit}>
            <button
              type="button"
              className="onboarding-switch"
              onClick={() => setShowTemplates(true)}
            >
              ‹ Ver plantillas
            </button>

            <input
              type="text"
              className="input-field"
              placeholder="Nombre del hábito"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <input
              type="text"
              className="input-field"
              placeholder="Identity phrase (opcional)"
              value={identityPhrase}
              onChange={(e) => setIdentityPhrase(e.target.value)}
            />

            <div className="frequency-toggle">
              <button
                type="button"
                className={
                  frequencyType === 'daily' ? 'frequency-option active' : 'frequency-option'
                }
                onClick={() => setFrequencyType('daily')}
              >
                Diario
              </button>
              <button
                type="button"
                className={
                  frequencyType === 'weekly' ? 'frequency-option active' : 'frequency-option'
                }
                onClick={() => setFrequencyType('weekly')}
              >
                Semanal
              </button>
            </div>

            {frequencyType === 'weekly' && (
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
            )}

            {error && <p className="error-message">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
