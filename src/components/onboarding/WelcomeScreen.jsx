export default function WelcomeScreen({ onNext }) {
  return (
    <div className="onboarding-step onboarding-step-center">
      <h1 className="onboarding-brand">Racha</h1>
      <p className="onboarding-tagline">Construye rachas que no quieres romper</p>
      <button type="button" className="btn-primary onboarding-cta" onClick={onNext}>
        Comenzar
      </button>
    </div>
  )
}
