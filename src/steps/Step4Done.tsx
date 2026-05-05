import { useState } from 'react'
import { Download, RotateCcw, RefreshCcw } from 'lucide-react'
import type { VOLine, Config } from '../types'
import { VOTable } from '../components/VOTable'
import { buildZip } from '../lib/buildZip'

interface Props {
  lines: VOLine[]
  config: Config
  onRestart: () => void
  onRetryFailed: () => void
}

export function Step4Done({ lines, config, onRestart, onRetryFailed }: Props) {
  const [zipping, setZipping] = useState(false)

  const succeeded = lines.filter(l => l.status === 'done').length
  const failed    = lines.filter(l => l.status === 'failed').length
  const allGood   = failed === 0

  async function handleDownload() {
    setZipping(true)
    try {
      const blob = await buildZip(lines, config.language)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `vo_batch_${config.language}_${Date.now()}.zip`
      a.click()
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="card">
      <p className="card-label">Step 4 — Done</p>

      <div className="done-hero">
        <div className="done-icon">{allGood ? '✅' : '⚠️'}</div>
        <h2 className="done-title">
          {allGood
            ? `All ${succeeded} lines processed`
            : `${succeeded} succeeded · ${failed} failed`}
        </h2>
        <p className="done-sub">
          {config.model} · {config.language} · {config.speaker} · {config.outputCodec.toUpperCase()}
        </p>
        <div className="done-actions">
          <button
            className="btn btn-success btn-lg"
            onClick={handleDownload}
            disabled={zipping || succeeded === 0}
          >
            <Download size={16} />
            {zipping ? 'Preparing ZIP…' : `Download ZIP (${succeeded} file${succeeded !== 1 ? 's' : ''})`}
          </button>
          {failed > 0 && (
            <button className="btn btn-ghost" onClick={onRetryFailed}>
              <RotateCcw size={14} /> Retry {failed} failed
            </button>
          )}
          <button className="btn btn-ghost" onClick={onRestart}>
            <RefreshCcw size={14} /> Start Over
          </button>
        </div>
      </div>

      <div className="divider" />

      <VOTable lines={lines} showPlay />
    </div>
  )
}
