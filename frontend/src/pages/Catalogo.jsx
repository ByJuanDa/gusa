import { useEffect, useState } from 'react'
import api from '../services/api'

const BACKEND = 'http://172.16.20.57:8080'

export default function Catalogo() {
  const [llantas, setLlantas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    api.get('/llantas/catalogo')
      .then(({ data }) => setLlantas(data))
      .finally(() => setCargando(false))
  }, [])

  const filtradas = llantas.filter((l) =>
    `${l.marca_nombre || ''} ${l.modelo || ''} ${l.medida}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (cargando) {
    return (
      <div style={{ backgroundColor: '#030712', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '36px', height: '36px',
            border: '2px solid #facc15',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 12px',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ color: '#6b7280', fontSize: '13px' }}>Cargando catálogo...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#030712', color: '#ffffff', minHeight: '100dvh' }}>

      {/* Cabecera */}
      <div style={{ backgroundColor: '#06080f', borderBottom: '1px solid #111827', padding: '40px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
          Nuestro <span style={{ color: '#facc15' }}>Catálogo</span>
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          Las mejores llantas para tu vehículo
        </p>
        <input
          type="text"
          placeholder="Buscar por marca, modelo o medida..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            backgroundColor: '#0f1117',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '10px 20px',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none',
            width: '100%',
            maxWidth: '420px',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#facc15'}
          onBlur={(e) => e.target.style.borderColor = '#1f2937'}
        />

        {/* Botón lista de precios */}
        <a
          href={`${BACKEND}/api/reportes/lista-precios`}
          download
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'rgba(250,204,21,0.1)',
            border: '1px solid rgba(250,204,21,0.3)',
            color: '#facc15', fontWeight: 700, fontSize: '13px',
            padding: '10px 20px', borderRadius: '12px',
            textDecoration: 'none', transition: 'background-color 0.2s',
            marginTop: '4px',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(250,204,21,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(250,204,21,0.1)'}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Descargar lista de precios (.xlsx)
        </a>
      </div>

      {/* Grid */}
      <div style={{ padding: '40px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        {filtradas.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#374151', padding: '80px 0' }}>
            No se encontraron llantas.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {filtradas.map((llanta) => (
              <div
                key={llanta.id}
                style={{
                  backgroundColor: '#0a0e17',
                  border: '1px solid #1f2937',
                  borderRadius: '16px',
                  padding: '20px',
                  transition: 'border-color 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(250,204,21,0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1f2937'}
              >
                {llanta.imagen_url ? (
                  <img
                    src={llanta.imagen_url}
                    alt={llanta.modelo}
                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px', marginBottom: '16px' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '150px',
                    backgroundColor: '#111827',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#1f2937" strokeWidth={1}>
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                    </svg>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <span style={{ color: '#facc15', fontSize: '10px', fontWeight: 700, letterSpacing: '2px' }}>
                      {(llanta.marca_nombre || '').toUpperCase()}
                    </span>
                    <h3 style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px', marginTop: '2px' }}>
                      {llanta.modelo}
                    </h3>
                  </div>
                  <span style={{
                    backgroundColor: '#111827',
                    border: '1px solid #1f2937',
                    color: '#9ca3af',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                  }}>
                    {llanta.medida}
                  </span>
                </div>

                {llanta.descripcion && (
                  <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '10px', lineHeight: 1.6 }}>
                    {llanta.descripcion}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
