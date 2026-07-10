import { useEffect, useRef, useState } from 'react'
import { requestNotificationPermission } from '../lib/notifications'
import {
  isIOS,
  isStandalonePWA,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentPushSubscription,
} from '../lib/push'

const ANIMATE_MS = 500
const TOAST_DURATION_MS = 2800 // debe calzar con la duración del keyframe en Toast.css

// Estado y lógica de la suscripción push — compartidos entre el ícono de
// campana del header (NotificationBell.jsx) y la 4ª pantalla del welcome tour
// (WelcomeTour.jsx). Ambos disparan exactamente el mismo flujo; solo cambia
// cómo cada uno presenta el resultado en pantalla.
export function useNotificationBell(userId) {
  const [subscribed, setSubscribed] = useState(null) // null = todavía verificando
  const [busy, setBusy] = useState(false)
  const [animate, setAnimate] = useState(false)
  const [toast, setToast] = useState(null) // { key, message, variant } | null
  const animateTimeoutRef = useRef(null)
  const toastTimeoutRef = useRef(null)
  const toastKeyRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    getCurrentPushSubscription()
      .then((sub) => {
        if (!cancelled) setSubscribed(Boolean(sub))
      })
      .catch(() => {
        if (!cancelled) setSubscribed(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(
    () => () => {
      clearTimeout(animateTimeoutRef.current)
      clearTimeout(toastTimeoutRef.current)
    },
    []
  )

  const iosNeedsInstall = isIOS() && !isStandalonePWA()
  const unsupported = !iosNeedsInstall && !isPushSupported()
  const inactive = iosNeedsInstall || unsupported
  const on = Boolean(subscribed) && !inactive

  function playFeedback() {
    setAnimate(true)
    clearTimeout(animateTimeoutRef.current)
    animateTimeoutRef.current = setTimeout(() => setAnimate(false), ANIMATE_MS)
  }

  // key incremental para forzar un remount de <Toast> (y así reiniciar la
  // animación) aunque dos toasts seguidos tengan el mismo texto.
  function showToast(message, variant = 'info') {
    toastKeyRef.current += 1
    setToast({ key: toastKeyRef.current, message, variant })
    clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }

  async function activate() {
    if (busy || subscribed === null || inactive || subscribed) return
    setBusy(true)
    try {
      const permission = await requestNotificationPermission()
      if (permission !== 'granted') {
        showToast(
          permission === 'denied'
            ? 'Bloqueaste las notificaciones para Racha. Actívalas desde los ajustes de tu navegador.'
            : 'No se activaron las notificaciones.',
          'error'
        )
        return
      }
      await subscribeToPush(userId)
      setSubscribed(true)
      playFeedback()
      showToast('🔔 Recordatorios activados')
    } catch (err) {
      console.error('Error activando push:', err.message)
      showToast('No se pudo activar el recordatorio en este dispositivo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function deactivate() {
    if (busy || subscribed === null || inactive || !subscribed) return
    setBusy(true)
    try {
      await unsubscribeFromPush()
      setSubscribed(false)
      playFeedback()
      showToast('Recordatorios desactivados')
    } catch (err) {
      console.error('Error desactivando push:', err.message)
      showToast('No se pudo actualizar el recordatorio en este dispositivo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function toggle() {
    if (subscribed) await deactivate()
    else await activate()
  }

  return {
    subscribed,
    busy,
    animate,
    toast,
    on,
    inactive,
    iosNeedsInstall,
    unsupported,
    activate,
    deactivate,
    toggle,
  }
}
