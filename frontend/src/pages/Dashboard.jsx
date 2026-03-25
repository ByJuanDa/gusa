import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const ROLES_ADMIN = ['Sistemas', 'Gerente General']

function hora() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function CardAccion({ to, color, icon, titulo, desc, onClick }) {
  const [hover, setHover] = useState(false)
  const inner = (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        backgroundColor: hover ? '#0d1220' : '#06080f',
        border: `1px solid ${hover ? color + '40' : '#111827'}`,
        borderRadius: '16px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
      }}
    >
      <div style={{ backgroundColor: color + '15', border: `1px solid ${color}30`, borderRadius: '12px', padding: '12px', flexShrink: 0 }}>
        <span style={{ color, display: 'flex' }}>{icon}</span>
      </div>
      <div>
        <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{titulo}</p>
        <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.4 }}>{desc}</p>
      </div>
    </div>
  )
  if (onClick) return <button onClick={onClick} style={{ all: 'unset', display: 'block', width: '100%' }}>{inner}</button>
  return <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link>
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [stockBajo, setStockBajo] = useState([])
  const [ventasRecientes, setVentasRecientes] = useState([])
  const [cargando, setCargando] = useState(true)

  const puesto = usuario?.puesto_nombre || ''
  const esAdmin = ROLES_ADMIN.includes(puesto)
  const nombre = usuario?.nombre?.split(' ')[0] || ''

  useEffect(() => {
    Promise.all([
      api.get('/llantas/inventario'),
      api.get('/ventas/'),
    ]).then(([inv, ven]) => {
      const llantas = inv.data
      const ventas  = ven.data

      const hoy = new Date().toDateString()
      const ventasHoy   = ventas.filter((v) => v.status === 'activa' && new Date(v.fecha).toDateString() === hoy)
      const totalHoy    = ventasHoy.reduce((s, v) => s + v.total, 0)
      const totalMes    = ventas.filter((v) => v.status === 'activa').reduce((s, v) => s + v.total, 0)
      const stockTotal  = llantas.reduce((s, l) => s + l.stock, 0)

      setStats({
        ventasHoy: ventasHoy.length,
        totalHoy,
        totalMes,
        stockTotal,
        modelos: llantas.length,
      })
      setStockBajo(llantas.filter((l) => l.stock <= 3 && l.stock > 0).sort((a, b) => a.stock - b.stock).slice(0, 6))
      setVentasRecientes(ventas.slice(0, 5))
    }).finally(() => setCargando(false))
  }, [])

  function formatMonto(n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
  }
  function formatFecha(f) {
    return new Date(f).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ backgroundColor: '#030712', color: '#ffffff', minHeight: '100dvh' }}>

      {/* Header bienvenida */}
      <div style={{ backgroundColor: '#06080f', borderBottom: '1px solid #111827', padding: '24px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>{hora()}</p>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
              {nombre} <span style={{ color: '#facc15' }}>👋</span>
            </h1>
            <span style={{
              display: 'inline-block', marginTop: '8px',
              fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px',
              color: puesto === 'Encargado' ? '#60a5fa' : '#facc15',
              backgroundColor: puesto === 'Encargado' ? 'rgba(96,165,250,0.1)' : 'rgba(250,204,21,0.1)',
              border: `1px solid ${puesto === 'Encargado' ? 'rgba(96,165,250,0.2)' : 'rgba(250,204,21,0.2)'}`,
            }}>
              {puesto}
            </span>
          </div>

          {/* Stats rápidas */}
          {stats && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { label: 'Ventas hoy', value: stats.ventasHoy, color: '#ffffff' },
                { label: 'Total hoy', value: formatMonto(stats.totalHoy), color: '#4ade80' },
                { label: 'En stock', value: stats.stockTotal, color: '#facc15' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px 18px', textAlign: 'center', minWidth: '80px' }}>
                  <p style={{ color, fontWeight: 800, fontSize: '18px' }}>{value}</p>
                  <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Acciones rápidas */}
        <div>
          <h2 style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>
            ¿Qué quieres hacer?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            <CardAccion
              to="/ventas"
              color="#4ade80"
              titulo="Registrar una venta"
              desc="Agrega los productos vendidos y genera el registro automáticamente."
              icon={
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              }
            />
            <CardAccion
              to="/ventas"
              color="#60a5fa"
              titulo="Ver historial de ventas"
              desc="Consulta todas las ventas registradas y su estado."
              icon={
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                </svg>
              }
            />
            <CardAccion
              to="/inventario"
              color="#facc15"
              titulo="Ver inventario"
              desc="Revisa el stock disponible, precios y estado de cada llanta."
              icon={
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              }
            />
            {esAdmin && (
              <CardAccion
                to="/usuarios"
                color="#c084fc"
                titulo="Gestionar usuarios"
                desc="Crear nuevos empleados, activar o desactivar cuentas."
                icon={
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                }
              />
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>

          {/* Alertas de stock bajo */}
          {stockBajo.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ color: '#f87171' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </span>
                <h3 style={{ color: '#f87171', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Stock bajo — requiere atención
                </h3>
              </div>
              <div style={{ backgroundColor: '#0f1117', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                {stockBajo.map((l, i) => (
                  <Link
                    key={l.id}
                    to="/inventario"
                    style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: i < stockBajo.length - 1 ? '1px solid #111827' : 'none' }}
                  >
                    <div>
                      <p style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 600 }}>
                        {l.marca?.nombre_display || l.marca?.nombre} {l.modelo || ''}
                      </p>
                      <p style={{ color: '#4b5563', fontSize: '11px' }}>{l.medida} · {l.codigo}</p>
                    </div>
                    <span style={{ color: '#f87171', fontWeight: 800, fontSize: '18px', backgroundColor: 'rgba(239,68,68,0.1)', padding: '4px 12px', borderRadius: '8px' }}>
                      {l.stock}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Ventas recientes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Ventas recientes</h3>
              <Link to="/ventas" style={{ color: '#facc15', fontSize: '12px', textDecoration: 'none' }}>Ver todas →</Link>
            </div>
            {cargando ? (
              <div style={{ backgroundColor: '#06080f', border: '1px solid #111827', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#374151', fontSize: '13px' }}>Cargando...</p>
              </div>
            ) : ventasRecientes.length === 0 ? (
              <div style={{ backgroundColor: '#06080f', border: '1px solid #111827', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#374151', fontSize: '14px' }}>Sin ventas aún</p>
                <Link to="/ventas" style={{ color: '#facc15', fontSize: '13px', textDecoration: 'none', display: 'block', marginTop: '8px' }}>
                  Registrar primera venta →
                </Link>
              </div>
            ) : (
              <div style={{ backgroundColor: '#06080f', border: '1px solid #111827', borderRadius: '14px', overflow: 'hidden' }}>
                {ventasRecientes.map((v, i) => (
                  <Link
                    key={v.id}
                    to="/ventas"
                    style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: i < ventasRecientes.length - 1 ? '1px solid #0d1117' : 'none' }}
                  >
                    <div>
                      <p style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 600 }}>#{v.id} · {v.usuario_nombre?.split(' ')[0]}</p>
                      <p style={{ color: '#4b5563', fontSize: '11px' }}>{formatFecha(v.fecha)} · {v.num_items} pza</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: v.status === 'activa' ? '#4ade80' : '#6b7280', fontWeight: 700, fontSize: '14px' }}>
                        {formatMonto(v.total)}
                      </p>
                      {v.status === 'cancelada' && <p style={{ color: '#374151', fontSize: '10px' }}>cancelada</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
