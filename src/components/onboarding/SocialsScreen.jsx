import { useState } from 'react'
import { updateProfile } from '../../lib/api'

const SOCIALS = [
  { name: 'Instagram', url: 'https://www.instagram.com/zonaimpacto.es/', icon: '📷' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@zonaimpacto.es', icon: '🎵' },
]

export default function SocialsScreen({ session, onNext }) {
  const [loading, setLoading] = useState(false)

  function openSocial(url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleContinue(followed) {
    setLoading(true)
    try {
      await updateProfile(session.user.id, { followed_socials: followed })
    } catch (err) {
      console.error('Error guardando redes:', err.message)
    } finally {
      setLoading(false)
      onNext()
    }
  }

  return (
    <div className="onboarding-step">
      <h2 className="onboarding-title">Síguenos en redes</h2>
      <p className="onboarding-subtitle">Bonus opcional — no es obligatorio para continuar.</p>

      <div className="socials-list">
        {SOCIALS.map((social) => (
          <button
            key={social.name}
            type="button"
            className="social-card"
            onClick={() => openSocial(social.url)}
          >
            <span className="social-icon">{social.icon}</span>
            <span>{social.name}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn-primary onboarding-cta"
        onClick={() => handleContinue(true)}
        disabled={loading}
      >
        Sígueme y continuar
      </button>
      <button
        type="button"
        className="onboarding-switch"
        onClick={() => handleContinue(false)}
        disabled={loading}
      >
        Omitir
      </button>
    </div>
  )
}
