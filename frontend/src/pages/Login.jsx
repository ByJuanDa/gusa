import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ usuario: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarPass, setMostrarPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(form.usuario, form.password)
      navigate('/dashboard')
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      style={{ minHeight: '100dvh', backgroundColor: '#030712' }}
      className="w-full flex flex-col"
    >
      {/* Grid de fondo decorativo */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow central */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(250,204,21,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Contenido */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">

        {/* Logo */}
        <Link to="/" className="mb-10 text-center">
          <div className="text-5xl font-black tracking-tight leading-none">
            <span style={{ color: '#facc15' }}>G</span>
            <span className="text-white">USA</span>
          </div>
          <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '4px', letterSpacing: '2px' }}>
            DISTRIBUIDORA DE LLANTAS
          </p>
        </Link>

        {/* Card */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            backgroundColor: '#0f1117',
            border: '1px solid #1f2937',
            borderRadius: '20px',
            padding: '36px',
          }}
        >
          {/* Cabecera del card */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
              Iniciar sesión
            </h1>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>
              Área exclusiva para empleados de GUSA
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Campo usuario */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#9ca3af',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Usuario
              </label>
              <div style={{ position: 'relative' }}>
                {/* ícono */}
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#4b5563',
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                  placeholder="Usuario"
                  style={{
                    width: '100%',
                    backgroundColor: '#1a1f2e',
                    border: `1px solid ${error ? '#ef4444' : '#1f2937'}`,
                    borderRadius: '10px',
                    padding: '11px 14px 11px 40px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { if (!error) e.target.style.borderColor = '#facc15' }}
                  onBlur={(e)  => { if (!error) e.target.style.borderColor = '#1f2937' }}
                />
              </div>
            </div>

            {/* Campo contraseña */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#9ca3af',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#4b5563',
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </span>
                <input
                  type={mostrarPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    backgroundColor: '#1a1f2e',
                    border: `1px solid ${error ? '#ef4444' : '#1f2937'}`,
                    borderRadius: '10px',
                    padding: '11px 40px 11px 40px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => { if (!error) e.target.style.borderColor = '#facc15' }}
                  onBlur={(e)  => { if (!error) e.target.style.borderColor = '#1f2937' }}
                />
                {/* toggle mostrar contraseña */}
                <button
                  type="button"
                  onClick={() => setMostrarPass(!mostrarPass)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#4b5563',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 0,
                  }}
                >
                  {mostrarPass ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <p style={{ color: '#f87171', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando}
              style={{
                width: '100%',
                backgroundColor: cargando ? '#a16207' : '#facc15',
                color: '#030712',
                fontWeight: 700,
                fontSize: '14px',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                cursor: cargando ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s, transform 0.1s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => { if (!cargando) e.target.style.backgroundColor = '#fde047' }}
              onMouseLeave={(e) => { if (!cargando) e.target.style.backgroundColor = '#facc15' }}
            >
              {cargando ? (
                <>
                  <span
                    style={{
                      width: '14px', height: '14px',
                      border: '2px solid #030712',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Verificando...
                </>
              ) : (
                <>
                  Entrar
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p style={{ color: '#374151', fontSize: '11px', marginTop: '24px' }}>
          Solo personal autorizado · GUSA © {new Date().getFullYear()}
        </p>

      </div>

      {/* Animación spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
