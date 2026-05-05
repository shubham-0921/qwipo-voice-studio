import { Check } from 'lucide-react'

const STEPS = ['Configure', 'Review', 'Processing', 'Done']

interface Props {
  current: number // 1-4
}

export function StepIndicator({ current }: Props) {
  return (
    <div className="steps-container">
      <div className="steps-line" />
      {STEPS.map((label, i) => {
        const n = i + 1
        const isDone = n < current
        const isActive = n === current
        return (
          <div key={label} className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
            <div className="step-dot">
              {isDone ? <Check size={14} strokeWidth={2.5} /> : n}
            </div>
            <div className="step-label">{label}</div>
          </div>
        )
      })}
    </div>
  )
}
