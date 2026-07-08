const STORAGE_KEY = 'racha_reminder_last_shown'

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.requestPermission()
}

function todayKey() {
  return new Date().toISOString().split('T')[0]
}

// Recordatorio local: solo se muestra si la app está abierta (no es push real en segundo plano).
export async function maybeShowDailyReminder(pendingCount) {
  if (!isNotificationSupported()) return
  if (Notification.permission !== 'granted') return
  if (pendingCount <= 0) return
  if (localStorage.getItem(STORAGE_KEY) === todayKey()) return

  const title = 'Racha'
  const body =
    pendingCount === 1
      ? 'Te queda 1 hábito por completar hoy.'
      : `Te quedan ${pendingCount} hábitos por completar hoy.`

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, { body, icon: '/icon-192.png' })
    } else {
      new Notification(title, { body, icon: '/icon-192.png' })
    }
    localStorage.setItem(STORAGE_KEY, todayKey())
  } catch (err) {
    console.error('No se pudo mostrar la notificación:', err)
  }
}
