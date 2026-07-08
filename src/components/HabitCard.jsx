import '../styles/HabitCard.css'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function frequencyLabel(frequency) {
  if (frequency.type === 'daily') return 'Diario'
  const days = (frequency.days || []).map((d) => WEEKDAYS[d]).join(', ')
  return `Semanal (${days})`
}

function scoreLabel(score) {
  if (score === undefined) return '···'
  if (score === null) return 'Sin datos aún'
  return `${score}%`
}

export default function HabitCard({ habit, score, onDelete }) {
  return (
    <div className="habit-card">
      <div className="habit-card-info">
        <span className="habit-card-name">{habit.name}</span>
        {habit.identity_phrase && (
          <span className="habit-card-identity">{habit.identity_phrase}</span>
        )}
        <span className="habit-card-frequency">{frequencyLabel(habit.frequency)}</span>
      </div>
      <span className="habit-card-score">{scoreLabel(score)}</span>
      <button
        type="button"
        className="habit-card-delete"
        onClick={() => onDelete(habit.id)}
        aria-label="Eliminar hábito"
      >
        ✕
      </button>
    </div>
  )
}
