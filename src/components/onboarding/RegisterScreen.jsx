import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function RegisterScreen({ onRegistered }) {
  const [mode, setMode] = useState('signup') // 'signup' | 'login'
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

  return (
    <div className="onboarding-step">
      <h2 className="onboarding-title">{mode === 'signup' ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>

      <form className="onboarding-form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="input-field"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          type="password"
          className="input-field"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />
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
          {loading ? 'Cargando...' : mode === 'signup' ? 'Registrarse' : 'Entrar'}
        </button>
      </form>

      <button
        type="button"
        className="onboarding-switch"
        onClick={() => {
          setMode(mode === 'signup' ? 'login' : 'signup')
          setError('')
          setInfo('')
        }}
      >
        {mode === 'signup' ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </button>
    </div>
  )
}
