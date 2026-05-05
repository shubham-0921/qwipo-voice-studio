import { ArrowLeft, Play as PlayIcon } from 'lucide-react'
import type { VOLine, Config } from '../types'
import { VOTable } from '../components/VOTable'
import { PipelineBadge } from '../components/PipelineBadge'

interface Props {
  lines: VOLine[]
  filename: string
  config: Config
  onBack: () => void
  onStart: () => void
}

export function Step2Review({ lines, filename, config, onBack, onStart }: Props) {
  return (
    <div className="card">
      <p className="card-label">Step 2 — Review Extracted VO Lines</p>

      <PipelineBadge config={config} />

      <div className="info-box">
        Found <strong>{lines.length} VO line{lines.length !== 1 ? 's' : ''}</strong> in{' '}
        <strong>{filename}</strong>.{' '}
        {config.mode === 'direct-tts'
          ? 'Script will be synthesized directly — no translation.'
          : 'Confirm the extraction looks correct, then start processing.'
        }
      </div>

      <VOTable lines={lines} />

      <div className="actions">
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="spacer" />
        <span className="muted-sm">{lines.length} lines</span>
        <button className="btn btn-primary btn-lg" onClick={onStart}>
          <PlayIcon size={14} fill="currentColor" /> Start Processing
        </button>
      </div>
    </div>
  )
}
