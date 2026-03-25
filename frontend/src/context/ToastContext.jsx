import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

const colors = {
  success: { bg: '#0f1f14', border: 'rgba(74,222,128,0.3)', icon: '#4ade80', text: '#bbf7d0' },
  error:   { bg: '#1f0a0a', border: 'rgba(239,68,68,0.3)',  icon: '#f87171', text: '#fecaca' },
  info:    { bg: '#0a1020', border: 'rgba(96,165,250,0.3)', icon: '#60a5fa', text: '#bfdbfe' },
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '340px', width: 'calc(100vw - 40px)' }}>
      {toasts.map((t) => {
        const c = colors[t.type] || colors.success
        return (
          <div
            key={t.id}
            style={{
              backgroundColor: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'slideIn 0.3s ease',
            }}
          >
            <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }}>
              {t.type === 'success' && (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              )}
              {t.type === 'error' && (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              )}
              {t.type === 'info' && (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
              )}
            </span>
            <p style={{ color: c.text, fontSize: '13px', flex: 1, lineHeight: 1.5 }}>{t.message}</p>
            <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0', flexShrink: 0, fontSize: '16px', lineHeight: 1 }}>×</button>
          </div>
        )
      })}
      <style>{`@keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  )
}
