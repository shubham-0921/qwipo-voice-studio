export type VOStatus = 'pending' | 'translating' | 'processing' | 'done' | 'failed'
export type ModelVersion = 'bulbul:v3' | 'bulbul:v2'

export interface VOLine {
  index: number
  timestamp: string
  text: string
  filename: string
  status: VOStatus
  error: string | null
  audioBlob: Blob | null
  audioUrl: string | null
}

export interface Config {
  apiKey: string
  language: string
  speaker: string
  model: ModelVersion
  translateFirst: boolean
  delayMs: number
  // v3-only
  temperature: number
  sampleRate: number
  outputCodec: string
  // v2-only
  pitch: number
  loudness: number
  pace: number
}

export const LANGUAGES = [
  { code: 'en-IN', label: 'English (Indian)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'od-IN', label: 'Odia' },
] as const

export const SPEAKERS_V3 = [
  'shubh', 'aditya', 'ritu', 'priya', 'neha', 'rahul', 'pooja', 'rohan',
  'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya', 'ratan', 'varun',
  'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'ashutosh', 'advait', 'anand',
  'tanya', 'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'shruti', 'suhani',
  'mohit', 'kavitha', 'rehan', 'soham', 'rupali',
] as const

export const SPEAKERS_V2 = [
  'anushka', 'manisha', 'vidya', 'arya',   // female
  'abhilash', 'karun', 'hitesh',            // male
] as const

export function getSpeakers(model: ModelVersion): readonly string[] {
  return model === 'bulbul:v3' ? SPEAKERS_V3 : SPEAKERS_V2
}

export function getDefaultSpeaker(model: ModelVersion): string {
  return model === 'bulbul:v3' ? 'shubh' : 'anushka'
}

export const MODELS: { value: ModelVersion; label: string; maxChars: number }[] = [
  { value: 'bulbul:v3', label: 'bulbul:v3 (latest)', maxChars: 2500 },
  { value: 'bulbul:v2', label: 'bulbul:v2',          maxChars: 1500 },
]

export const SAMPLE_RATES_V3 = [8000, 16000, 22050, 24000, 32000, 44100, 48000] as const
export const SAMPLE_RATES_V2 = [8000, 16000, 22050, 24000] as const

export const OUTPUT_CODECS = ['wav', 'mp3', 'flac', 'opus', 'aac', 'linear16', 'mulaw', 'alaw'] as const
