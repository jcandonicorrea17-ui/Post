import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { getProfile, updateProfileTimezone } from './lib/api'
import { getDeviceTimeZone } from './lib/dates'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ResetPassword from './pages/ResetPassword.jsx'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  const loadProfile = useCallback(async (userId) => {
    try {
      const data = await getProfile(userId)
      setProfile(data)

      // Mantiene profiles.timezone al día con el timezone real del dispositivo
      // (puede cambiar si el usuario viaja) para que cálculos server-side lo
      // puedan usar en vez de asumir UTC.
      const deviceTimeZone = getDeviceTimeZone()
      if (data.timezone !== deviceTimeZone) {
        try {
          await updateProfileTimezone(userId, deviceTimeZone)
        } catch (err) {
          console.error('Error guardando timezone:', err.message)
        }
      }
    } catch (err) {
      console.error('Error cargando perfil:', err.message)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      if (currentSession) loadProfile(currentSession.user.id)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      if (currentSession) {
        loadProfile(currentSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  // El link del email de recuperación redirige aquí (fuera del flujo normal de
  // sesión/onboarding) sin importar si ya hay o no una sesión previa activa.
  if (window.location.pathname === '/reset-password') {
    return <ResetPassword />
  }

  // Sesión aún no resuelta (undefined = cargando)
  if (session === undefined) {
    return <div className="app-loading" />
  }

  if (!session) {
    return <Onboarding session={null} profile={null} onComplete={() => {}} />
  }

  if (!profile) {
    return <div className="app-loading" />
  }

  if (!profile.onboarding_completed) {
    return (
      <Onboarding
        session={session}
        profile={profile}
        onComplete={() => loadProfile(session.user.id)}
      />
    )
  }

  return <Dashboard session={session} profile={profile} />
}
