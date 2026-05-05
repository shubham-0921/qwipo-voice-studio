import { Languages, Mic, ArrowRight } from 'lucide-react'
import type { Config } from '../types'
import { LANGUAGES } from '../types'

interface Props {
  config: Config
}

export function PipelineBadge({ config }: Props) {
  const targetLabel = LANGUAGES.find(l => l.code === config.language)?.label ?? config.language
  const willTranslate = config.translateFirst && config.language !== 'en-IN'

  return (
    <div className="pipeline-badge">
      {willTranslate ? (
        <>
          <span className="pb-item">
            <Languages size={12} />
            <span>English</span>
            <ArrowRight size={11} className="pb-arrow" />
            <strong>{targetLabel}</strong>
          </span>
          <span className="pb-sep" />
        </>
      ) : (
        <span className="pb-item">
          <Languages size={12} />
          <strong>{targetLabel}</strong>
          <span className="pb-sep" />
        </span>
      )}
      <span className="pb-item">
        <Mic size={12} />
        <span>{config.speaker}</span>
      </span>
      <span className="pb-sep" />
      <span className="pb-item pb-model">{config.model}</span>
    </div>
  )
}
