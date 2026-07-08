import '../styles/HabitTemplates.css'
import { HABIT_TEMPLATES } from '../lib/habitTemplates'

export default function HabitTemplates({ onSelect }) {
  return (
    <div className="habit-templates">
      {HABIT_TEMPLATES.map((template) => (
        <button
          key={template.name}
          type="button"
          className="habit-template-card"
          onClick={() => onSelect(template)}
        >
          <span className="habit-template-icon">{template.icon}</span>
          <span>{template.name}</span>
        </button>
      ))}
    </div>
  )
}
