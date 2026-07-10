// TODO: quitar debug timezone — componente temporal para verificar visualmente
// el fix del bug de timezone en check-ins/rachas. Borrar este archivo y su
// import/uso en Today.jsx una vez confirmado en producción.
import { useEffect, useState } from 'react'
import { getDeviceTimeZone, nextLocalMidnight } from '../lib/dates'

export default function TimezoneDebug({ localDate }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeZone = getDeviceTimeZone()
  const resetAt = nextLocalMidnight(now)

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #F5C518',
        borderRadius: 8,
        padding: '10px 14px',
        margin: '0 0 16px',
        fontSize: 12,
        color: '#F5C518',
        fontFamily: 'monospace',
        lineHeight: 1.6,
      }}
    >
      <div>🐛 DEBUG TIMEZONE (quitar antes de producción)</div>
      <div>timezone: {timeZone}</div>
      <div>ahora (local): {now.toLocaleString('es-ES', { timeZone })}</div>
      <div>día usado para check-in: {localDate}</div>
      <div>reinicio del día: {resetAt.toLocaleString('es-ES', { timeZone })}</div>
    </div>
  )
}
