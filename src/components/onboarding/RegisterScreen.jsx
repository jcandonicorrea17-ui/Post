import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function RegisterScreen({ onRegistered }) {
  const [mode, setMode] = useState('signup') // 'signup' | 'login' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (mode === 'forgot') {
      if (!email) {
        setError('Ingresa tu email.')
        return
      }
      setLoading(true)
      try {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
      } catch (err) {
        // No se distingue este error del caso "no existe": Supabase ya evita
        // filtrar si el email está registrado, y nosotros no debemos hacerlo tampoco.
        console.error('Error en resetPasswordForEmail:', err.message)
      } finally {
        // Mensaje genérico siempre, exista o no el email — por seguridad no se
        // confirma ni se niega si la cuenta existe.
        setInfo('Si el email existe, te llegará un enlace para restablecer tu contraseña.')
        setLoading(false)
      }
      return
    }

    if (!email || !password) {
      setError('Completa email y contraseña.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        if (!data.session) {
          // El proyecto tiene "Confirm email" activado: no hay sesión hasta confirmar.
          setInfo('Te enviamos un email de confirmación. Confírmalo y luego inicia sesión aquí.')
          setMode('login')
          setLoading(false)
          return
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }
      onRegistered()
    } catch (err) {
      setError(err.message || 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(newMode) {
    setMode(newMode)
    setError('')
    setInfo('')
  }

  const title =
    mode === 'signup' ? 'Crea tu cuenta' : mode === 'login' ? 'Inicia sesión' : 'Recuperar contraseña'

  return (
    <div className="onboarding-step">
      <h2 className="onboarding-title">{title}</h2>
      {mode === 'forgot' && (
        <p className="onboarding-subtitle">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      )}

      <form className="onboarding-form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="input-field"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        {mode !== 'forgot' && (
          <input
            type="password"
            className="input-field"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        )}
        {mode === 'signup' && (
          <input
            type="password"
            className="input-field"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        )}

        {error && <p className="error-message">{error}</p>}
        {info && <p className="onboarding-info">{info}</p>}

        <button type="submit" className="btn-primary onboarding-cta" disabled={loading}>
          {loading
            ? 'Cargando...'
            : mode === 'signup'
              ? 'Registrarse'
              : mode === 'login'
                ? 'Entrar'
                : 'Enviar enlace'}
        </button>
      </form>

      {mode === 'login' && (
        <button type="button" className="onboarding-switch" onClick={() => switchMode('forgot')}>
          ¿Olvidaste tu contraseña?
        </button>
      )}

      {mode === 'forgot' ? (
        <button type="button" className="onboarding-switch" onClick={() => switchMode('login')}>
          Volver a iniciar sesión
        </button>
      ) : (
        <button
          type="button"
          className="onboarding-switch"
          onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
        >
          {mode === 'signup' ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      )}
    </div>
  )
}
