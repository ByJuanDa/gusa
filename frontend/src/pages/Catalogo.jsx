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
// ── Guía de medidas con animación SVG ────────────────────────
const GUIA_CSS = `
  @keyframes drawRing {
    from { stroke-dashoffset: var(--circ); }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes gAppear {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes gSlideR {
    from { opacity:0; transform:translateX(-8px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes gSlideU {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes gSlideL {
    from { opacity:0; transform:translateX(8px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes highlight {
    0%   { opacity:0; }
    30%  { opacity:1; }
    70%  { opacity:1; }
    100% { opacity:0; }
  }
  @keyframes growH {
    from { stroke-dashoffset: 300; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes growV {
    from { stroke-dashoffset: 300; }
    to   { stroke-dashoffset: 0; }
  }

  /* Tire draw-in */
  .gt-tread { --circ:820; stroke-dasharray:820; stroke-dashoffset:820; animation: drawRing 1.1s 0.1s ease forwards; }
  .gt-side  { --circ:580; stroke-dasharray:580; stroke-dashoffset:580; animation: drawRing 0.9s 0.5s ease forwards; }
  .gt-rim   { --circ:380; stroke-dasharray:380; stroke-dashoffset:380; animation: drawRing 0.7s 0.9s ease forwards; }
  .gt-hub   { opacity:0; animation: gAppear 0.4s 1.1s ease forwards; }

  /* Paso 1: ANCHO (azul) — aparece a los 1.6s */
  .ga-hl    { opacity:0; animation: highlight 1.2s 1.5s ease forwards; }
  .ga-line  { stroke-dasharray:300; stroke-dashoffset:300; opacity:0;
              animation: gAppear 0s 1.5s forwards, growH 0.5s 1.5s ease forwards; }
  .ga-text  { opacity:0; animation: gSlideU 0.4s 1.9s ease forwards; }

  /* Paso 2: PERFIL (verde) — aparece a los 2.8s */
  .gp-hl    { opacity:0; animation: highlight 1.2s 2.8s ease forwards; }
  .gp-line  { stroke-dasharray:300; stroke-dashoffset:300; opacity:0;
              animation: gAppear 0s 2.8s forwards, growV 0.5s 2.8s ease forwards; }
  .gp-text  { opacity:0; animation: gSlideL 0.4s 3.1s ease forwards; }

  /* Paso 3: RIN (amarillo) — aparece a los 4.1s */
  .gr-hl    { opacity:0; animation: highlight 1.2s 4.1s ease forwards; }
  .gr-line  { stroke-dasharray:300; stroke-dashoffset:300; opacity:0;
              animation: gAppear 0s 4.1s forwards, growH 0.5s 4.1s ease forwards; }
  .gr-text  { opacity:0; animation: gSlideR 0.4s 4.4s ease forwards; }

  /* Badge final */
  .g-badge  { opacity:0; animation: gAppear 0.6s 5.4s ease forwards; }
`

function Arrow({ x1,y1,x2,y2, color, size=6 }) {
  const dx = x2-x1, dy = y2-y1
  const len = Math.sqrt(dx*dx+dy*dy)
  const ux = dx/len, uy = dy/len
  const px = -uy, py = ux
  const tip1 = [x1, y1]
  const tip2 = [x2, y2]
  const mkHead = ([tx,ty],[udx,udy]) =>
    `${tx},${ty} ${tx-udx*size+px*size*0.5},${ty-udy*size+py*size*0.5} ${tx-udx*size-px*size*0.5},${ty-udy*size-py*size*0.5}`
  return <>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.8"/>
    <polygon points={mkHead(tip1,[-ux,-uy])} fill={color}/>
    <polygon points={mkHead(tip2,[ux,uy])}  fill={color}/>
  </>
}

