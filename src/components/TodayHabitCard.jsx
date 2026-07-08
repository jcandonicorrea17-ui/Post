import { memo, useEffect, useRef, useState } from 'react'
import { randomRewardMessage } from '../lib/rewardMessages'
import { playSuccessSound } from '../lib/sounds'
import '../styles/TodayHabitCard.css'

const EMOJIS = ['😊', '😐', '😔', '🤩', '😤']
const POP_DURATION_MS = 500
const REWARD_DURATION_MS = 1500

function TodayHabitCard({ habitId, habit, checkIn, onToggle, onReflect }) {
  const [showPicker, setShowPicker] = useState(false)
  const [popping, setPopping] = useState(false)
  const [rewardMessage, setRewardMessage] = useState(null)
  const [toggling, setToggling] = useState(false)
  const popTimeoutRef = useRef(null)
  const rewardTimeoutRef = useRef(null)
  const done = Boolean(checkIn)

  useEffect(
    () => () => {
      clearTimeout(popTimeoutRef.current)
      clearTimeout(rewardTimeoutRef.current)
    },
    []
  )

  async function handleClick() {
    if (toggling) return
    setToggling(true)
    try {
      const { success, checked } = await onToggle(habitId)

      // Recompensa solo si Supabase confirmó Y el resultado fue "marcar como hecho".
      // Desmarcar (checked === false) o un fallo (success === false) se queda silencioso.
      if (success && checked) {
        if (navigator.vibrate) navigator.vibrate(15)
        playSuccessSound()

        setRewardMessage(randomRewardMessage())
        clearTimeout(rewardTimeoutRef.current)
        rewardTimeoutRef.current = setTimeout(() => setRewardMessage(null), REWARD_DURATION_MS)

        setPopping(true)
        clearTimeout(popTimeoutRef.current)
        popTimeoutRef.current = setTimeout(() => setPopping(false), POP_DURATION_MS)
      }
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="today-habit-card">
      <div className="today-habit-check-wrap">
        <button
          type="button"
          className={done ? 'check-circle done' : 'check-circle'}
          data-popping={popping || undefined}
          onClick={handleClick}
          disabled={toggling}
          aria-label={done ? 'Marcar como no hecho' : 'Marcar como hecho'}
        >
          {done ? '✓' : '○'}
        </button>
        {rewardMessage && <span className="reward-badge">{rewardMessage}</span>}
      </div>

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
                    onReflect(habitId, emoji)
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

export default memo(TodayHabitCard)
