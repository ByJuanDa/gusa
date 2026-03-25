import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const ROLES_ADMIN = ['Sistemas', 'Gerente General']

const S = {
  label: {
    display: 'block', color: '#9ca3af', fontSize: '11px',
    fontWeight: 600, letterSpacing: '1px',
    textTransform: 'uppercase', marginBottom: '6px',
  },
  input: {
    width: '100%', backgroundColor: '#1a1f2e',
    border: '1px solid #1f2937', borderRadius: '8px',
    padding: '9px 12px', color: '#ffffff',
    fontSize: '14px', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  },
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: '16px',
  },
  modal: {
    backgroundColor: '#0f1117', border: '1px solid #1f2937',
    borderRadius: '20px', padding: '28px',
    width: '100%', maxWidth: '480px',
  },
  btnPrimario: {
    backgroundColor: '#facc15', color: '#030712',
    fontWeight: 700, fontSize: '13px',
    padding: '9px 20px', borderRadius: '8px',
    border: 'none', cursor: 'pointer',
  },
  btnSecundario: {
    backgroundColor: '#1f2937', color: '#9ca3af',
    fontWeight: 600, fontSize: '13px',
    padding: '9px 20px', borderRadius: '8px',
    border: 'none', cursor: 'pointer',
  },
}

function ModalCrearUsuario({ puestos, onClose, onCreado }) {
  const [form, setForm] = useState({ nombre: '', usuario: '', password: '', correo: '', id_puesto: puestos[0]?.id_puesto || '', status: true })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      const { data } = await api.post('/usuarios/', {
        ...form,
        id_puesto: parseInt(form.id_puesto),
      })
      onCreado(data); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear usuario.')
    } finally { setGuardando(false) }
  }

  const campos = [
    { label: 'Nombre completo', key: 'nombre', type: 'text', required: true },
    { label: 'Usuario (login)', key: 'usuario', type: 'text', required: true },
    { label: 'Contraseña', key: 'password', type: 'password', required: true },
    { label: 'Correo electrónico', key: 'correo', type: 'email', required: true },
  ]

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Nuevo usuario</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '16px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {campos.map(({ label, key, type, required }) => (
              <div key={key}>
                <label style={S.label}>{label}</label>
                <input type={type} required={required} value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={S.input}
                  onFocus={(e) => e.target.style.borderColor = '#facc15'}
                  onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                />
              </div>
            ))}

            <div>
              <label style={S.label}>Puesto</label>
              <select value={form.id_puesto} onChange={(e) => setForm({ ...form, id_puesto: e.target.value })} style={S.input}>
                {puestos.map((p) => <option key={p.id_puesto} value={p.id_puesto}>{p.nombre}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="status_nuevo" checked={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.checked })}
                style={{ accentColor: '#facc15', width: '16px', height: '16px' }}
              />
              <label htmlFor="status_nuevo" style={{ color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>Cuenta activa</label>
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={S.btnSecundario}>Cancelar</button>
            <button type="submit" disabled={guardando} style={S.btnPrimario}>{guardando ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalPassword({ usuario, onClose }) {
  const [password, setPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      await api.patch(`/usuarios/${usuario.id_usuario}/password`, { password })
      setOk(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar contraseña.')
    } finally { setGuardando(false) }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <p style={{ color: '#facc15', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>{usuario.usuario}</p>
            <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>Cambiar contraseña</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '16px', cursor: 'pointer' }}>✕</button>
        </div>

        {ok ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✅</div>
            <p style={{ color: '#4ade80', fontSize: '14px', fontWeight: 600 }}>Contraseña actualizada</p>
            <button onClick={onClose} style={{ ...S.btnSecundario, marginTop: '16px' }}>Cerrar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={S.label}>Nueva contraseña</label>
              <input type="password" required minLength={4} value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={S.input}
                onFocus={(e) => e.target.style.borderColor = '#facc15'}
                onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                autoFocus
              />
            </div>
            {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '14px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={S.btnSecundario}>Cancelar</button>
              <button type="submit" disabled={guardando} style={S.btnPrimario}>{guardando ? 'Guardando...' : 'Cambiar'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function Usuarios() {
  const { usuario: yo } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [puestos,  setPuestos]  = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalCrear, setModalCrear] = useState(false)
  const [modalPass,  setModalPass]  = useState(null)
  const [toggling,   setToggling]   = useState(null)

  const puesto  = yo?.puesto_nombre || ''
  const esAdmin = ROLES_ADMIN.includes(puesto)

  useEffect(() => {
    if (!esAdmin) { navigate('/inventario'); return }
    Promise.all([
      api.get('/usuarios/'),
      api.get('/usuarios/puestos'),
    ]).then(([u, p]) => {
      setUsuarios(u.data)
      setPuestos(p.data)
    }).finally(() => setCargando(false))
  }, [esAdmin, navigate])

  async function toggleStatus(id) {
    setToggling(id)
    try {
      const { data } = await api.patch(`/usuarios/${id}/status`)
      setUsuarios((prev) => prev.map((u) => u.id_usuario === id ? data : u))
      addToast(`Usuario ${data.nombre.split(' ')[0]} ${data.status ? 'activado' : 'desactivado'}`, data.status ? 'success' : 'info')
    } finally { setToggling(null) }
  }

  const puestoColor = {
    'Sistemas': '#facc15',
    'Gerente General': '#c084fc',
    'Encargado': '#60a5fa',
  }

  if (cargando) {
    return (
      <div style={{ backgroundColor: '#030712', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #facc15', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ color: '#6b7280', fontSize: '13px' }}>Cargando usuarios...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#030712', color: '#ffffff', minHeight: '100dvh' }}>

      {/* Cabecera */}
      <div style={{ backgroundColor: '#06080f', borderBottom: '1px solid #111827', padding: '20px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
              Gestión de <span style={{ color: '#facc15' }}>Usuarios</span>
            </h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setModalCrear(true)}
            style={{ ...S.btnPrimario, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: '20px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {usuarios.map((u) => (
            <div
              key={u.id_usuario}
              style={{
                backgroundColor: '#06080f',
                border: `1px solid ${u.status ? '#111827' : '#1f0a0a'}`,
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                opacity: u.status ? 1 : 0.6,
              }}
            >
              {/* Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '200px' }}>
                {/* Avatar */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: `${puestoColor[u.puesto_nombre] || '#374151'}20`,
                  border: `1px solid ${puestoColor[u.puesto_nombre] || '#374151'}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: puestoColor[u.puesto_nombre] || '#9ca3af',
                  fontWeight: 800, fontSize: '15px', flexShrink: 0,
                }}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
                    {u.nombre}
                    {u.id_usuario === yo?.id_usuario && (
                      <span style={{ color: '#374151', fontSize: '11px', fontWeight: 400, marginLeft: '8px' }}>(tú)</span>
                    )}
                  </p>
                  <p style={{ color: '#4b5563', fontSize: '12px' }}>
                    @{u.usuario} · {u.correo}
                  </p>
                </div>
              </div>

              {/* Puesto + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  color: puestoColor[u.puesto_nombre] || '#9ca3af',
                  backgroundColor: `${puestoColor[u.puesto_nombre] || '#374151'}12`,
                  border: `1px solid ${puestoColor[u.puesto_nombre] || '#374151'}30`,
                  fontSize: '11px', fontWeight: 700,
                  padding: '3px 10px', borderRadius: '20px',
                }}>
                  {u.puesto_nombre}
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px',
                  color: u.status ? '#4ade80' : '#ef4444',
                  backgroundColor: u.status ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${u.status ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  padding: '3px 8px', borderRadius: '20px',
                }}>
                  {u.status ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={() => setModalPass(u)}
                  style={{ backgroundColor: '#111827', color: '#9ca3af', border: 'none', borderRadius: '7px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                  title="Cambiar contraseña"
                >
                  🔑
                </button>
                <button
                  onClick={() => toggleStatus(u.id_usuario)}
                  disabled={toggling === u.id_usuario || u.id_usuario === yo?.id_usuario}
                  style={{
                    backgroundColor: u.status ? 'rgba(239,68,68,0.08)' : 'rgba(74,222,128,0.08)',
                    color: u.status ? '#f87171' : '#4ade80',
                    border: 'none', borderRadius: '7px',
                    padding: '6px 12px', fontSize: '12px',
                    cursor: u.id_usuario === yo?.id_usuario ? 'not-allowed' : 'pointer',
                    fontWeight: 600, opacity: u.id_usuario === yo?.id_usuario ? 0.3 : 1,
                  }}
                  title={u.id_usuario === yo?.id_usuario ? 'No puedes desactivar tu propio usuario' : u.status ? 'Desactivar' : 'Activar'}
                >
                  {toggling === u.id_usuario ? '...' : u.status ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalCrear && (
        <ModalCrearUsuario
          puestos={puestos}
          onClose={() => setModalCrear(false)}
          onCreado={(nuevo) => {
            setUsuarios((prev) => [...prev, nuevo])
            addToast(`Usuario @${nuevo.usuario} creado correctamente`, 'success')
          }}
        />
      )}
      {modalPass && (
        <ModalPassword usuario={modalPass} onClose={() => setModalPass(null)} />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