function TireDiagram() {
  // Layout: tire centered, labels outside — nothing overlaps
  // ViewBox 420×320:  tire at cx=185,cy=148
  const cx = 185, cy = 148
  const rOut = 92   // outer tire
  const rSide = 72  // inner tread / sidewall start
  const rRim  = 44  // rim

  // ── Annotation coordinates ──
  // ANCHO: arrow below tire
  const ay  = cy + rOut + 38             // y of arrow
  const ax1 = cx - rOut, ax2 = cx + rOut // x span

  // PERFIL: vertical arrow on the RIGHT side
  // Shows radial height from rim to outer at 12-o'clock, positioned right
  const pfx  = cx + rOut + 42           // x of arrow
  const pfy1 = cy - rOut                // top of tire  (= 56)
  const pfy2 = cy - rRim                // top of rim   (= 104)

  // RIN: horizontal arrow inside rim, label below it (clear of badge)
  const rix1 = cx - rRim, rix2 = cx + rRim
  const riy  = cy + 14                  // slightly below center
  const rilY = riy + 16                 // label y (below arrow)

  return (
    <svg viewBox="0 0 420 320" style={{ width:'100%', display:'block' }}>
      <style>{GUIA_CSS}</style>

      {/* Fondo sólido para que las partículas no se cuelen */}
      <rect x="0" y="0" width="420" height="320" fill="#060a12" rx="12"/>

      {/* ── Llanta ── */}
      <circle cx={cx} cy={cy} r={rOut}  fill="none" stroke="#3a4f65" strokeWidth={20} className="gt-tread"/>
      <circle cx={cx} cy={cy} r={rSide} fill="none" stroke="#192030" strokeWidth={2}  className="gt-side"/>
      <circle cx={cx} cy={cy} r={rRim}  fill="#0c1520" stroke="#2a3d52" strokeWidth={3} className="gt-rim"/>
      {[30,90,150,210,270,330].map(a => {
        const rad = a*Math.PI/180
        return <line key={a}
          x1={cx+15*Math.cos(rad)} y1={cy+15*Math.sin(rad)}
          x2={cx+40*Math.cos(rad)} y2={cy+40*Math.sin(rad)}
          stroke="#1e2d3d" strokeWidth="3" className="gt-hub"/>
      })}
      <circle cx={cx} cy={cy} r={13} fill="#09111c" stroke="#1e2d3d" strokeWidth={2} className="gt-hub"/>

      {/* ══ ANCHO (azul) — flecha abajo ══ */}
      <circle cx={cx} cy={cy} r={rOut} fill="none" stroke="#60a5fa" strokeWidth={21} strokeOpacity="0.13" className="ga-hl"/>
      <g className="ga-line">
        {/* guías verticales punteadas */}
        <line x1={ax1} y1={cy+rOut} x2={ax1} y2={ay-5} stroke="#60a5fa" strokeWidth="1" strokeDasharray="4,3" opacity="0.45"/>
        <line x1={ax2} y1={cy+rOut} x2={ax2} y2={ay-5} stroke="#60a5fa" strokeWidth="1" strokeDasharray="4,3" opacity="0.45"/>
        <Arrow x1={ax1} y1={ay} x2={ax2} y2={ay} color="#60a5fa"/>
      </g>
      <g className="ga-text">
        <rect x={cx-48} y={ay+8} width={96} height={22} rx="6" fill="rgba(96,165,250,0.1)" stroke="rgba(96,165,250,0.3)" strokeWidth="1"/>
        <text x={cx} y={ay+23} textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="800" fontFamily="monospace">ANCHO  205 mm</text>
      </g>

      {/* ══ PERFIL (verde) — flecha derecha vertical ══ */}
      <circle cx={cx} cy={cy} r={(rOut+rRim)/2} fill="none" stroke="#34d399" strokeWidth={rOut-rRim} strokeOpacity="0.10" className="gp-hl"/>
      <g className="gp-line">
        {/* guías horizontales desde 12-o'clock hacia la derecha */}
        <line x1={cx} y1={pfy1} x2={pfx-5} y2={pfy1} stroke="#34d399" strokeWidth="1" strokeDasharray="4,3" opacity="0.45"/>
        <line x1={cx} y1={pfy2} x2={pfx-5} y2={pfy2} stroke="#34d399" strokeWidth="1" strokeDasharray="4,3" opacity="0.45"/>
        <Arrow x1={pfx} y1={pfy1} x2={pfx} y2={pfy2} color="#34d399"/>
      </g>
      <g className="gp-text">
        <rect x={pfx+8} y={(pfy1+pfy2)/2-13} width={84} height={26} rx="6" fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.3)" strokeWidth="1"/>
        <text x={pfx+50} y={(pfy1+pfy2)/2+1} textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="800" fontFamily="monospace">PERFIL  60%</text>
      </g>

      {/* ══ RIN (amarillo) — flecha dentro del rin, label abajo ══ */}
      <circle cx={cx} cy={cy} r={rRim} fill="none" stroke="#facc15" strokeWidth={5} strokeOpacity="0.28" className="gr-hl"/>
      <g className="gr-line">
        <Arrow x1={rix1} y1={riy} x2={rix2} y2={riy} color="#facc15"/>
      </g>
      <g className="gr-text">
        {/* label centrado DEBAJO de la flecha del rin */}
        <rect x={cx-34} y={rilY+2} width={68} height={22} rx="6" fill="rgba(250,204,21,0.1)" stroke="rgba(250,204,21,0.3)" strokeWidth="1"/>
        <text x={cx} y={rilY+17} textAnchor="middle" fill="#facc15" fontSize="12" fontWeight="800" fontFamily="monospace">RIN  13"</text>
      </g>

      {/* ══ Badge 205/60R13 — aparece al final, sobre el rin ══ */}
      <g className="g-badge">
        <rect x={cx-62} y={cy-17} width={124} height={34} rx="10"
          fill="rgba(6,10,18,0.97)" stroke="#1f2937" strokeWidth="1.5"/>
        <text x={cx} y={cy+6} textAnchor="middle" fontFamily="'Courier New',monospace" fontSize="19" fontWeight="900">
          <tspan fill="#60a5fa">205</tspan>
          <tspan fill="#374151">/</tspan>
          <tspan fill="#34d399">60</tspan>
          <tspan fill="#f87171">R</tspan>
          <tspan fill="#facc15">13</tspan>
        </text>
      </g>
    </svg>
  )
}

