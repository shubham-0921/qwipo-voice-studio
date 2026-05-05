import type { VOStatus } from '../types'

const MAP: Record<VOStatus, { label: string; cls: string }> = {
  pending:     { label: 'Pending',     cls: 'badge-pending' },
  translating: { label: 'Translating', cls: 'badge-translating' },
  processing:  { label: 'Processing',  cls: 'badge-processing' },
  done:        { label: 'Done',        cls: 'badge-done' },
  failed:      { label: 'Failed',      cls: 'badge-failed' },
}

export function StatusBadge({ status }: { status: VOStatus }) {
  const { label, cls } = MAP[status]
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  )
}
