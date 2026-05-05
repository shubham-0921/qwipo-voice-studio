import { useRef, useState } from 'react'
import { Upload, FileCheck, Download } from 'lucide-react'

interface Props {
  file: File | null
  onFile: (f: File) => void
}

export function FileDropzone({ file, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.docx')) onFile(f)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) onFile(f)
  }

  return (
    <div
      className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={handleChange}
      />
      {file ? (
        <>
          <FileCheck size={28} className="dropzone-icon green" />
          <p className="dropzone-text">File ready</p>
          <p className="dropzone-filename">{file.name}</p>
        </>
      ) : (
        <>
          <Upload size={28} className="dropzone-icon" />
          <p className="dropzone-text">
            Drop your <code>.docx</code> file here
          </p>
          <p className="dropzone-sub">or click to browse</p>
          <p className="dropzone-hint">Script must be in English — it will be translated &amp; synthesized automatically</p>
          <a
            className="sample-btn"
            href="/sample-script.docx"
            download="sample-qwipo-script.docx"
            onClick={e => e.stopPropagation()}
          >
            <Download size={11} />
            Download sample .docx
          </a>
        </>
      )}
    </div>
  )
}