function ModalGuia({ onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, animation:'fadeBg 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#0d1117', border:'1px solid #1f2937', borderRadius:20, padding:'28px 24px', maxWidth:460, width:'100%', animation:'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', position:'relative' }}>

        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:20, lineHeight:1, padding:4 }}>✕</button>

        <h3 style={{ fontSize:16, fontWeight:800, color:'#f9fafb', margin:'0 0 2px' }}>¿Cómo leer la medida de una llanta?</h3>
        <p style={{ fontSize:12, color:'#6b7280', margin:'0 0 20px' }}>La animación muestra qué significa cada número</p>

        {/* Diagrama animado */}
        <div style={{ background:'#060a12', borderRadius:14, padding:'16px 8px 8px', marginBottom:20 }}>
          <TireDiagram />
        </div>

        {/* Leyenda compacta */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 12px', marginBottom:16 }}>
          {[
            { color:'#60a5fa', label:'205', title:'Ancho', desc:'mm de pared a pared' },
            { color:'#34d399', label:'60',  title:'Perfil', desc:'% del ancho — altura del flanco' },
            { color:'#f87171', label:'R',   title:'Radial', desc:'tipo de construcción' },
            { color:'#facc15', label:'13',  title:'Rin',   desc:'diámetro en pulgadas' },
          ].map(({ color, label, title, desc }) => (
            <div key={label} style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ minWidth:28, height:28, borderRadius:6, background:`${color}15`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace', fontWeight:800, fontSize:12, color, flexShrink:0 }}>{label}</div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#e5e7eb' }}>{title}</div>
                <div style={{ fontSize:10, color:'#4b5563' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:'rgba(250,204,21,0.06)', border:'1px solid rgba(250,204,21,0.15)', borderRadius:10, padding:'10px 12px', display:'flex', gap:8, alignItems:'flex-start' }}>
          <span style={{ fontSize:14 }}>💡</span>
          <p style={{ margin:0, fontSize:11, color:'#9ca3af', lineHeight:1.6 }}>
            La medida está impresa en la pared lateral de tu llanta actual. También puedes consultarla en el manual de tu vehículo.
          </p>
        </div>
      </div>
    </div>
  )
}

