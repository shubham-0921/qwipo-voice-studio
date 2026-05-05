import { useState } from 'react'
import { Eye, EyeOff, ArrowRight, Info, Languages, Mic } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import type { Config, ModelVersion, PipelineMode } from '../types'
import {
  LANGUAGES, MODELS, OUTPUT_CODECS,
  SAMPLE_RATES_V3, SAMPLE_RATES_V2,
  getSpeakers, getDefaultSpeaker,
} from '../types'

interface Props {
  config: Config
  file: File | null
  onFile: (f: File) => void
  onConfigChange: (c: Config) => void
  onNext: () => void
  loading: boolean
}

function SliderField({
  label, value, min, max, step, onChange, note,
}: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; note?: string
}) {
  return (
    <div className="field">
      <label>
        {label}
        <span className="field-value mono">{value}</span>
      </label>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="slider"
      />
      {note && <span className="field-note">{note}</span>}
    </div>
  )
}

export function Step1Configure({ config, file, onFile, onConfigChange, onNext, loading }: Props) {
  const [showKey, setShowKey] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const ready  = !!file && !!config.apiKey.trim()
  const isV3   = config.model === 'bulbul:v3'
  const speakers = getSpeakers(config.model)
  const sampleRates = isV3 ? SAMPLE_RATES_V3 : SAMPLE_RATES_V2
  const isDirectTTS = config.mode === 'direct-tts'

  function set<K extends keyof Config>(key: K, value: Config[K]) {
    onConfigChange({ ...config, [key]: value })
  }

  function handleModelChange(model: ModelVersion) {
    const speaker = getDefaultSpeaker(model)
    const sampleRate = 24000
    onConfigChange({ ...config, model, speaker, sampleRate })
  }

  function handleModeChange(mode: PipelineMode) {
    onConfigChange({
      ...config,
      mode,
      translateFirst: mode === 'translate-tts',
    })
  }

  const dropzoneHint = isDirectTTS
    ? 'Upload your script already written in the target language'
    : 'Script must be in English — each line will be translated then synthesized'

  const langLabel = isDirectTTS ? 'Script Language' : 'Target Speech Language'

  return (
    <div className="card">
      <p className="card-label">Step 1 — Configure</p>

      {/* Mode selector */}
      <div className="mode-selector">
        <button
          type="button"
          className={`mode-card ${!isDirectTTS ? 'mode-card-active' : ''}`}
          onClick={() => handleModeChange('translate-tts')}
        >
          <div className="mode-card-icons">
            <Languages size={18} />
            <span className="mode-arrow">→</span>
            <Mic size={18} />
          </div>
          <div className="mode-card-body">
            <strong>Translate &amp; Speak</strong>
            <span>Upload English script · auto-translate · synthesize</span>
          </div>
        </button>
        <button
          type="button"
          className={`mode-card ${isDirectTTS ? 'mode-card-active' : ''}`}
          onClick={() => handleModeChange('direct-tts')}
        >
          <div className="mode-card-icons">
            <Mic size={18} />
          </div>
          <div className="mode-card-body">
            <strong>Direct TTS</strong>
            <span>Upload script in target language · synthesize only</span>
          </div>
        </button>
      </div>

      {/* File upload */}
      <div className="field-full">
        <label>Script File <span className="required">required</span></label>
        <FileDropzone file={file} onFile={onFile} hint={dropzoneHint} />
      </div>

      {/* Model + Language + Speaker */}
      <div className="field-row-3" style={{ marginTop: 28 }}>
        <div className="field">
          <label>Model</label>
          <select value={config.model} onChange={e => handleModelChange(e.target.value as ModelVersion)}>
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>{langLabel}</label>
          <select value={config.language} onChange={e => set('language', e.target.value)}>
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.code} — {l.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Speaker</label>
          <select value={config.speaker} onChange={e => set('speaker', e.target.value)}>
            {speakers.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Translate toggle — only visible in translate-tts mode */}
      {!isDirectTTS && (
        <div className="translate-row">
          <label className="toggle-wrap">
            <input
              type="checkbox"
              className="toggle-check"
              checked={config.translateFirst}
              onChange={e => set('translateFirst', e.target.checked)}
            />
            <span className="toggle-label-text">
              Two-step pipeline: <strong>Translate EN → {config.language}</strong>, then <strong>Text-to-Speech</strong>
            </span>
          </label>
          {config.translateFirst && config.language === 'en-IN'
            ? <p className="field-note pipeline-note">Target is already English — only Text-to-Speech will run</p>
            : config.translateFirst
            ? <p className="field-note pipeline-note">Each line will be translated to <strong>{config.language}</strong> first, then synthesized as speech</p>
            : <p className="field-note pipeline-note">Translation skipped — raw script text will be sent to TTS</p>
          }
        </div>
      )}

      {/* API Key */}
      <div className="field" style={{ marginTop: 28 }}>
        <label>
          Sarvam API Key <span className="required">required</span>
          <a
            href="https://dashboard.sarvam.ai/key-management"
            target="_blank"
            rel="noopener noreferrer"
            className="api-key-link"
          >
            Get API key ↗
          </a>
        </label>
        <div className="input-icon-wrap">
          <input
            type={showKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={e => set('apiKey', e.target.value)}
            placeholder="•••••••••••••••••••••••••"
            className={showKey ? '' : 'font-mono-key'}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="input-icon-btn" onClick={() => setShowKey(v => !v)} tabIndex={-1}>
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Model capability banner */}
      <div className={`model-banner ${isV3 ? 'banner-v3' : 'banner-v2'}`}>
        <Info size={13} />
        {isV3
          ? <span><strong>bulbul:v3</strong> · 37 voices · up to 2500 chars · temperature control · 11 languages</span>
          : <span><strong>bulbul:v2</strong> · 7 voices · up to 1500 chars · pitch &amp; loudness control · 9 languages</span>
        }
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        className="advanced-toggle"
        onClick={() => setShowAdvanced(v => !v)}
      >
        <span>{showAdvanced ? '▾' : '▸'} Advanced settings</span>
      </button>

      {showAdvanced && (
        <div className="advanced-panel">
          {/* Pace — both models */}
          <SliderField
            label="Pace"
            value={config.pace}
            min={isV3 ? 0.5 : 0.3}
            max={isV3 ? 2.0 : 3.0}
            step={0.1}
            onChange={v => set('pace', v)}
            note={isV3 ? '0.5 – 2.0' : '0.3 – 3.0'}
          />

          {/* v3-only */}
          {isV3 && (
            <>
              <SliderField
                label="Temperature"
                value={config.temperature}
                min={0.01}
                max={2.0}
                step={0.01}
                onChange={v => set('temperature', v)}
                note="0.01 – 2.0 · lower = consistent, higher = expressive"
              />
              <div className="field">
                <label>Sample Rate</label>
                <select value={config.sampleRate} onChange={e => set('sampleRate', Number(e.target.value))}>
                  {sampleRates.map(r => (
                    <option key={r} value={r}>{r === 24000 ? `${r} Hz (default)` : `${r} Hz`}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Output Format</label>
                <select value={config.outputCodec} onChange={e => set('outputCodec', e.target.value)}>
                  {OUTPUT_CODECS.map(c => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* v2-only */}
          {!isV3 && (
            <>
              <SliderField
                label="Pitch"
                value={config.pitch}
                min={-0.75}
                max={0.75}
                step={0.05}
                onChange={v => set('pitch', v)}
                note="-0.75 – 0.75"
              />
              <SliderField
                label="Loudness"
                value={config.loudness}
                min={0.3}
                max={3.0}
                step={0.1}
                onChange={v => set('loudness', v)}
                note="0.3 – 3.0"
              />
            </>
          )}

          {/* Delay — both */}
          <div className="field">
            <label>Delay between calls (ms)</label>
            <input
              type="number"
              value={config.delayMs}
              onChange={e => set('delayMs', Number(e.target.value))}
              min={0} max={5000} step={50}
            />
          </div>
        </div>
      )}

      <div className="actions">
        <div className="spacer" />
        <button className="btn btn-primary" disabled={!ready || loading} onClick={onNext}>
          {loading ? 'Parsing…' : <><span>Parse Script</span> <ArrowRight size={14} /></>}
        </button>
      </div>
    </div>
  )
}
