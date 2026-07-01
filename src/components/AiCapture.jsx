import { useState, useRef, useEffect, useCallback } from 'react'
import { parseProfileText, parseProfileImage, fileToDataUrl } from '../lib/groq'
import { IconInfo, IconImage } from './icons'

// Capture a LinkedIn profile as TEXT (paste — cheap, default) or as a SCREENSHOT
// (drop/paste an image — fallback), send it to Groq, and hand the parsed fields
// up via onParsed(). Text is preferred: far fewer tokens per lead, so it stays
// comfortably inside Groq's free-tier limits for daily batches.
export default function AiCapture({ onParsed }) {
  const [tab, setTab] = useState('text') // 'text' | 'image'
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    if (tab === 'text') textRef.current?.focus()
  }, [tab])

  const runText = useCallback(async () => {
    setError('')
    setBusy(true)
    try {
      const fields = await parseProfileText(text)
      onParsed(fields)
    } catch (e) {
      setError(e.message || 'Couldn’t read that.')
    } finally {
      setBusy(false)
    }
  }, [text, onParsed])

  const runImage = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith('image/')) {
        setError('That’s not an image. Paste or drop a screenshot (PNG/JPG).')
        return
      }
      setError('')
      setBusy(true)
      try {
        const dataUrl = await fileToDataUrl(file)
        const fields = await parseProfileImage(dataUrl)
        onParsed(fields)
      } catch (e) {
        setError(e.message || 'Couldn’t read that screenshot.')
      } finally {
        setBusy(false)
      }
    },
    [onParsed]
  )

  // On the image tab, allow Ctrl+V of an image from the clipboard.
  useEffect(() => {
    if (tab !== 'image') return
    const onPaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            runImage(file)
            return
          }
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [tab, runImage])

  return (
    <div>
      <div className="segmented" role="tablist" aria-label="Capture method" style={{ marginBottom: 14 }}>
        <button
          role="tab"
          aria-selected={tab === 'text'}
          className={tab === 'text' ? 'on' : ''}
          onClick={() => setTab('text')}
        >
          Paste text
        </button>
        <button
          role="tab"
          aria-selected={tab === 'image'}
          className={tab === 'image' ? 'on' : ''}
          onClick={() => setTab('image')}
        >
          Screenshot
        </button>
      </div>

      <div className="banner banner-info" style={{ marginBottom: 14 }}>
        <IconInfo className="banner-icon" />
        {tab === 'text' ? (
          <div>
            Open the profile, press <span className="kbd">Ctrl</span>+<span className="kbd">A</span> then{' '}
            <span className="kbd">Ctrl</span>+<span className="kbd">C</span>, and paste below. The AI pulls out
            the name, role, company, location, and best-guess segment. Cheapest option — best for daily batches.
          </div>
        ) : (
          <div>
            Paste (<span className="kbd">Ctrl</span>+<span className="kbd">V</span>) or drop a profile screenshot.
            The AI reads the image directly — no cropping needed. Uses more of your free-tier quota than pasting text.
          </div>
        )}
      </div>

      {tab === 'text' ? (
        <>
          <textarea
            ref={textRef}
            className="textarea"
            style={{ minHeight: 200, fontSize: 13 }}
            placeholder="Paste the LinkedIn profile text here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={runText}
            disabled={busy || !text.trim()}
          >
            {busy ? 'Reading…' : 'Read with AI'}
          </button>
        </>
      ) : (
        <div
          className={`dropzone ${dragging ? 'drag' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            runImage(e.dataTransfer?.files?.[0])
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileRef.current?.click()
            }
          }}
          aria-label="Drop or click to upload a LinkedIn profile screenshot"
        >
          <IconImage className="dropzone-icon" />
          <div>
            <strong>Paste</strong> <span className="kbd">Ctrl</span>+<span className="kbd">V</span> or{' '}
            <strong>drop</strong> a profile screenshot
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>…or click to choose a file</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              runImage(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      )}

      {busy && (
        <div className="hint" style={{ marginTop: 14 }}>
          <span className="spinner" /> Asking the AI…
        </div>
      )}
      {error && (
        <div className="banner banner-warn" style={{ marginTop: 14 }}>
          <div>{error}</div>
        </div>
      )}
    </div>
  )
}
