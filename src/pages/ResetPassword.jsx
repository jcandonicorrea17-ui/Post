import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/Onboarding.css'

// Se llega aquí desde el link del email de recuperación (resetPasswordForEmail
// con redirectTo: `${origin}/reset-password`). Supabase-js procesa el token de
// la URL al cargar el cliente y dispara el evento PASSWORD_RECOVERY con una
// sesión temporal — esa sesión es la que permite updateUser({ password }).
export default function ResetPassword() {
  const [ready, setReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let settled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        settled = true
        setReady(true)
      }
    })

    // Si el evento ya se disparó antes de montar este componente, ya habrá sesión.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!settled && session) {
        settled = true
        setReady(true)
      }
    })

    // El link es inválido o expiró si tras unos segundos no hay sesión de recuperación.
    const timeout = setTimeout(() => {
      if (!settled) setInvalidLink(true)
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await supabase.auth.signOut()
      setDone(true)
      setTimeout(() => {
        window.location.href = '/'
      }, 2500)
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la contraseña. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="onboarding-screen">
        <div className="onboarding-step onboarding-step-center">
          <h2 className="onboarding-title">Contraseña actualizada</h2>
          <p className="onboarding-subtitle">Ya puedes iniciar sesión con tu nueva contraseña.</p>
        </div>
      </div>
    )
  }

  if (invalidLink) {
    return (
      <div className="onboarding-screen">
        <div className="onboarding-step onboarding-step-center">
          <h2 className="onboarding-title">Enlace inválido o expirado</h2>
          <p className="onboarding-subtitle">
            Solicita un nuevo enlace de recuperación desde la pantalla de inicio de sesión.
          </p>
          <a className="btn-primary onboarding-cta" href="/">
            Ir a iniciar sesión
          </a>
        </div>
      </div>
    )
  }

  if (!ready) {
    return <div className="app-loading" />
  }

  return (
    <div className="onboarding-screen">
      <div className="onboarding-step">
        <h2 className="onboarding-title">Nueva contraseña</h2>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <input
            type="password"
            className="input-field"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <input
            type="password"
            className="input-field"
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-primary onboarding-cta" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
