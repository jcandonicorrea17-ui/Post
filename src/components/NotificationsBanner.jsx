import { useState } from 'react'
import { getNotificationPermission, requestNotificationPermission } from '../lib/notifications'
import '../styles/NotificationsBanner.css'

export default function NotificationsBanner() {
  const [permission, setPermission] = useState(getNotificationPermission())

  if (permission !== 'default') return null

  async function handleEnable() {
    const result = await requestNotificationPermission()
    setPermission(result)
  }

  return (
    <div className="notifications-banner">
      <span>Activa recordatorios diarios para no perder tu racha.</span>
      <button type="button" className="btn-secondary notifications-banner-btn" onClick={handleEnable}>
        Activar
      </button>
    </div>
  )
}
