import { useState } from 'react'
import { getNotificationPermission, requestNotificationPermission } from '../lib/notifications'
import { isIOS, isStandalonePWA, isPushSupported, subscribeToPush } from '../lib/push'
import '../styles/NotificationsBanner.css'

const IOS_DISMISS_KEY = 'racha_ios_push_banner_dismissed'

export default function NotificationsBanner({ session }) {
  const [permission, setPermission] = useState(getNotificationPermission())
  const [error, setError] = useState('')
  const [iosDismissed, setIosDismissed] = useState(
    () => localStorage.getItem(IOS_DISMISS_KEY) === '1'
  )

  // iOS solo soporta push si la PWA está instalada en pantalla de inicio (iOS
  // 16.4+); desde Safari normal, Notification ni siquiera existe en window,
  // así que sin este aviso el usuario no tendría ninguna pista de por qué.
  if (isIOS() && !isStandalonePWA()) {
    if (iosDismissed) return null
    return (
      <div className="notifications-banner">
        <span>
          Para recibir recordatorios en iPhone: toca <strong>Compartir</strong> →{' '}
          <strong>Añadir a pantalla de inicio</strong>, y abre Racha desde ese ícono.
        </span>
        <button
          type="button"
          className="btn-secondary notifications-banner-btn"
          onClick={() => {
            localStorage.setItem(IOS_DISMISS_KEY, '1')
            setIosDismissed(true)
          }}
        >
          Entendido
        </button>
      </div>
    )
  }

  if (permission !== 'default') return null

  async function handleEnable() {
    setError('')
    const result = await requestNotificationPermission()
    setPermission(result)

    if (result === 'granted' && isPushSupported()) {
      try {
        await subscribeToPush(session.user.id)
      } catch (err) {
        console.error('Error al suscribir push:', err.message)
        setError('No se pudo activar el recordatorio en este dispositivo. Intenta de nuevo.')
      }
    }
  }

  return (
    <div className="notifications-banner">
      <span>Activa recordatorios diarios para no perder tu racha.</span>
      <button type="button" className="btn-secondary notifications-banner-btn" onClick={handleEnable}>
        Activar
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  )
}
