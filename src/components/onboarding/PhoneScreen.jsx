import { useState } from 'react'
import { updateProfile } from '../../lib/api'

export default function PhoneScreen({ session, onNext }) {
  const [phone, setPhone] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleContinue() {
    setLoading(true)
    setError('')
    try {
      await updateProfile(session.user.id, {
        phone: phone || null,
        marketing_opt_in: marketingOptIn,
      })
      onNext()
    } catch (err) {
      setError(err.message || 'No se pudo guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-step">
      <h2 className="onboarding-title">Déjanos tu teléfono</h2>
      <p className="onboarding-subtitle">Opcional, pero te ayuda a no perder tu progreso.</p>

      <input
        type="tel"
        className="input-field"
        placeholder="Teléfono (opcional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />

      <label className="onboarding-checkbox">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
        />
        <span>Quiero recibir novedades y promociones por email o WhatsApp.</span>
      </label>

      <p className="onboarding-disclaimer">Nunca compartimos tu información.</p>

      {error && <p className="error-message">{error}</p>}

      <button
        type="button"
        className="btn-primary onboarding-cta"
        onClick={handleContinue}
        disabled={loading}
      >
        {loading ? 'Guardando...' : 'Continuar'}
      </button>
    </div>
  )
}
