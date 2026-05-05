import JSZip from 'jszip'
import type { VOLine } from '../types'

export async function buildZip(lines: VOLine[], language: string): Promise<Blob> {
  const zip = new JSZip()
  const folder = zip.folder(language)!
  for (const line of lines) {
    if (line.audioBlob) folder.file(line.filename, line.audioBlob)
  }
  return zip.generateAsync({ type: 'blob' })
}