function ModalDetalle({ llanta, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onClose])

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

        {/* Precio destacado */}
        {llanta.precio_venta > 0 && (
          <div style={{ background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.18)', borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Precio de venta</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#facc15', letterSpacing: '-0.5px' }}>
              ${llanta.precio_venta.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Filas de datos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row label="Medida" value={llanta.medida} mono />
          <Row label="Código" value={llanta.codigo} mono />
          {llanta.descripcion && <Row label="Descripción" value={llanta.descripcion} />}
        </div>

        {/* Pie — botones WhatsApp */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, color: '#4b5563', textAlign: 'center', margin: '0 0 4px' }}>¿Te interesa? Contáctanos por WhatsApp</p>
          {[['55 3334 8943','525533348943'],['55 2185 3170','525521853170']].map(([num, wa]) => (
            <a key={wa}
              href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola, me interesa la llanta ${llanta.marca_nombre} ${llanta.modelo || ''} ${llanta.medida} (${llanta.codigo})`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#128c7e', borderRadius: 10, padding: '10px 16px', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#075e54'}
              onMouseLeave={e => e.currentTarget.style.background='#128c7e'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              {num}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

const WA_NUMEROS = [
  { label: '55 3334 8943', wa: '525533348943' },
  { label: '55 2185 3170', wa: '525521853170' },
]
const WA_MSG = encodeURIComponent('Hola, me gustaría consultar disponibilidad de llantas.')

function BurbujaWhatsApp() {
  const [abierto, setAbierto] = useState(false)
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
      {abierto && (
        <div style={{
          background: '#0d1117', border: '1px solid #1f2937', borderRadius: 16,
          padding: '16px 18px', minWidth: 220,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          animation: 'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Contáctanos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {WA_NUMEROS.map(({ label, wa }) => (
              <a key={wa}
                href={`https://wa.me/${wa}?text=${WA_MSG}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#128c7e', borderRadius: 10, padding: '10px 14px', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#075e54'}
                onMouseLeave={e => e.currentTarget.style.background='#128c7e'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                {label}
              </a>
            ))}
            <a
              href="https://maps.app.goo.gl/RQrmihDn6M7aF7B7A"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.15)'}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              Cómo llegar
            </a>
          </div>
        </div>
      )}
      <button
        onClick={() => setAbierto(o => !o)}
        title="Contáctanos por WhatsApp"
        style={{
          width: 58, height: 58, borderRadius: '50%',
          background: abierto ? '#075e54' : '#25d366',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
          transition: 'background 0.2s, transform 0.2s',
          transform: abierto ? 'rotate(45deg) scale(1.05)' : 'scale(1)',
        }}
        onMouseEnter={e => { if (!abierto) e.currentTarget.style.transform='scale(1.1)' }}
        onMouseLeave={e => { if (!abierto) e.currentTarget.style.transform='scale(1)' }}
      >
        {abierto
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          : <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
        }
      </button>
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
  .tire-price {
    font-size: 14px; font-weight: 800; color: #4ade80;
    letter-spacing: -0.3px;
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
  const [guiaAbierta, setGuiaAbierta]   = useState(false)

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
      {seleccionada && <ModalDetalle llanta={seleccionada} onClose={() => setSeleccionada(null)} />}
      {guiaAbierta && <ModalGuia onClose={() => setGuiaAbierta(false)} />}
      <BurbujaWhatsApp />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Cabecera ── */}
        <div style={{ background: 'linear-gradient(180deg,rgba(6,8,15,0.97) 0%,rgba(3,7,18,0.92) 100%)', borderBottom: '1px solid #0d1117', padding: '48px 24px 28px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>
            Nuestro <span style={{ color: '#facc15' }}>Catálogo</span>
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>
            {llantas.length} llantas disponibles
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:8, maxWidth:440, margin:'0 auto 14px' }}>
            <input
              className="cat-search"
              type="text"
              placeholder="Buscar por marca, modelo o medida..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setMarcaFiltro('Todas') }}
              style={{
                background: 'rgba(10,14,23,0.9)', border: '1px solid #1a2233',
                borderRadius: 12, padding: '11px 20px', color: '#fff', fontSize: 14,
                flex: 1,
              }}
            />
            <button
              onClick={() => setGuiaAbierta(true)}
              title="¿Cómo leer la medida?"
              style={{
                width: 42, height: 42, flexShrink: 0,
                background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.25)',
                borderRadius: 12, color: '#facc15', fontWeight: 800, fontSize: 16,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(250,204,21,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(250,204,21,0.08)'}
            >?</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
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
            <a
              href="https://maps.app.goo.gl/RQrmihDn6M7aF7B7A"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171', fontWeight: 700, fontSize: 13,
                padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              Cómo llegar
            </a>
          </div>
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
                      {llanta.precio_venta > 0 && (
                        <span className="tire-price">
                          ${llanta.precio_venta.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
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
