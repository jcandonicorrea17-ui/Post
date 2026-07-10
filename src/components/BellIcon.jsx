import '../styles/BellIcon.css'

// Ícono de campana compartido — usado tal cual por NotificationBell.jsx (header)
// y por la 4ª pantalla del welcome tour, para no duplicar el SVG ni sus estados.
export default function BellIcon({ on, inactive, animate, size = 20 }) {
  const className = [
    'bell-icon',
    on ? 'on' : 'off',
    inactive ? 'inactive' : '',
    animate ? 'animate' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path d="M12 3a1 1 0 0 1 1 1v.6A6.5 6.5 0 0 1 18.5 11v3.2l1.6 2.1a1 1 0 0 1-.8 1.6H4.7a1 1 0 0 1-.8-1.6l1.6-2.1V11A6.5 6.5 0 0 1 11 4.6V4a1 1 0 0 1 1-1Z" />
      <path d="M9.6 18.6a2.4 2.4 0 0 0 4.8 0z" />
    </svg>
  )
}
