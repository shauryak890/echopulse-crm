import { useState, useCallback, useRef, useEffect } from 'react'
import { IconCopy, IconCheck } from './icons'

// One-click copy with a transient "Copied" confirmation. Falls back to a
// hidden textarea + execCommand if the async clipboard API is unavailable
// (older browsers / insecure contexts).
export default function CopyButton({ text, label = 'Copy', className = '', inline = false }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard blocked — silently no-op rather than throw */
    }
  }, [text])

  return (
    <button
      type="button"
      onClick={copy}
      className={`copy-btn ${copied ? 'copied' : ''} ${inline ? 'copy-inline' : ''} ${className}`}
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
      {copied ? 'Copied' : label}
    </button>
  )
}
