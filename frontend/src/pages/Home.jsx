import { Link } from 'react-router-dom'

const marcas = ['Bridgestone', 'Michelin', 'Continental', 'Pirelli', 'Hankook', 'Goodyear']

const beneficios = [
  {
    titulo: 'Amplio Catálogo',
    desc: 'Todas las medidas y marcas líderes del mercado en un solo lugar.',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#facc15" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
      </svg>
    ),
  },
  {
    titulo: 'Mejor Precio',
    desc: 'Precios competitivos directamente desde el distribuidor, sin intermediarios.',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#facc15" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    titulo: 'Asesoría Experta',
    desc: 'Nuestro equipo te guía para elegir la llanta perfecta para tu vehículo.',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#facc15" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
      </svg>
    ),
  },
]

export default function Home() {
  return (
    <div style={{ backgroundColor: '#030712', color: '#ffffff', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 24px 60px',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(250,204,21,0.08)',
            border: '1px solid rgba(250,204,21,0.2)',
            color: '#facc15',
            fontSize: '11px',
            fontWeight: 600,
            padding: '6px 16px',
            borderRadius: '999px',
            letterSpacing: '2px',
            marginBottom: '28px',
          }}
        >
          DISTRIBUIDORA DE LLANTAS
        </div>

        {/* Título */}
        <h1
          style={{
            fontSize: 'clamp(72px, 12vw, 120px)',
            fontWeight: 900,
            letterSpacing: '-4px',
            lineHeight: 1,
            marginBottom: '20px',
          }}
        >
          <span style={{ color: '#facc15' }}>G</span>USA
        </h1>

        {/* Subtítulo */}
        <p
          style={{
            color: '#9ca3af',
            fontSize: '17px',
            lineHeight: 1.7,
            maxWidth: '480px',
            marginBottom: '40px',
          }}
        >
          Calidad, variedad y el mejor precio en llantas para{' '}
          <span style={{ color: '#ffffff', fontWeight: 500 }}>todo tipo de vehículo</span>.
        </p>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            to="/catalogo"
            style={{
              backgroundColor: '#facc15',
              color: '#030712',
              fontWeight: 700,
              fontSize: '14px',
              padding: '13px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde047'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#facc15'}
          >
            Ver Catálogo
          </Link>
          <Link
            to="/login"
            style={{
              border: '1px solid #1f2937',
              color: '#9ca3af',
              fontWeight: 500,
              fontSize: '14px',
              padding: '13px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1f2937'; e.currentTarget.style.color = '#9ca3af' }}
          >
            Acceso empleados
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── MARCAS ─────────────────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid #111827',
          borderBottom: '1px solid #111827',
          padding: '28px 24px',
        }}
      >
        <p
          style={{
            textAlign: 'center',
            color: '#374151',
            fontSize: '10px',
            letterSpacing: '3px',
            fontWeight: 600,
            marginBottom: '18px',
          }}
        >
          MARCAS QUE MANEJAMOS
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px 32px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {marcas.map((m) => (
            <span
              key={m}
              style={{
                color: '#4b5563',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'default',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#9ca3af'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}
            >
              {m}
            </span>
          ))}
        </div>
      </section>

      {/* ── BENEFICIOS ─────────────────────────────────────── */}
      <section style={{ padding: '64px 24px' }}>
        <p
          style={{
            textAlign: 'center',
            color: '#ffffff',
            fontSize: '22px',
            fontWeight: 700,
            marginBottom: '36px',
          }}
        >
          ¿Por qué elegir{' '}
          <span style={{ color: '#facc15' }}>GUSA</span>?
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          {beneficios.map(({ titulo, desc, icon }) => (
            <div
              key={titulo}
              style={{
                backgroundColor: '#0a0e17',
                border: '1px solid #1f2937',
                borderRadius: '16px',
                padding: '24px',
                transition: 'border-color 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(250,204,21,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1f2937'}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(250,204,21,0.08)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                {icon}
              </div>
              <h3 style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
                {titulo}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid #111827',
          padding: '20px 24px',
          textAlign: 'center',
          color: '#374151',
          fontSize: '12px',
        }}
      >
        GUSA Distribuidora de Llantas © {new Date().getFullYear()}
      </footer>

    </div>
  )
}
