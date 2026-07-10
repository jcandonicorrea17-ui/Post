import { upsertPushSubscription, deletePushSubscription } from './api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// pushManager.subscribe() exige la VAPID public key como Uint8Array, no como
// el string base64url que entrega el generador de claves.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0))
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    Boolean(VAPID_PUBLIC_KEY)
  )
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// display-mode: standalone cubre Android/desktop; navigator.standalone es la
// forma en que Safari/iOS expone lo mismo (no soporta la media query).
export function isStandalonePWA() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
  )
}

// Registra la suscripción push del dispositivo y la guarda en Supabase.
// Se llama justo después de que el usuario da permiso de notificaciones.
export async function subscribeToPush(userId) {
  if (!isPushSupported()) return null

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const { endpoint, keys } = subscription.toJSON()
  await upsertPushSubscription(userId, {
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  })

  return subscription
}

// Suscripción push activa de este dispositivo, o null si nunca se suscribió
// (o el navegador no soporta push). Es la fuente de verdad real de "¿está
// activado?" — no basta con mirar el permiso del navegador, porque el
// usuario puede tener el permiso concedido pero haber desactivado el toggle.
export async function getCurrentPushSubscription() {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

// Revoca la suscripción en el navegador Y borra la fila en Supabase — sin
// esto último, la Edge Function seguiría intentando (y fallando) mandarle
// push a un endpoint que el propio dispositivo ya invalidó.
export async function unsubscribeFromPush() {
  const subscription = await getCurrentPushSubscription()
  if (!subscription) return

  const { endpoint } = subscription.toJSON()
  await subscription.unsubscribe()
  await deletePushSubscription(endpoint)
}
