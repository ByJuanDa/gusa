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

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COUNT   = Math.min(Math.floor(canvas.width / 10), 90)
    const MAX_D   = 130   // distancia máxima para trazar línea

    const particles = Array.from({ length: COUNT }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.5 + 0.5,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Mover
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      }

      // Líneas entre partículas cercanas
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x
          const dy   = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_D) {
            const alpha = (1 - dist / MAX_D) * 0.18
            ctx.strokeStyle = `rgba(250,204,21,${alpha})`
            ctx.lineWidth   = 0.7
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Puntos
      for (const p of particles) {
        ctx.fillStyle = 'rgba(250,204,21,0.45)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  useEffect(() => { return init() }, [init])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  )
}

const CSS = `
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

  * { box-sizing: border-box; }

  .cat-search:focus {
    border-color: #facc15 !important;
    box-shadow: 0 0 0 3px rgba(250,204,21,0.12);
    outline: none;
  }

  .brand-pill {
    padding: 5px 14px;
    border-radius: 999px;
    border: 1px solid #1f2937;
    background: transparent;
    color: #9ca3af;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    letter-spacing: 0.3px;
  }
  .brand-pill:hover  { border-color: #facc15; color: #facc15; }
  .brand-pill.active { background: #facc15; border-color: #facc15; color: #030712; }

  .tire-card {
    background: #0a0e17;
    border: 1px solid #1a2233;
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    animation: fadeUp 0.35s ease both;
  }
  .tire-card:hover {
    border-color: rgba(250,204,21,0.35);
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.5);
  }

  .tire-brand {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2.5px;
    color: #facc15;
    text-transform: uppercase;
  }
  .tire-model {
    font-size: 15px;
    font-weight: 700;
    color: #f9fafb;
    line-height: 1.2;
  }
  .tire-no-model {
    font-size: 13px;
    color: #4b5563;
    font-style: italic;
  }
  .tire-size {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(250,204,21,0.07);
    border: 1px solid rgba(250,204,21,0.2);
    color: #facc15;
    font-size: 13px;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 8px;
    width: fit-content;
    letter-spacing: 0.5px;
  }
  .tire-desc {
    font-size: 12px;
    color: #4b5563;
    line-height: 1.6;
    margin-top: 2px;
  }

  .divider-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 36px 0 16px;
    animation: fadeUp 0.3s ease both;
  }
  .divider-brand h3 {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 3px;
    color: #374151;
    text-transform: uppercase;
    white-space: nowrap;
    margin: 0;
  }
  .divider-line {
    flex: 1;
    height: 1px;
    background: #111827;
  }
  .divider-count {
    font-size: 11px;
    color: #1f2937;
    font-weight: 600;
    white-space: nowrap;
  }

  .empty-state {
    text-align: center;
    padding: 80px 0;
    color: #374151;
  }

  /* Scrollbar fino para el listado de marcas */
  .brand-scroller::-webkit-scrollbar { height: 4px; }
  .brand-scroller::-webkit-scrollbar-track { background: transparent; }
  .brand-scroller::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 4px; }
`

export default function Catalogo() {
  const [llantas, setLlantas]     = useState([])
  const [cargando, setCargando]   = useState(true)
  const [busqueda, setBusqueda]   = useState('')
  const [marcaFiltro, setMarcaFiltro] = useState('Todas')

  useEffect(() => {
    api.get('/llantas/catalogo')
      .then(({ data }) => setLlantas(data))
      .finally(() => setCargando(false))
  }, [])

  // Marcas únicas ordenadas
  const marcas = useMemo(() => {
    const set = new Set(llantas.map(l => l.marca_nombre || 'Sin marca'))
    return ['Todas', ...Array.from(set).sort()]
  }, [llantas])

  // Filtrar por búsqueda + marca
  const filtradas = useMemo(() => llantas.filter(l => {
    const texto = `${l.marca_nombre || ''} ${l.modelo || ''} ${l.medida}`.toLowerCase()
    const coincideBusqueda = texto.includes(busqueda.toLowerCase())
    const coincideMarca    = marcaFiltro === 'Todas' || l.marca_nombre === marcaFiltro
    return coincideBusqueda && coincideMarca
  }), [llantas, busqueda, marcaFiltro])

  // Agrupar por marca para vista sin filtro de marca específico
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

      {/* Todo el contenido encima del canvas */}
      <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ── Cabecera ── */}
      <div style={{ background: 'linear-gradient(180deg,rgba(6,8,15,0.95) 0%,rgba(3,7,18,0.9) 100%)', borderBottom: '1px solid #0d1117', padding: '48px 24px 28px', textAlign: 'center', backdropFilter: 'blur(2px)' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>
          Nuestro <span style={{ color: '#facc15' }}>Catálogo</span>
        </h2>
        <p style={{ color: '#4b5563', fontSize: 14, margin: '0 0 24px' }}>
          {llantas.length} llantas disponibles
        </p>

        {/* Búsqueda */}
        <input
          className="cat-search"
          type="text"
          placeholder="Buscar por marca, modelo o medida..."
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setMarcaFiltro('Todas') }}
          style={{
            background: '#0a0e17', border: '1px solid #1a2233',
            borderRadius: 12, padding: '11px 20px',
            color: '#fff', fontSize: 14, width: '100%', maxWidth: 440,
            display: 'block', margin: '0 auto 12px', transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />

        {/* Descargar lista */}
        <a
          href={`${BACKEND}/api/reportes/lista-precios`}
          download
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

      {/* ── Filtros de marca ── */}
      <div
        className="brand-scroller"
        style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          padding: '16px 24px', borderBottom: '1px solid #0d1117',
          scrollbarWidth: 'thin',
        }}
      >
        {marcas.map(m => (
          <button
            key={m}
            className={`brand-pill${marcaFiltro === m ? ' active' : ''}`}
            onClick={() => { setMarcaFiltro(m); setBusqueda('') }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 24px 60px' }}>
        {filtradas.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 15 }}>No se encontraron llantas.</p>
          </div>
        ) : (
          agrupadas.map(([marca, items], gi) => (
            <div key={marca}>
              {/* Separador de marca */}
              <div className="divider-brand" style={{ animationDelay: `${gi * 30}ms` }}>
                <div className="divider-line" />
                <h3>{marca}</h3>
                <div className="divider-line" />
                <span className="divider-count">{items.length}</span>
              </div>

              {/* Grid de tarjetas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {items.map((llanta, i) => (
                  <div
                    key={llanta.id}
                    className="tire-card"
                    style={{ animationDelay: `${gi * 30 + i * 25}ms` }}
                  >
                    <span className="tire-brand">{(llanta.marca_nombre || '').toUpperCase()}</span>
                    {llanta.modelo
                      ? <span className="tire-model">{llanta.modelo}</span>
                      : <span className="tire-no-model">Sin modelo</span>
                    }
                    <span className="tire-size">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ opacity: 0.7 }}>
                        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
                      </svg>
                      {llanta.medida}
                    </span>
                    {llanta.descripcion && (
                      <p className="tire-desc">{llanta.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      </div>{/* /zIndex wrapper */}
    </div>
  )
}
