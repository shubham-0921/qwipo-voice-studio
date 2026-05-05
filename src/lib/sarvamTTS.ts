import type { Config, ModelVersion } from '../types'

function base64ToBlob(b64: string, mimeType: string): Blob {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

function mimeForCodec(codec: string): string {
  const map: Record<string, string> = {
    mp3: 'audio/mpeg',
    flac: 'audio/flac',
    opus: 'audio/ogg; codecs=opus',
    aac: 'audio/aac',
    wav: 'audio/wav',
    linear16: 'audio/wav',
    mulaw: 'audio/wav',
    alaw: 'audio/wav',
  }
  return map[codec] ?? 'audio/wav'
}

function buildPayload(text: string, config: Config): Record<string, unknown> {
  const isV3 = config.model === 'bulbul:v3'
  const base: Record<string, unknown> = {
    text,                                        // API field is `text` (string), not `inputs`
    target_language_code: config.language,
    speaker: config.speaker,
    model: config.model,
    speech_sample_rate: String(config.sampleRate), // spec enum expects string, e.g. "24000"
    output_audio_codec: config.outputCodec,
    pace: config.pace,
  }

  if (isV3) {
    base.temperature = config.temperature
    // enable_preprocessing not supported in v3 — omit it
  } else {
    base.pitch = config.pitch
    base.loudness = config.loudness
    base.enable_preprocessing = true
  }

  return base
}

export async function callSarvamTTS(text: string, config: Config): Promise<Blob> {
  const payload = buildPayload(text, config)

  const resp = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': config.apiKey,
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    let errMsg = `HTTP ${resp.status}`
    try {
      const errJson = await resp.json()
      errMsg = errJson?.error?.message ?? errJson?.message ?? errJson?.error ?? JSON.stringify(errJson)
    } catch {}
    throw new Error(errMsg)
  }

  const contentType = resp.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const json = await resp.json()
    const b64: string = Array.isArray(json.audios) ? json.audios[0] : json.audio
    if (!b64) throw new Error('No audio in response: ' + JSON.stringify(json))
    return base64ToBlob(b64, mimeForCodec(config.outputCodec))
  }

  return await resp.blob()
}

export function getFileExtension(codec: string): string {
  const map: Record<string, string> = {
    mp3: 'mp3', flac: 'flac', opus: 'opus', aac: 'aac',
    wav: 'wav', linear16: 'wav', mulaw: 'wav', alaw: 'wav',
  }
  return map[codec] ?? 'wav'
}

export function isV3(model: ModelVersion): boolean {
  return model === 'bulbul:v3'
}
