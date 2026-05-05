import { useRef, useState } from 'react'
import { Play, Pause, Languages, Mic } from 'lucide-react'
import type { VOLine } from '../types'
import { StatusBadge } from './StatusBadge'

interface Props {
  lines: VOLine[]
  showPlay?: boolean
  translateFirst?: boolean
}

export function VOTable({ lines, showPlay = false, translateFirst = false }: Props) {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({})

  function togglePlay(line: VOLine) {
    if (!line.audioUrl) return
    const audio = audioRefs.current[line.index]
    if (!audio) return

    if (playingIdx === line.index) {
      audio.pause()
      setPlayingIdx(null)
    } else {
      // stop any currently playing
      Object.entries(audioRefs.current).forEach(([, a]) => { a.pause(); a.currentTime = 0 })
      audio.play()
      setPlayingIdx(line.index)
      audio.onended = () => setPlayingIdx(null)
    }
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th className="col-num">#</th>
            <th className="col-ts">Timestamp</th>
            <th>VO Text</th>
            <th className="col-file">Output File</th>
            <th className="col-status">Status</th>
            {showPlay && <th className="col-action">Play</th>}
          </tr>
        </thead>
        <tbody>
          {lines.map(line => (
            <tr key={line.index} id={`row-${line.index}`}>
              <td className="col-num mono">{String(line.index + 1).padStart(2, '0')}</td>
              <td className="col-ts mono">{line.timestamp}</td>
              <td className="col-text">{line.text}</td>
              <td className="col-file mono">{line.filename}</td>
              <td className="col-status">
                {translateFirst && (line.status === 'translating' || line.status === 'processing') ? (
                  <div className="row-stages">
                    <div className={`row-stage ${line.status === 'translating' ? 'row-stage-active' : 'row-stage-done'}`}>
                      <Languages size={11} />
                      <span>Translate</span>
                    </div>
                    <span className={`row-stage-arrow ${line.status === 'processing' ? 'arrow-lit' : ''}`}>→</span>
                    <div className={`row-stage ${line.status === 'processing' ? 'row-stage-active' : 'row-stage-dim'}`}>
                      <Mic size={11} />
                      <span>Synthesize</span>
                    </div>
                  </div>
                ) : (
                  <StatusBadge status={line.status} />
                )}
                {line.error && (
                  <div className="error-inline">{line.error}</div>
                )}
              </td>
              {showPlay && (
                <td className="col-action">
                  {line.audioUrl ? (
                    <>
                      <button
                        className={`play-btn ${playingIdx === line.index ? 'playing' : ''}`}
                        onClick={() => togglePlay(line)}
                        title={playingIdx === line.index ? 'Pause' : 'Play'}
                      >
                        {playingIdx === line.index
                          ? <Pause size={11} fill="currentColor" />
                          : <Play size={11} fill="currentColor" />
                        }
                      </button>
                      <audio
                        ref={el => { if (el) audioRefs.current[line.index] = el }}
                        src={line.audioUrl}
                      />
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
