import { useEffect, useState } from 'react'
import api from '../services/api'

const BACKEND = import.meta.env.VITE_API_URL || ''

const STYLES = `
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }

  .card-tire {
    position: relative;
    background: #0a0e17;
    border: 1px solid #1f2937;
    border-radius: 18px;
    overflow: hidden;
    cursor: default;
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    opacity: 0;
  }
  .card-tire.visible {
    animation: fadeUp 0.45s ease forwards;
  }
  .card-tire:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: rgba(250,204,21,0.5);
    box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 20px rgba(250,204,21,0.08);
  }
  .card-tire:hover .card-overlay {
    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 55%, transparent 100%);
  }
  .card-tire:hover .card-desc {
    max-height: 60px;
    opacity: 1;
  }
  .card-tire:hover .card-img {
    transform: scale(1.06);
  }

  .card-img {
    width: 100%;
    height: 220px;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  .card-img-placeholder {
    width: 100%;
    height: 220px;
    background: linear-gradient(135deg, #0f1117 0%, #111827 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 45%, transparent 100%);
    transition: background 0.3s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 18px 16px 16px;
  }

  .card-brand {
    color: #facc15;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .card-model {
    color: #ffffff;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.2;
    text-shadow: 0 1px 6px rgba(0,0,0,0.8);
  }
  .card-size {
    display: inline-block;
    margin-top: 6px;
    background: rgba(250,204,21,0.15);
    border: 1px solid rgba(250,204,21,0.3);
    color: #facc15;
    font-size: 11px;
    font-family: monospace;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }
  .card-desc {
    color: #d1d5db;
    font-size: 12px;
    line-height: 1.5;
    margin-top: 8px;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.35s ease, opacity 0.3s ease;
  }

  .search-input {
    background: #0f1117;
    border: 1px solid #1f2937;
    border-radius: 12px;
    padding: 10px 20px;
    color: #fff;
    font-size: 14px;
    outline: none;
    width: 100%;
    max-width: 420px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .search-input:focus {
    border-color: #facc15;
    box-shadow: 0 0 0 3px rgba(250,204,21,0.1);
  }
  .btn-download {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(250,204,21,0.1);
    border: 1px solid rgba(250,204,21,0.3);
    color: #facc15;
    font-weight: 700;
    font-size: 13px;
    padding: 10px 20px;
    border-radius: 12px;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s;
    margin-top: 4px;
  }
  .btn-download:hover {
    background: rgba(250,204,21,0.2);
    transform: translateY(-1px);
  }
`

export default function Catalogo() {
  const [llantas, setLlantas]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    api.get('/llantas/catalogo')
      .then(({ data }) => { setLlantas(data); setTimeout(() => setVisible(true), 80) })
      .finally(() => setCargando(false))
  }, [])

  const filtradas = llantas.filter((l) =>
    `${l.marca_nombre || ''} ${l.modelo || ''} ${l.medida}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (cargando) return (
    <div style={{ backgroundColor: '#030712', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid #facc15', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: '#6b7280', fontSize: 13 }}>Cargando catálogo...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#030712', color: '#fff', minHeight: '100dvh' }}>
      <style>{STYLES}</style>

      {/* Cabecera */}
      <div style={{ background: 'linear-gradient(180deg, #06080f 0%, #030712 100%)', borderBottom: '1px solid #111827', padding: '48px 24px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          Nuestro <span style={{ color: '#facc15' }}>Catálogo</span>
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
          Las mejores llantas para tu vehículo
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por marca, modelo o medida..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <a className="btn-download" href={`${BACKEND}/api/reportes/lista-precios`} download>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Descargar lista de precios (.xlsx)
          </a>
        </div>

        {filtradas.length > 0 && (
          <p style={{ color: '#374151', fontSize: 12, marginTop: 16 }}>
            {filtradas.length} {filtradas.length === 1 ? 'llanta encontrada' : 'llantas encontradas'}
          </p>
        )}
      </div>

      {/* Grid */}
      <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {filtradas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#374151', padding: '80px 0' }}>No se encontraron llantas.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {filtradas.map((llanta, i) => (
              <div
                key={llanta.id}
                className={`card-tire${visible ? ' visible' : ''}`}
                style={{ animationDelay: `${Math.min(i * 40, 600)}ms` }}
              >
                {/* Imagen o placeholder */}
                {llanta.imagen_url ? (
                  <img
                    className="card-img"
                    src={`${BACKEND}${llanta.imagen_url}`}
                    alt={llanta.marca_nombre}
                  />
                ) : (
                  <div className="card-img-placeholder">
                    <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="#1f2937" strokeWidth={1}>
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                    </svg>
                  </div>
                )}

                {/* Overlay con texto */}
                <div className="card-overlay">
                  <div className="card-brand">{(llanta.marca_nombre || '').toUpperCase()}</div>
                  {llanta.modelo && <div className="card-model">{llanta.modelo}</div>}
                  <span className="card-size">{llanta.medida}</span>
                  {llanta.descripcion && (
                    <p className="card-desc">{llanta.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
