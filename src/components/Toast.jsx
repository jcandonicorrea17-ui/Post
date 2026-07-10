import '../styles/Toast.css'

// Toast genérico, reutilizable: el llamador controla cuánto dura montado (ver
// NotificationBell.jsx) — la duración del keyframe en Toast.css debe calzar
// con ese tiempo para que no haya un salto brusco al desmontar.
export default function Toast({ message, variant = 'info' }) {
  return (
    <div className={variant === 'error' ? 'toast toast-error' : 'toast'} role="status">
      {message}
    </div>
  )
}
