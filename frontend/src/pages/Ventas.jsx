import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const ROLES_ADMIN = ['Sistemas', 'Gerente General']

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: '16px', overflowY: 'auto',
  },
  modal: (maxW = '480px') => ({
    backgroundColor: '#0f1117',
    border: '1px solid #1f2937',
    borderRadius: '20px',
    padding: '24px',
    width: '100%',
    maxWidth: maxW,
    margin: 'auto',
  }),
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

// ── Modal detalle de venta ────────────────────────────────────
function imprimirComprobante(venta) {
  const fmt = (n) => `$${Number(n).toFixed(2)}`
  const fecha = new Date(venta.fecha).toLocaleString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const filas = venta.detalles.map(d => `
    <tr>
      <td>${d.llanta_codigo || ''}</td>
      <td>${d.llanta_marca || ''} ${d.llanta_modelo || ''}<br/>
          <span class="dim">${d.llanta_medida || ''}</span></td>
      <td class="center">${d.cantidad}</td>
      <td class="right">${fmt(d.precio_unitario)}</td>
      <td class="right bold">${fmt(d.subtotal)}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/>
    <title>Comprobante Venta #${venta.id}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px;
             color: #111; background: #fff; padding: 32px; max-width: 600px; margin: 0 auto; }

      .header { display: flex; justify-content: space-between; align-items: flex-start;
                border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 20px; }
      .logo   { font-size: 26px; font-weight: 900; letter-spacing: -1px; }
      .logo span { color: #d4a800; }
      .sub    { font-size: 11px; color: #666; margin-top: 2px; }

      .badge  { background: #111; color: #fff; border-radius: 6px;
                padding: 6px 14px; font-size: 13px; font-weight: 700; text-align: right; }
      .badge .num { font-size: 22px; font-weight: 900; color: #f0c000; }

      .meta   { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px;
                margin-bottom: 20px; background: #f8f8f8; border-radius: 8px; padding: 14px 16px; }
      .meta label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
                    color: #888; margin-bottom: 2px; display: block; }
      .meta p     { font-size: 13px; font-weight: 600; }

      table   { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      thead tr { background: #111; color: #fff; }
      thead th { padding: 8px 10px; font-size: 11px; text-transform: uppercase;
                 letter-spacing: 0.5px; text-align: left; }
      thead th.right  { text-align: right; }
      thead th.center { text-align: center; }
      tbody tr:nth-child(even) { background: #f5f5f5; }
      tbody td { padding: 9px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
      .dim    { color: #888; font-size: 11px; }
      .center { text-align: center; }
      .right  { text-align: right; }
      .bold   { font-weight: 700; }

      .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
      .totals table { width: 220px; }
      .totals td    { padding: 5px 8px; font-size: 13px; }
      .totals .total-row td { border-top: 2px solid #111; font-size: 17px; font-weight: 800; }

      .status { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px;
                font-weight: 700; background: ${venta.status === 'activa' ? '#d4edda' : '#f8d7da'};
                color: ${venta.status === 'activa' ? '#155724' : '#721c24'}; }

      .footer { text-align: center; font-size: 11px; color: #aaa;
                border-top: 1px solid #ddd; padding-top: 14px; margin-top: 8px; }

      @media print {
        body { padding: 16px; }
        @page { size: A5; margin: 12mm; }
      }
    </style>
  </head><body>

    <div class="header">
      <div>
        <div class="logo"><span>G</span>USA <span style="font-size:14px;font-weight:400;color:#666">Distribuidora</span></div>
        <div class="sub">Comprobante de venta</div>
      </div>
      <div class="badge">
        <div class="num">#${venta.id}</div>
        <div style="font-size:11px;color:#aaa;margin-top:2px">${fecha}</div>
      </div>
    </div>

    <div class="meta">
      <div>
        <label>Vendedor</label>
        <p>${venta.usuario_nombre || '—'}</p>
      </div>
      <div>
        <label>Estado</label>
        <p><span class="status">${venta.status === 'activa' ? 'Activa' : 'Cancelada'}</span></p>
      </div>
      ${venta.notas ? `<div style="grid-column:1/-1"><label>Notas</label><p>${venta.notas}</p></div>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Producto</th>
          <th class="center">Cant.</th>
          <th class="right">Precio</th>
          <th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <div class="totals">
      <table>
        <tr><td>Artículos</td><td class="right bold">${venta.num_items}</td></tr>
        <tr class="total-row"><td>TOTAL</td><td class="right">${fmt(venta.total)}</td></tr>
      </table>
    </div>

    <div class="footer">GUSA Distribuidora · Comprobante generado el ${new Date().toLocaleString('es-MX')}</div>

    <script>window.onload = () => { window.print() }<\/script>
  </body></html>`

  const w = window.open('', '_blank', 'width=680,height=800')
  w.document.write(html)
  w.document.close()
}

function ModalDetalle({ ventaId, onClose, onCancelar, esAdmin }) {
  const [venta, setVenta] = useState(null)
  const [cancelando, setCancelando] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    api.get(`/ventas/${ventaId}`).then(({ data }) => setVenta(data))
  }, [ventaId])

  async function handleCancelar() {
    setCancelando(true)
    try {
      const { data } = await api.patch(`/ventas/${ventaId}/cancelar`)
      onCancelar(data)
      onClose()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al cancelar')
    } finally { setCancelando(false) }
  }

  function formatFecha(f) {
    return new Date(f).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal('560px')} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <p style={{ color: '#facc15', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
              VENTA #{ventaId}
            </p>
            {venta && (
              <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px',
                  color: venta.status === 'activa' ? '#4ade80' : '#9ca3af',
                  backgroundColor: venta.status === 'activa' ? 'rgba(74,222,128,0.08)' : 'rgba(100,100,100,0.1)',
                  border: `1px solid ${venta.status === 'activa' ? 'rgba(74,222,128,0.2)' : '#1f2937'}`,
                }}>
                  {venta.status === 'activa' ? 'Activa' : 'Cancelada'}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        {!venta ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: '28px', height: '28px', border: '2px solid #facc15', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Info general */}
            <div style={{ backgroundColor: '#1a1f2e', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '11px' }}>Vendedor</p>
                <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '13px' }}>{venta.usuario_nombre || '—'}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '11px' }}>Fecha</p>
                <p style={{ color: '#d1d5db', fontSize: '12px' }}>{formatFecha(venta.fecha)}</p>
              </div>
              {venta.notas && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ color: '#6b7280', fontSize: '11px' }}>Notas</p>
                  <p style={{ color: '#9ca3af', fontSize: '13px' }}>{venta.notas}</p>
                </div>
              )}
            </div>

            {/* Detalles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', maxHeight: '280px', overflowY: 'auto' }}>
              {venta.detalles.map((d) => (
                <div key={d.id} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ color: '#facc15', fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>{d.llanta_codigo}</p>
                    <p style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 600 }}>
                      {d.llanta_marca} {d.llanta_modelo || ''}
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '11px' }}>{d.llanta_medida}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#9ca3af', fontSize: '12px' }}>{d.cantidad} × ${d.precio_unitario.toFixed(2)}</p>
                    <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '14px' }}>${d.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ borderTop: '1px solid #1f2937', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>Total</span>
              <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '22px' }}>${venta.total.toFixed(2)}</span>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Comprobante — todos los roles */}
              <button
                onClick={() => imprimirComprobante(venta)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  backgroundColor: 'rgba(250,204,21,0.08)',
                  border: '1px solid rgba(250,204,21,0.25)',
                  color: '#facc15', fontWeight: 700, fontSize: '13px',
                  padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                </svg>
                Imprimir / PDF
              </button>

            {/* Cancelar (solo admin, solo si activa) */}
            {esAdmin && venta.status === 'activa' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {confirmCancel ? (
                  <>
                    <span style={{ color: '#9ca3af', fontSize: '13px', alignSelf: 'center' }}>¿Confirmar cancelación?</span>
                    <button onClick={() => setConfirmCancel(false)} style={S.btnSecundario}>No</button>
                    <button onClick={handleCancelar} disabled={cancelando}
                      style={{ ...S.btnPrimario, backgroundColor: '#ef4444' }}
                    >
                      {cancelando ? 'Cancelando...' : 'Sí, cancelar'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmCancel(true)}
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancelar venta
                  </button>
                )}
              </div>
            )}
            </div>{/* /acciones */}
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

// ── Ticket de éxito ────────────────────────────────────────────
function TicketExito({ venta, onCerrar }) {
  function formatMonto(n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
  }
  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal('480px'), textAlign: 'center' }}>
        {/* Check animado */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>

        <h3 style={{ color: '#ffffff', fontWeight: 800, fontSize: '18px', marginBottom: '4px' }}>¡Venta registrada!</h3>
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>Folio <span style={{ color: '#facc15', fontWeight: 700 }}>#{venta.id}</span></p>

        {/* Resumen */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
          {venta.detalles.map((d) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1f2937' }}>
              <div>
                <p style={{ color: '#e5e7eb', fontSize: '13px' }}>{d.llanta_marca} {d.llanta_modelo || ''} {d.llanta_medida}</p>
                <p style={{ color: '#6b7280', fontSize: '11px' }}>{d.cantidad} pza × {formatMonto(d.precio_unitario)}</p>
              </div>
              <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '14px' }}>{formatMonto(d.subtotal)}</p>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
            <span style={{ color: '#9ca3af', fontWeight: 600 }}>Total</span>
            <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '20px' }}>{formatMonto(venta.total)}</span>
          </div>
        </div>

        <button
          onClick={onCerrar}
          style={{ ...S.btnPrimario, width: '100%', padding: '12px', fontSize: '14px' }}
        >
          Listo
        </button>
      </div>
    </div>
  )
}

// ── Modal nueva venta ─────────────────────────────────────────
function ModalNuevaVenta({ onClose, onCreada }) {
  const [busqueda, setBusqueda] = useState('')
  const [llantas, setLlantas] = useState([])
  const [cargandoLlantas, setCargandoLlantas] = useState(true)
  const [carrito, setCarrito] = useState([])
  const [notas, setNotas] = useState('')
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')
  const [ventaExitosa, setVentaExitosa] = useState(null)

  useEffect(() => {
    api.get('/llantas/inventario')
      .then(({ data }) => setLlantas(data.filter((l) => l.stock > 0)))
      .finally(() => setCargandoLlantas(false))
  }, [])

  const filtradas = llantas.filter((l) => {
    const marca = l.marca?.nombre_display || l.marca?.nombre || ''
    return `${l.codigo} ${marca} ${l.modelo || ''} ${l.medida}`
      .toLowerCase().includes(busqueda.toLowerCase())
  }).filter((l) => !carrito.find((c) => c.llanta.id === l.id))

  function agregarAlCarrito(llanta) {
    setCarrito([...carrito, {
      llanta,
      cantidad: 1,
      precio: llanta.precio_venta,
    }])
    setBusqueda('')
  }

  function actualizarItem(id, campo, valor) {
    setCarrito(carrito.map((c) =>
      c.llanta.id === id ? { ...c, [campo]: valor } : c
    ))
  }

  function quitarDelCarrito(id) {
    setCarrito(carrito.filter((c) => c.llanta.id !== id))
  }

  const total = carrito.reduce((s, c) => s + (c.cantidad * c.precio), 0)

  async function handleCrear() {
    if (carrito.length === 0) { setError('Agrega al menos un producto'); return }
    for (const c of carrito) {
      if (c.cantidad < 1 || c.cantidad > c.llanta.stock) {
        setError(`Cantidad inválida para ${c.llanta.codigo} (máx ${c.llanta.stock})`); return
      }
    }
    setCreando(true); setError('')
    try {
      const { data } = await api.post('/ventas/', {
        notas: notas || null,
        detalles: carrito.map((c) => ({
          id_llanta: c.llanta.id,
          cantidad: parseInt(c.cantidad),
          precio_unitario: parseFloat(c.precio),
        })),
      })
      onCreada(data)
      setVentaExitosa(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la venta')
    } finally { setCreando(false) }
  }

  if (ventaExitosa) {
    return <TicketExito venta={ventaExitosa} onCerrar={onClose} />
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal('640px'), maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Nueva venta</h3>
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>Busca las llantas vendidas y confirma</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Buscador de llantas */}
          <div>
            <label style={S.label}>Buscar llanta para agregar</label>
            <input
              type="text"
              placeholder="Código, marca, modelo, medida..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={S.input}
              onFocus={(e) => e.target.style.borderColor = '#facc15'}
              onBlur={(e) => e.target.style.borderColor = '#1f2937'}
            />
            {/* Resultados del buscador */}
            {busqueda && (
              <div style={{ marginTop: '6px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '10px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                {cargandoLlantas ? (
                  <p style={{ color: '#6b7280', fontSize: '13px', padding: '12px 16px' }}>Cargando...</p>
                ) : filtradas.length === 0 ? (
                  <p style={{ color: '#374151', fontSize: '13px', padding: '12px 16px' }}>Sin resultados</p>
                ) : filtradas.slice(0, 6).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => agregarAlCarrito(l)}
                    style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #1a2030', padding: '10px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a2030'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <span style={{ color: '#facc15', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700 }}>{l.codigo}</span>
                      <span style={{ color: '#e5e7eb', fontSize: '13px', marginLeft: '10px' }}>
                        {l.marca?.nombre_display || l.marca?.nombre} {l.modelo || ''} · {l.medida}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: 700 }}>${l.precio_venta.toFixed(2)}</p>
                      <p style={{ color: '#374151', fontSize: '10px' }}>{l.stock} en stock</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Carrito */}
          {carrito.length > 0 && (
            <div>
              <label style={S.label}>Productos ({carrito.length})</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {carrito.map((c) => (
                  <div key={c.llanta.id} style={{ backgroundColor: '#1a1f2e', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ color: '#facc15', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>{c.llanta.codigo}</span>
                        <p style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 600 }}>
                          {c.llanta.marca?.nombre_display || c.llanta.marca?.nombre} {c.llanta.modelo || ''} · {c.llanta.medida}
                        </p>
                        <p style={{ color: '#374151', fontSize: '11px' }}>Stock disponible: {c.llanta.stock}</p>
                      </div>
                      <button onClick={() => quitarDelCarrito(c.llanta.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
                      >×</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ ...S.label, fontSize: '10px' }}>Cantidad</label>
                        <input type="number" min="1" max={c.llanta.stock} value={c.cantidad}
                          onChange={(e) => actualizarItem(c.llanta.id, 'cantidad', parseInt(e.target.value) || 1)}
                          style={{ ...S.input, padding: '7px 10px', fontSize: '13px' }}
                          onFocus={(e) => e.target.style.borderColor = '#facc15'}
                          onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                        />
                      </div>
                      <div>
                        <label style={{ ...S.label, fontSize: '10px' }}>Precio/u ($)</label>
                        <input type="number" step="0.01" min="0" value={c.precio}
                          onChange={(e) => actualizarItem(c.llanta.id, 'precio', parseFloat(e.target.value) || 0)}
                          style={{ ...S.input, padding: '7px 10px', fontSize: '13px' }}
                          onFocus={(e) => e.target.style.borderColor = '#facc15'}
                          onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                        />
                      </div>
                      <div style={{ textAlign: 'right', paddingBottom: '2px' }}>
                        <p style={{ color: '#6b7280', fontSize: '10px', marginBottom: '4px' }}>Subtotal</p>
                        <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '15px' }}>
                          ${(c.cantidad * c.precio).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label style={S.label}>Notas (opcional)</label>
            <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Cliente Juan Pérez"
              style={S.input}
              onFocus={(e) => e.target.style.borderColor = '#facc15'}
              onBlur={(e) => e.target.style.borderColor = '#1f2937'}
            />
          </div>
        </div>

        {/* Footer con total y botón */}
        <div style={{ borderTop: '1px solid #1f2937', paddingTop: '16px', marginTop: '16px' }}>
          {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '12px' }}>Total</p>
              <p style={{ color: '#ffffff', fontWeight: 800, fontSize: '24px' }}>${total.toFixed(2)}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={S.btnSecundario}>Cancelar</button>
              <button onClick={handleCrear} disabled={creando || carrito.length === 0}
                style={{ ...S.btnPrimario, opacity: carrito.length === 0 ? 0.4 : 1 }}
              >
                {creando ? 'Registrando...' : 'Confirmar venta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function Ventas() {
  const { usuario } = useAuth()
  const { addToast } = useToast()
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalNueva, setModalNueva] = useState(false)
  const [ventaDetalle, setVentaDetalle] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const puesto  = usuario?.puesto_nombre || ''
  const esAdmin = ROLES_ADMIN.includes(puesto)

  const cargarVentas = useCallback(() => {
    api.get('/ventas/').then(({ data }) => setVentas(data)).finally(() => setCargando(false))
  }, [])

  useEffect(() => { cargarVentas() }, [cargarVentas])

  const filtradas = ventas.filter((v) => {
    const q = busqueda.toLowerCase()
    return (
      `#${v.id}`.includes(q) ||
      (v.usuario_nombre || '').toLowerCase().includes(q) ||
      (v.notas || '').toLowerCase().includes(q)
    )
  })

  const totalHoy = ventas
    .filter((v) => v.status === 'activa' && new Date(v.fecha).toDateString() === new Date().toDateString())
    .reduce((s, v) => s + v.total, 0)

  const ventasActivas = ventas.filter((v) => v.status === 'activa').length

  function formatFecha(f) {
    return new Date(f).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function handleCancelar(ventaActualizada) {
    setVentas((prev) => prev.map((v) => v.id === ventaActualizada.id ? { ...v, status: 'cancelada' } : v))
    addToast(`Venta #${ventaActualizada.id} cancelada. El stock fue repuesto.`, 'info')
  }

  if (cargando) {
    return (
      <div style={{ backgroundColor: '#030712', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #facc15', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ color: '#6b7280', fontSize: '13px' }}>Cargando ventas...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#030712', color: '#ffffff', minHeight: '100dvh' }}>

      {/* Cabecera */}
      <div style={{ backgroundColor: '#06080f', borderBottom: '1px solid #111827', padding: '20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
              Registro de <span style={{ color: '#facc15' }}>Ventas</span>
            </h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              <span style={{ color: '#d1d5db', fontWeight: 600 }}>{usuario?.nombre}</span>
              {' · '}
              <span style={{ color: puesto === 'Encargado' ? '#60a5fa' : '#facc15' }}>{puesto}</span>
            </p>
          </div>

          {/* Stats rápidos */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#0f1117', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
              <p style={{ color: '#ffffff', fontWeight: 800, fontSize: '18px' }}>{ventasActivas}</p>
              <p style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>Activas</p>
            </div>
            <div style={{ backgroundColor: '#0f1117', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
              <p style={{ color: '#4ade80', fontWeight: 800, fontSize: '18px' }}>${totalHoy.toFixed(0)}</p>
              <p style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>Hoy</p>
            </div>
            <button
              onClick={() => setModalNueva(true)}
              style={{ ...S.btnPrimario, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nueva venta
            </button>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ padding: '16px 20px 0', maxWidth: '1100px', margin: '0 auto' }}>
        <input
          type="text"
          placeholder="Buscar por #, vendedor, notas..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...S.input, maxWidth: '360px', backgroundColor: '#0a0e17' }}
          onFocus={(e) => e.target.style.borderColor = '#facc15'}
          onBlur={(e) => e.target.style.borderColor = '#1f2937'}
        />
      </div>

      {/* Lista de ventas */}
      <div style={{ padding: '16px 20px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        {filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#374151', fontSize: '15px' }}>
              {busqueda ? 'Sin resultados' : 'Aún no hay ventas registradas'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtradas.map((v) => (
              <button
                key={v.id}
                onClick={() => setVentaDetalle(v.id)}
                style={{
                  backgroundColor: '#06080f',
                  border: `1px solid ${v.status === 'cancelada' ? '#1f0a0a' : '#111827'}`,
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  opacity: v.status === 'cancelada' ? 0.6 : 1,
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
                onMouseEnter={(e) => { if (v.status !== 'cancelada') e.currentTarget.style.borderColor = '#374151' }}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = v.status === 'cancelada' ? '#1f0a0a' : '#111827'}
              >
                {/* ID + vendedor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '180px' }}>
                  <div style={{ backgroundColor: '#111827', borderRadius: '8px', padding: '8px 12px', minWidth: '56px', textAlign: 'center' }}>
                    <p style={{ color: '#facc15', fontWeight: 800, fontSize: '14px' }}>#{v.id}</p>
                    <p style={{ color: '#374151', fontSize: '10px' }}>{v.num_items} pza</p>
                  </div>
                  <div>
                    <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '13px' }}>{v.usuario_nombre || '—'}</p>
                    <p style={{ color: '#4b5563', fontSize: '12px' }}>{formatFecha(v.fecha)}</p>
                    {v.notas && <p style={{ color: '#374151', fontSize: '11px', marginTop: '2px' }}>{v.notas}</p>}
                  </div>
                </div>

                {/* Total + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <p style={{ color: v.status === 'activa' ? '#4ade80' : '#374151', fontWeight: 800, fontSize: '18px' }}>
                    ${v.total.toFixed(2)}
                  </p>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                    color: v.status === 'activa' ? '#4ade80' : '#6b7280',
                    backgroundColor: v.status === 'activa' ? 'rgba(74,222,128,0.08)' : 'rgba(100,100,100,0.08)',
                    border: `1px solid ${v.status === 'activa' ? 'rgba(74,222,128,0.2)' : '#1f2937'}`,
                  }}>
                    {v.status === 'activa' ? 'Activa' : 'Cancelada'}
                  </span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {modalNueva && (
        <ModalNuevaVenta
          onClose={() => setModalNueva(false)}
          onCreada={(nueva) => {
            setVentas((prev) => [nueva, ...prev])
            addToast(`¡Venta #${nueva.id} registrada por $${nueva.total.toFixed(2)}!`, 'success')
          }}
        />
      )}

      {ventaDetalle && (
        <ModalDetalle
          ventaId={ventaDetalle}
          onClose={() => setVentaDetalle(null)}
          onCancelar={handleCancelar}
          esAdmin={esAdmin}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
