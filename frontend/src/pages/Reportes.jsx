import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const ROLES_ADMIN = ['Sistemas', 'Gerente General']

const S = {
  page: {
    backgroundColor: '#030712', color: '#ffffff',
    minHeight: '100dvh', padding: '0 0 60px',
  },
  header: {
    backgroundColor: '#06080f',
    borderBottom: '1px solid #111827',
    padding: '24px 20px',
  },
  card: {
    backgroundColor: '#0f1117',
    border: '1px solid #1f2937',
    borderRadius: '16px',
    padding: '24px',
  },
  label: {
    display: 'block', color: '#9ca3af', fontSize: '11px',
    fontWeight: 600, letterSpacing: '1px',
    textTransform: 'uppercase', marginBottom: '6px',
  },
  input: {
    width: '100%', backgroundColor: '#1a1f2e',
    border: '1px solid #1f2937', borderRadius: '8px',
    padding: '9px 12px', color: '#ffffff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  },
  btnPrimario: (color = '#facc15') => ({
    backgroundColor: color,
    color: color === '#facc15' ? '#030712' : '#ffffff',
    fontWeight: 700, fontSize: '13px',
    padding: '10px 22px', borderRadius: '8px',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px',
  }),
  btnDeshabilitado: {
    backgroundColor: '#1f2937', color: '#4b5563',
    fontWeight: 700, fontSize: '13px',
    padding: '10px 22px', borderRadius: '8px',
    border: 'none', cursor: 'not-allowed',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
}

function IconDescarga() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

function IconExcel() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#166534" fillOpacity="0.3" />
      <text x="6" y="22" fontSize="14" fontWeight="bold" fill="#4ade80">XLS</text>
    </svg>
  )
}

function BadgeRol({ roles }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
      {roles.map((r) => (
        <span key={r} style={{
          backgroundColor: 'rgba(250,204,21,0.08)',
          color: '#facc15', fontSize: '10px', fontWeight: 700,
          padding: '2px 8px', borderRadius: '5px', letterSpacing: '0.5px',
        }}>
          {r}
        </span>
      ))}
    </div>
  )
}

// ── Card de reporte inventario ─────────────────────────────────
function CardInventario() {
  const { addToast } = useToast()
  const [descargando, setDescargando] = useState(false)

  async function descargar() {
    setDescargando(true)
    try {
      const resp = await api.get('/reportes/inventario', { responseType: 'blob' })
      const url  = URL.createObjectURL(resp.data)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      addToast('Reporte de inventario descargado', 'success')
    } catch {
      addToast('No se pudo generar el reporte', 'error')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
        <IconExcel />
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
            Reporte de Inventario
          </h3>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            Todas las llantas con stock, costos, precios y valor total en almacén.
          </p>
          <BadgeRol roles={['Sistemas', 'Gerente General', 'Encargado']} />
        </div>
      </div>

      <div style={{ backgroundColor: '#0a0e17', border: '1px solid #1f2937', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px' }}>
        <p style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.7 }}>
          <strong style={{ color: '#e5e7eb' }}>Contenido del archivo:</strong><br />
          • Lista completa de llantas ordenadas por código<br />
          • Stock actual, costo de compra, precio de venta<br />
          • Valor total en almacén por llanta y totales generales<br />
          • Indica qué modelos están en catálogo público
        </p>
      </div>

      <button
        onClick={descargar}
        disabled={descargando}
        style={descargando ? S.btnDeshabilitado : S.btnPrimario('#4ade80')}
      >
        <IconDescarga />
        {descargando ? 'Generando...' : 'Descargar inventario (.xlsx)'}
      </button>
    </div>
  )
}

// ── Card de reporte ventas ─────────────────────────────────────
function CardVentas() {
  const { addToast } = useToast()
  const [descargando, setDescargando] = useState(false)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  async function descargar() {
    setDescargando(true)
    try {
      const params = new URLSearchParams()
      if (desde) params.set('fecha_desde', desde)
      if (hasta) params.set('fecha_hasta', hasta)

      const resp = await api.get(`/reportes/ventas?${params}`, { responseType: 'blob' })
      const url  = URL.createObjectURL(resp.data)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      addToast('Reporte de ventas descargado', 'success')
    } catch {
      addToast('No se pudo generar el reporte', 'error')
    } finally {
      setDescargando(false)
    }
  }

  const hoy = new Date().toISOString().slice(0, 10)
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().slice(0, 10)

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
        <IconExcel />
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
            Reporte de Ventas
          </h3>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            Historial de ventas con detalle por línea de producto. Puedes filtrar por rango de fechas.
          </p>
          <BadgeRol roles={['Sistemas', 'Gerente General']} />
        </div>
      </div>

      <div style={{ backgroundColor: '#0a0e17', border: '1px solid #1f2937', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px' }}>
        <p style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.7 }}>
          <strong style={{ color: '#e5e7eb' }}>Contenido del archivo:</strong><br />
          • Hoja 1: Lista de ventas (folio, fecha, vendedor, piezas, total, estado)<br />
          • Hoja 2: Detalle por producto (código, marca, medida, cantidad, precio, subtotal)<br />
          • Totales de ingresos y piezas al final de cada hoja
        </p>
      </div>

      {/* Filtros de fecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={S.label}>Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            max={hasta || hoy} style={S.input}
            onFocus={(e) => e.target.style.borderColor = '#facc15'}
            onBlur={(e) => e.target.style.borderColor = '#1f2937'}
          />
        </div>
        <div>
          <label style={S.label}>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            min={desde} max={hoy} style={S.input}
            onFocus={(e) => e.target.style.borderColor = '#facc15'}
            onBlur={(e) => e.target.style.borderColor = '#1f2937'}
          />
        </div>
      </div>

      {/* Atajos rápidos */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {[
          { label: 'Este mes', desde: primerDiaMes, hasta: hoy },
          { label: 'Hoy',      desde: hoy,           hasta: hoy },
          { label: 'Todo',     desde: '',             hasta: '' },
        ].map(({ label, desde: d, hasta: h }) => (
          <button key={label} type="button"
            onClick={() => { setDesde(d); setHasta(h) }}
            style={{
              backgroundColor: '#1f2937', color: '#9ca3af',
              border: 'none', borderRadius: '6px',
              padding: '5px 12px', fontSize: '12px', cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={descargar}
        disabled={descargando}
        style={descargando ? S.btnDeshabilitado : S.btnPrimario('#facc15')}
      >
        <IconDescarga />
        {descargando ? 'Generando...' : 'Descargar ventas (.xlsx)'}
      </button>
    </div>
  )
}


// ── Página principal ───────────────────────────────────────────
export default function Reportes() {
  const { usuario } = useAuth()
  const puesto  = usuario?.puesto_nombre || ''
  const esAdmin = ROLES_ADMIN.includes(puesto)

  return (
    <div style={S.page}>
      {/* Cabecera */}
      <div style={S.header}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
            Reportes <span style={{ color: '#facc15' }}>y Exportaciones</span>
          </h2>
          <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
            Descarga reportes en formato Excel (.xlsx) para análisis externo o respaldo.
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: '900px', margin: '28px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Cards */}
        <CardInventario />
        {esAdmin && <CardVentas />}
      </div>
    </div>
  )
}
