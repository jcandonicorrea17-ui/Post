import { useState } from 'react'
import '../styles/TodayHabitCard.css'

const EMOJIS = ['😊', '😐', '😔', '🤩', '😤']

export default function TodayHabitCard({ habit, checkIn, onToggle, onReflect }) {
  const [showPicker, setShowPicker] = useState(false)
  const done = Boolean(checkIn)

  return (
    <div className="today-habit-card">
      <button
        type="button"
        className={done ? 'check-circle done' : 'check-circle'}
        onClick={onToggle}
        aria-label={done ? 'Marcar como no hecho' : 'Marcar como hecho'}
      >
        {done ? '✓' : '○'}
      </button>

      <div className="today-habit-info">
        <span className="today-habit-name">{habit.name}</span>
        {habit.identity_phrase && (
          <span className="today-habit-identity">{habit.identity_phrase}</span>
        )}
      </div>

      {done && (
        <div className="today-habit-reflection">
          <button
            type="button"
            className="reflection-btn"
            onClick={() => setShowPicker((s) => !s)}
          >
            {checkIn.reflection_emoji || '✨'}
          </button>
          {showPicker && (
            <div className="reflection-picker">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="reflection-option"
                  onClick={() => {
                    onReflect(emoji)
                    setShowPicker(false)
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
