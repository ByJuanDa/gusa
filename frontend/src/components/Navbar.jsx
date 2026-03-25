import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES_ADMIN = ['Sistemas', 'Gerente General']

const ICONOS = {
  catalogo: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
    </svg>
  ),
  inicio: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  inventario: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  ),
  ventas: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  ),
  usuarios: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  reportes: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
}

export default function Navbar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const puesto = usuario?.puesto_nombre || ''
  const esAdmin = ROLES_ADMIN.includes(puesto)

  function handleLogout() {
    logout()
    navigate('/')
    setMenuAbierto(false)
  }

  const isActive = (path) => pathname === path || (path === '/dashboard' && pathname === '/dashboard')

  const linkStyle = (path) => ({
    color: isActive(path) ? '#facc15' : '#6b7280',
    fontSize: '13px',
    fontWeight: isActive(path) ? 700 : 500,
    textDecoration: 'none',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 0',
  })

  const links = usuario
    ? [
        { to: '/dashboard', label: 'Inicio',     icon: ICONOS.inicio },
        { to: '/ventas',    label: 'Ventas',      icon: ICONOS.ventas },
        { to: '/inventario',label: 'Inventario',  icon: ICONOS.inventario },
        { to: '/reportes',  label: 'Reportes',    icon: ICONOS.reportes },
        ...(esAdmin ? [{ to: '/usuarios', label: 'Usuarios', icon: ICONOS.usuarios }] : []),
      ]
    : [
        { to: '/catalogo', label: 'Catálogo', icon: ICONOS.catalogo },
      ]

  return (
    <header style={{ backgroundColor: '#030712', borderBottom: '1px solid #111827', padding: '0 20px', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link to={usuario ? '/dashboard' : '/'} onClick={() => setMenuAbierto(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
            <span style={{ color: '#facc15' }}>G</span>
            <span style={{ color: '#ffffff' }}>USA</span>
          </span>
          <span style={{ width: '1px', height: '16px', backgroundColor: '#1f2937' }} />
          <span style={{ color: '#374151', fontSize: '11px' }}>Distribuidora</span>
        </Link>

        {/* Desktop nav */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {links.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              style={{
                ...linkStyle(to),
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: isActive(to) ? 'rgba(250,204,21,0.06)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (!isActive(to)) { e.currentTarget.style.backgroundColor = '#0d1220'; e.currentTarget.style.color = '#ffffff' } }}
              onMouseLeave={(e) => { if (!isActive(to)) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b7280' } }}
            >
              <span style={{ color: isActive(to) ? '#facc15' : 'inherit' }}>{icon}</span>
              {label}
            </Link>
          ))}

          {!usuario && (
            <Link
              to="/login"
              style={{ marginLeft: '8px', backgroundColor: '#facc15', color: '#030712', fontWeight: 700, fontSize: '12px', padding: '7px 16px', borderRadius: '8px', textDecoration: 'none' }}
            >
              Empleados
            </Link>
          )}

          {usuario && (
            <>
              <span style={{ width: '1px', height: '20px', backgroundColor: '#1f2937', margin: '0 8px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
                  <p style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}>{usuario.nombre.split(' ')[0]}</p>
                  <p style={{ color: puesto === 'Encargado' ? '#60a5fa' : '#facc15', fontSize: '10px' }}>{puesto}</p>
                </div>
                <button
                  onClick={handleLogout}
                  style={{ background: 'none', border: '1px solid #1f2937', color: '#6b7280', fontSize: '12px', cursor: 'pointer', padding: '5px 10px', borderRadius: '7px', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1f2937'; e.currentTarget.style.color = '#6b7280' }}
                >
                  Salir
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuAbierto(!menuAbierto)}
          style={{ display: 'none', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px' }}
        >
          {menuAbierto ? (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuAbierto && (
        <div className="mobile-menu" style={{ backgroundColor: '#06080f', borderTop: '1px solid #111827', padding: '12px 20px 20px' }}>
          {usuario && (
            <div style={{ padding: '10px 0 14px', borderBottom: '1px solid #111827', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15', fontWeight: 800, fontSize: '14px' }}>
                {usuario.nombre.charAt(0)}
              </div>
              <div>
                <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700 }}>{usuario.nombre}</p>
                <p style={{ color: puesto === 'Encargado' ? '#60a5fa' : '#facc15', fontSize: '11px' }}>{puesto}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {links.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuAbierto(false)}
                style={{
                  color: isActive(to) ? '#facc15' : '#9ca3af',
                  fontSize: '14px',
                  fontWeight: isActive(to) ? 700 : 500,
                  textDecoration: 'none',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  backgroundColor: isActive(to) ? 'rgba(250,204,21,0.06)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ color: isActive(to) ? '#facc15' : '#6b7280' }}>{icon}</span>
                {label}
              </Link>
            ))}

            {!usuario && (
              <Link to="/login" onClick={() => setMenuAbierto(false)}
                style={{ marginTop: '8px', backgroundColor: '#facc15', color: '#030712', fontWeight: 700, fontSize: '13px', padding: '12px 16px', borderRadius: '10px', textDecoration: 'none', textAlign: 'center' }}
              >
                Empleados
              </Link>
            )}

            {usuario && (
              <button
                onClick={handleLogout}
                style={{ marginTop: '12px', background: 'none', border: '1px solid #1f2937', color: '#6b7280', fontSize: '13px', cursor: 'pointer', padding: '11px 16px', borderRadius: '10px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 641px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </header>
  )
}
