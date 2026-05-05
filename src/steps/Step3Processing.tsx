import { RotateCcw, X, Languages, Mic } from 'lucide-react'
import type { VOLine } from '../types'
import { VOTable } from '../components/VOTable'

interface Props {
  lines: VOLine[]
  done: number
  failed: number
  total: number
  cancelled: boolean
  translateFirst: boolean
  onCancel: () => void
  onRetryFailed: () => void
}

export function Step3Processing({ lines, done, failed, total, cancelled, translateFirst, onCancel, onRetryFailed }: Props) {
  const finished = done + failed === total || cancelled
  const pct = total > 0 ? ((done + failed) / total) * 100 : 0
  const allSucceeded = finished && failed === 0

  const activeLine = lines.find(l => l.status === 'translating' || l.status === 'processing')
  const currentStage = activeLine?.status ?? null

  return (
    <div className="card">
      <p className="card-label">Step 3 — Processing</p>

      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">
            {cancelled
              ? 'Cancelled'
              : finished
              ? allSucceeded ? 'All done!' : `${done} succeeded · ${failed} failed`
              : `Line ${done + failed + 1} of ${total}`}
          </span>
          <span className="progress-count mono">{done + failed} / {total}</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${allSucceeded ? 'fill-green' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {translateFirst && !cancelled && !finished && (
          <div className="pipeline-stages">
            <div className={`pipeline-stage ${currentStage === 'translating' ? 'stage-active' : currentStage === 'processing' ? 'stage-done' : ''}`}>
              <div className="stage-icon"><Languages size={13} /></div>
              <span>Translate</span>
            </div>
            <div className={`pipeline-arrow ${currentStage === 'processing' ? 'arrow-lit' : ''}`}>→</div>
            <div className={`pipeline-stage ${currentStage === 'processing' ? 'stage-active' : ''}`}>
              <div className="stage-icon"><Mic size={13} /></div>
              <span>Synthesize</span>
            </div>
          </div>
        )}
      </div>

      <VOTable lines={lines} translateFirst={translateFirst} />

      <div className="actions">
        <button
          className="btn btn-danger"
          onClick={onCancel}
          disabled={finished}
        >
          <X size={14} /> Cancel
        </button>
        <div className="spacer" />
        {finished && failed > 0 && (
          <button className="btn btn-ghost" onClick={onRetryFailed}>
            <RotateCcw size={14} /> Retry {failed} failed
          </button>
        )}
      </div>
    </div>
  )
}
