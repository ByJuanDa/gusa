import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import api from '../services/api'

const BACKEND = import.meta.env.VITE_API_URL || ''

// ── Fondo de partículas ───────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null)
  const init = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const COUNT = Math.min(Math.floor(canvas.width / 10), 90)
    const MAX_D = 130
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.5,
    }))
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_D) {
            ctx.strokeStyle = `rgba(250,204,21,${(1 - dist / MAX_D) * 0.18})`
            ctx.lineWidth = 0.7
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke()
          }
        }
      }
      for (const p of particles) {
        ctx.fillStyle = 'rgba(250,204,21,0.45)'
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  useEffect(() => init(), [init])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.55 }} />
}

// ── Modal de detalle ─────────────────────────────────────────
function ModalDetalle({ llanta, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  if (!llanta) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'fadeBg 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1117', border: '1px solid #1f2937',
          borderRadius: 20, padding: '32px 28px', maxWidth: 420, width: '100%',
          animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
        }}
      >
        {/* Cerrar */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}
        >✕</button>

        {/* Ícono de llanta decorativo */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#facc15" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" />
              <line x1="12" y1="3" x2="12" y2="8.5" strokeWidth={1.5} />
              <line x1="12" y1="15.5" x2="12" y2="21" strokeWidth={1.5} />
              <line x1="3" y1="12" x2="8.5" y2="12" strokeWidth={1.5} />
              <line x1="15.5" y1="12" x2="21" y2="12" strokeWidth={1.5} />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2.5px', color: '#facc15', textTransform: 'uppercase', marginBottom: 3 }}>
              {llanta.marca_nombre}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb', lineHeight: 1.2 }}>
              {llanta.modelo || <span style={{ color: '#4b5563', fontStyle: 'italic', fontWeight: 400, fontSize: 16 }}>Sin modelo</span>}
            </div>
          </div>
        </div>

        {/* Filas de datos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row label="Medida" value={llanta.medida} mono />
          <Row label="Código" value={llanta.codigo} mono />
          {llanta.descripcion && <Row label="Descripción" value={llanta.descripcion} />}
        </div>

        {/* Pie */}
        <p style={{ marginTop: 24, fontSize: 11, color: '#374151', textAlign: 'center' }}>
          Consulta disponibilidad y precios con nuestro equipo
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #111827' }}>
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 600, textAlign: 'right', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeBg { from { opacity:0; } to { opacity:1; } }
  @keyframes popIn  { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }

  * { box-sizing: border-box; }

  .cat-search { transition: border-color 0.2s, box-shadow 0.2s; }
  .cat-search:focus {
    border-color: #facc15 !important;
    box-shadow: 0 0 0 3px rgba(250,204,21,0.12);
    outline: none;
  }

  .brand-pill {
    padding: 6px 16px;
    border-radius: 999px;
    border: 1px solid #1f2937;
    background: rgba(10,14,23,0.8);
    color: #9ca3af;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.3px;
  }
  .brand-pill:hover  { border-color: #facc15; color: #facc15; background: rgba(250,204,21,0.05); }
  .brand-pill.active { background: #facc15; border-color: #facc15; color: #030712; }

  .tire-card {
    background: rgba(10,14,23,0.85);
    border: 1px solid #1a2233;
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    cursor: pointer;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    animation: fadeUp 0.35s ease both;
    backdrop-filter: blur(4px);
  }
  .tire-card:hover {
    border-color: rgba(250,204,21,0.45);
    transform: translateY(-4px);
    box-shadow: 0 10px 32px rgba(0,0,0,0.55);
  }
  .tire-card:hover .tire-hint { opacity: 1; }

  .tire-brand {
    font-size: 10px; font-weight: 800;
    letter-spacing: 2.5px; color: #facc15; text-transform: uppercase;
  }
  .tire-model { font-size: 15px; font-weight: 700; color: #f1f5f9; line-height: 1.2; }
  .tire-no-model { font-size: 13px; color: #374151; font-style: italic; }
  .tire-size {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(250,204,21,0.07); border: 1px solid rgba(250,204,21,0.2);
    color: #facc15; font-size: 13px; font-family: 'Courier New', monospace;
    font-weight: 700; padding: 4px 12px; border-radius: 8px;
    width: fit-content; letter-spacing: 0.5px;
  }
  .tire-hint {
    font-size: 11px; color: #374151; margin-top: 2px;
    opacity: 0; transition: opacity 0.2s;
  }

  .divider-brand {
    display: flex; align-items: center; gap: 14px;
    margin: 32px 0 14px;
    animation: fadeUp 0.3s ease both;
  }
  .divider-brand span {
    font-size: 11px; font-weight: 800; letter-spacing: 3px;
    color: #4b5563; text-transform: uppercase; white-space: nowrap;
  }
  .divider-line { flex: 1; height: 1px; background: #0d1117; }
  .divider-count {
    font-size: 11px; color: #1f2937; font-weight: 700;
    background: #0a0e17; border: 1px solid #1a2233;
    padding: 2px 8px; border-radius: 999px;
  }
`

// ── Página principal ─────────────────────────────────────────
export default function Catalogo() {
  const [llantas, setLlantas]         = useState([])
  const [cargando, setCargando]       = useState(true)
  const [busqueda, setBusqueda]       = useState('')
  const [marcaFiltro, setMarcaFiltro] = useState('Todas')
  const [seleccionada, setSeleccionada] = useState(null)

  useEffect(() => {
    api.get('/llantas/catalogo').then(({ data }) => setLlantas(data)).finally(() => setCargando(false))
  }, [])

  const marcas = useMemo(() => {
    const set = new Set(llantas.map(l => l.marca_nombre || 'Sin marca'))
    return ['Todas', ...Array.from(set).sort()]
  }, [llantas])

  const filtradas = useMemo(() => llantas.filter(l => {
    const texto = `${l.marca_nombre || ''} ${l.modelo || ''} ${l.medida}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase()) && (marcaFiltro === 'Todas' || l.marca_nombre === marcaFiltro)
  }), [llantas, busqueda, marcaFiltro])

  const agrupadas = useMemo(() => {
    const map = new Map()
    filtradas.forEach(l => {
      const m = l.marca_nombre || 'Sin marca'
      if (!map.has(m)) map.set(m, [])
      map.get(m).push(l)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtradas])

  if (cargando) return (
    <div style={{ background: '#030712', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid #facc15', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: '#6b7280', fontSize: 13 }}>Cargando catálogo...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ background: '#030712', color: '#fff', minHeight: '100dvh', position: 'relative' }}>
      <style>{CSS}</style>
      <ParticleCanvas />
      <ModalDetalle llanta={seleccionada} onClose={() => setSeleccionada(null)} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Cabecera ── */}
        <div style={{ background: 'linear-gradient(180deg,rgba(6,8,15,0.97) 0%,rgba(3,7,18,0.92) 100%)', borderBottom: '1px solid #0d1117', padding: '48px 24px 28px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>
            Nuestro <span style={{ color: '#facc15' }}>Catálogo</span>
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>
            {llantas.length} llantas disponibles
          </p>
          <input
            className="cat-search"
            type="text"
            placeholder="Buscar por marca, modelo o medida..."
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setMarcaFiltro('Todas') }}
            style={{
              background: 'rgba(10,14,23,0.9)', border: '1px solid #1a2233',
              borderRadius: 12, padding: '11px 20px', color: '#fff', fontSize: 14,
              width: '100%', maxWidth: 440, display: 'block', margin: '0 auto 14px',
            }}
          />
          <a
            href={`${BACKEND}/api/reportes/lista-precios`} download
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.25)',
              color: '#facc15', fontWeight: 700, fontSize: 13,
              padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Descargar lista de precios (.xlsx)
          </a>
        </div>

        {/* ── Filtros de marca (wrap, no scroll) ── */}
        <div style={{ background: 'rgba(3,7,18,0.95)', borderBottom: '1px solid #0d1117', padding: '14px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {marcas.map(m => (
              <button
                key={m}
                className={`brand-pill${marcaFiltro === m ? ' active' : ''}`}
                onClick={() => { setMarcaFiltro(m); setBusqueda('') }}
              >{m}</button>
            ))}
          </div>
        </div>

        {/* ── Contenido ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 24px 60px' }}>
          {filtradas.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#374151', padding: '80px 0', fontSize: 15 }}>
              No se encontraron llantas.
            </p>
          ) : (
            agrupadas.map(([marca, items], gi) => (
              <div key={marca}>
                <div className="divider-brand" style={{ animationDelay: `${gi * 30}ms` }}>
                  <div className="divider-line" />
                  <span>{marca}</span>
                  <div className="divider-line" />
                  <span className="divider-count">{items.length}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {items.map((llanta, i) => (
                    <div
                      key={llanta.id}
                      className="tire-card"
                      style={{ animationDelay: `${gi * 30 + i * 20}ms` }}
                      onClick={() => setSeleccionada(llanta)}
                    >
                      <span className="tire-brand">{(llanta.marca_nombre || '').toUpperCase()}</span>
                      {llanta.modelo
                        ? <span className="tire-model">{llanta.modelo}</span>
                        : <span className="tire-no-model">Sin modelo</span>}
                      <span className="tire-size">
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ opacity: 0.7 }}>
                          <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        {llanta.medida}
                      </span>
                      <span className="tire-hint">Ver detalles →</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
