import { useState, useCallback, useRef } from 'react'
import { Mic2 } from 'lucide-react'
import { StepIndicator } from './components/StepIndicator'
import { Step1Configure } from './steps/Step1Configure'
import { Step2Review } from './steps/Step2Review'
import { Step3Processing } from './steps/Step3Processing'
import { Step4Done } from './steps/Step4Done'
import { parseDocx, buildFilename } from './lib/parseDocx'
import { callSarvamTTS, getFileExtension } from './lib/sarvamTTS'
import { callSarvamTranslate } from './lib/sarvamTranslate'
import type { Config, VOLine } from './types'

const DEFAULT_CONFIG: Config = {
  apiKey: '',
  language: 'en-IN',
  speaker: 'shubh',
  model: 'bulbul:v3',
  translateFirst: true,
  delayMs: 300,
  temperature: 0.6,
  sampleRate: 24000,
  outputCodec: 'wav',
  pitch: 0,
  loudness: 1,
  pace: 1,
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

export default function App() {
  const [step, setStep]       = useState(1)
  const [config, setConfig]   = useState<Config>(DEFAULT_CONFIG)
  const [file, setFile]       = useState<File | null>(null)
  const [lines, setLines]     = useState<VOLine[]>([])
  const [parsing, setParsing] = useState(false)

  const [done, setDone]           = useState(0)
  const [failed, setFailed]       = useState(0)
  const cancelledRef              = useRef(false)
  const [cancelled, setCancelled] = useState(false)

  // When config changes, keep a stable ref so the processing loop uses latest values
  const configRef = useRef(config)
  configRef.current = config

  function handleConfigChange(next: Config) {
    setConfig(next)
    // If codec changed and we already have parsed lines, update filenames
    if (next.outputCodec !== config.outputCodec) {
      const ext = getFileExtension(next.outputCodec)
      setLines(prev => prev.map(l => ({
        ...l,
        filename: buildFilename(l.index, l.timestamp, ext),
      })))
    }
  }

  // ── Step 1 → 2 ────────────────────────────────────────────────────────────
  async function handleParse() {
    if (!file) return
    setParsing(true)
    try {
      const ext    = getFileExtension(config.outputCodec)
      const parsed = await parseDocx(file, ext)
      if (parsed.length === 0) {
        alert('No VO lines found. Make sure the .docx follows the Qwipo format with "VO" in the first column.')
        return
      }
      setLines(parsed)
      setStep(2)
    } catch (err: unknown) {
      alert(`Parse error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setParsing(false)
    }
  }

  // ── Step 2 → 3 ────────────────────────────────────────────────────────────
  const startProcessing = useCallback(async (toProcess: VOLine[]) => {
    cancelledRef.current = false
    setCancelled(false)
    setDone(0)
    setFailed(0)
    setStep(3)

    let doneCount = 0
    let failCount = 0

    for (let i = 0; i < toProcess.length; i++) {
      if (cancelledRef.current) break

      const line = toProcess[i]
      const cfg  = configRef.current

      try {
        let textToSynthesize = line.text

        if (cfg.translateFirst && cfg.language !== 'en-IN') {
          setLines(prev => prev.map(l =>
            l.index === line.index ? { ...l, status: 'translating' } : l
          ))
          textToSynthesize = await callSarvamTranslate(line.text, cfg.apiKey, cfg.language)
        }

        setLines(prev => prev.map(l =>
          l.index === line.index ? { ...l, status: 'processing' } : l
        ))

        const blob = await callSarvamTTS(textToSynthesize, cfg)
        const url  = URL.createObjectURL(blob)
        setLines(prev => prev.map(l =>
          l.index === line.index ? { ...l, status: 'done', audioBlob: blob, audioUrl: url } : l
        ))
        doneCount++
        setDone(doneCount)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setLines(prev => prev.map(l =>
          l.index === line.index ? { ...l, status: 'failed', error: msg } : l
        ))
        failCount++
        setFailed(failCount)
      }

      if (i < toProcess.length - 1) await sleep(cfg.delayMs)
    }

    if (!cancelledRef.current) {
      setTimeout(() => setStep(4), 600)
    }
  }, [])

  function handleRetryFailed() {
    const failedLines = lines.filter(l => l.status === 'failed')
    setLines(prev => prev.map(l =>
      l.status === 'failed' ? { ...l, status: 'pending', error: null } : l
    ))
    startProcessing(failedLines)
  }

  function handleRestart() {
    setStep(1)
    setFile(null)
    setLines([])
    setConfig(DEFAULT_CONFIG)
    configRef.current = DEFAULT_CONFIG
    setDone(0)
    setFailed(0)
    setCancelled(false)
  }

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <div className="logo"><Mic2 size={16} /></div>
            <span className="nav-brand">Qwipo Voice Studio</span>
          </div>
          <span className="nav-tag">Sarvam TTS</span>
        </div>
      </header>

      <div className="app">
        {step === 1 && (
          <div className="hero-banner">
            <span className="hero-pill">bulbul:v3 · Sarvam TTS</span>
            <h2 className="hero-title">Qwipo Voice Studio</h2>
            <p className="hero-sub">Upload an English .docx script — it auto-translates each line to your target language, then synthesizes speech. Download everything as a ZIP.</p>
            <div className="hero-tags">
              <span className="hero-tag">① Translate EN → target</span>
              <span className="hero-tag">② Text-to-Speech</span>
              <span className="hero-tag">37 voices · 11 languages</span>
              <span className="hero-tag">ZIP download</span>
            </div>
          </div>
        )}

        <StepIndicator current={step} />

      {step === 1 && (
        <Step1Configure
          config={config}
          file={file}
          onFile={setFile}
          onConfigChange={handleConfigChange}
          onNext={handleParse}
          loading={parsing}
        />
      )}
      {step === 2 && (
        <Step2Review
          lines={lines}
          filename={file?.name ?? ''}
          onBack={() => setStep(1)}
          onStart={() => startProcessing(lines)}
        />
      )}
      {step === 3 && (
        <Step3Processing
          lines={lines}
          done={done}
          failed={failed}
          total={lines.length}
          cancelled={cancelled}
          translateFirst={config.translateFirst && config.language !== 'en-IN'}
          onCancel={() => { cancelledRef.current = true; setCancelled(true) }}
          onRetryFailed={handleRetryFailed}
        />
      )}
      {step === 4 && (
        <Step4Done
          lines={lines}
          config={config}
          onRestart={handleRestart}
          onRetryFailed={() => { setStep(3); handleRetryFailed() }}
        />
      )}
      </div>

    </div>
  )
}
