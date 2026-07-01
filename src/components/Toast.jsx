import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const ToastCtx = createContext(() => {})

// useToast() -> notify(message, { type: 'info' | 'error' })
export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)
  const timers = useRef({})

  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout)
    },
    []
  )

  const notify = useCallback((message, opts = {}) => {
    const id = ++idRef.current
    const type = opts.type || 'info'
    setToasts((t) => [...t, { id, message, type }])
    timers.current[id] = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
      delete timers.current[id]
    }, opts.duration || 3600)
  }, [])

  return (
    <ToastCtx.Provider value={notify}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'err' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
