import { useState } from 'react'
import WelcomeScreen from '../components/onboarding/WelcomeScreen.jsx'
import RegisterScreen from '../components/onboarding/RegisterScreen.jsx'
import PhoneScreen from '../components/onboarding/PhoneScreen.jsx'
import SocialsScreen from '../components/onboarding/SocialsScreen.jsx'
import FirstHabitScreen from '../components/onboarding/FirstHabitScreen.jsx'
import '../styles/Onboarding.css'

const TOTAL_STEPS = 5

export default function Onboarding({ session, profile, onComplete }) {
  // Un usuario que ya tiene sesión activa saltó registro (paso 2): retoma en Teléfono (paso 3).
  const [step, setStep] = useState(session ? 3 : 1)

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))

  return (
    <div className="onboarding-screen">
      <div className="onboarding-progress">
        <div
          className="onboarding-progress-fill"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
      <span className="onboarding-progress-label">
        {step}/{TOTAL_STEPS}
      </span>

      {step === 1 && <WelcomeScreen onNext={next} />}
      {step === 2 && <RegisterScreen onRegistered={next} />}
      {step === 3 && session && (
        <PhoneScreen session={session} onNext={next} />
      )}
      {step === 4 && session && <SocialsScreen onNext={next} />}
      {step === 5 && session && profile && (
        <FirstHabitScreen session={session} onComplete={onComplete} />
      )}
    </div>
  )
}
