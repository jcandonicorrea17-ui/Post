import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { getProfile } from './lib/api'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  const loadProfile = useCallback(async (userId) => {
    try {
      const data = await getProfile(userId)
      setProfile(data)
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
