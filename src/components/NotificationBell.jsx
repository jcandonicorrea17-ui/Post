import { useEffect, useRef, useState } from 'react'
import BellIcon from './BellIcon.jsx'
import '../styles/NotificationBell.css'

const TOOLTIP_AUTO_HIDE_MS = 4500

// Ícono de campana fijo en el header — reemplaza el toggle que vivía en una
// pantalla de Ajustes aparte. Vive en Dashboard.jsx, así que se ve en las 3
// pantallas principales (Hoy, Progreso, Mis Hábitos) sin duplicar código.
// `notif` viene de useNotificationBell(), instanciado una sola vez en
// Dashboard.jsx y compartido con la 4ª pantalla del welcome tour — así ambos
// reflejan el mismo estado real en vez de cada uno chequear por su cuenta.
// El toast (notif.toast) lo renderiza Dashboard.jsx una sola vez, no acá, para
// no mostrarlo duplicado mientras el welcome tour también está montado.
export default function NotificationBell({ notif }) {
  const { busy, animate, on, inactive, iosNeedsInstall, toggle } = notif
  const [tooltip, setTooltip] = useState(null)
  const tooltipTimeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(tooltipTimeoutRef.current), [])

  function showTooltip(message) {
    setTooltip(message)
    clearTimeout(tooltipTimeoutRef.current)
    tooltipTimeoutRef.current = setTimeout(() => setTooltip(null), TOOLTIP_AUTO_HIDE_MS)
  }

  function handleClick() {
    if (iosNeedsInstall) {
      showTooltip(
        'Para recibir recordatorios en iPhone: toca Compartir → Añadir a pantalla de inicio, y abre Racha desde ese ícono.'
      )
      return
    }
    if (inactive) {
      showTooltip('Las notificaciones no están disponibles en este navegador.')
      return
    }
    if (busy) return
    toggle()
  }

  return (
    <div className="notification-bell-wrap">
      <button
        type="button"
        className="notification-bell"
        onClick={handleClick}
        aria-label={
          inactive
            ? 'Notificaciones no disponibles'
            : on
              ? 'Desactivar notificaciones de recordatorio'
              : 'Activar notificaciones de recordatorio'
        }
        aria-pressed={on}
      >
        <BellIcon on={on} inactive={inactive} animate={animate} />
      </button>
      {tooltip && <div className="notification-bell-tooltip">{tooltip}</div>}
    </div>
  )
}
