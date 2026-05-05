import mammoth from 'mammoth'
import type { VOLine } from '../types'

function timestampToSlug(ts: string): string {
  return ts
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, '')
    .replace(/:/g, '')
    .replace(/\./g, '')
}

export function buildFilename(idx: number, ts: string, ext = 'wav'): string {
  const n = String(idx + 1).padStart(2, '0')
  const slug = timestampToSlug(ts)
  return `${n}_${slug}.${ext}`
}

export async function parseDocx(file: File, ext = 'wav'): Promise<VOLine[]> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })

  const parser = new DOMParser()
  const doc = parser.parseFromString(result.value, 'text/html')
  const lines: VOLine[] = []
  let lastTimestamp = '0000-0000'

  const tables = doc.querySelectorAll('table')

  for (const table of tables) {
    const rows = table.querySelectorAll('tr')
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th')
      if (cells.length < 2) continue

      const cell0 = cells[0].textContent?.trim() ?? ''
      const cell1 = cells[1].textContent?.trim() ?? ''

      // Timestamp row: starts with digit and contains a range separator
      if (/^\d+:\d+/.test(cell0) || (/[–—-]/.test(cell0) && /\d+:\d+/.test(cell0))) {
        lastTimestamp = cell0
        continue
      }

      const label = cell0.replace(/\s+/g, '').toUpperCase()
      if (label === 'VO' || label === 'V.O.' || label === 'V/O' || label === 'VOICEOVER') {
        if (cell1) {
          lines.push({
            index: lines.length,
            timestamp: lastTimestamp,
            text: cell1,
            filename: buildFilename(lines.length, lastTimestamp, ext),
            status: 'pending',
            error: null,
            audioBlob: null,
            audioUrl: null,
          })
        }
      }
    }
  }

  // Fallback: raw text parse
  if (lines.length === 0) {
    const raw = await mammoth.extractRawText({ arrayBuffer })
    const rawLines = raw.value.split('\n').map(l => l.trim()).filter(Boolean)
    let ts = '0000-0000'
    for (let i = 0; i < rawLines.length; i++) {
      const l = rawLines[i]
      if (/^\d+:\d+\s*[–—-]/.test(l)) { ts = l; continue }
      if (/^VO\s*$/i.test(l) && i + 1 < rawLines.length) {
        const voText = rawLines[i + 1]
        if (voText && !/^VO\s*$/i.test(voText)) {
          lines.push({
            index: lines.length,
            timestamp: ts,
            text: voText,
            filename: buildFilename(lines.length, ts),
            status: 'pending',
            error: null,
            audioBlob: null,
            audioUrl: null,
          })
          i++
        }
      }
    }
  }

  return lines
}
