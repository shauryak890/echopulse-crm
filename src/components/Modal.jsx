import { useEffect, useRef } from 'react'
import { IconX } from './icons'

// Accessible modal: Esc to close, click-outside to close, focus moves in,
// body scroll locked while open. Used for the add-lead flow.
export default function Modal({ title, onClose, children, footer, wide }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // move focus into the dialog
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        tabIndex={-1}
        style={wide ? { maxWidth: 880 } : undefined}
      >
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
