import { useEffect, useState } from 'react'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: '16px', overflowY: 'auto',
  },
  input: {
    width: '100%', backgroundColor: '#1a1f2e',
    border: '1px solid #1f2937', borderRadius: '8px',
    padding: '9px 12px', color: '#ffffff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  label: {
    display: 'block', color: '#9ca3af', fontSize: '10px',
    fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', marginBottom: '5px',
  },
}

// ── Pantalla de recibo ────────────────────────────────────────
function Recibo({ resultado, onCerrar }) {
  return (
    <div style={S.overlay}>
      <div style={{ backgroundColor: '#0f1117', border: '1px solid #1f2937', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '520px', margin: 'auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 style={{ color: '#ffffff', fontWeight: 800, fontSize: '18px', marginBottom: '4px' }}>¡Pedido registrado!</h3>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            <span style={{ color: '#4ade80', fontWeight: 700 }}>{resultado.total_piezas} piezas</span> agregadas al inventario
          </p>
          {resultado.notas && (
            <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '4px' }}>📋 {resultado.notas}</p>
          )}
        </div>

        {/* Lista de llantas actualizadas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto', marginBottom: '20px' }}>
          {resultado.items.map((item) => (
            <div key={item.id_llanta} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '10px', padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <div>
                <p style={{ color: '#e5e7eb', fontWeight: 600, fontSize: '13px' }}>
                  {item.marca} {item.modelo || ''} <span style={{ color: '#6b7280', fontWeight: 400 }}>· {item.medida}</span>
                </p>
                <p style={{ color: '#facc15', fontFamily: 'monospace', fontSize: '11px', marginTop: '2px' }}>{item.codigo}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>{item.stock_anterior}</span>
                  <span style={{ color: '#374151' }}>→</span>
                  <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '15px' }}>{item.stock_nuevo}</span>
                </div>
                <p style={{ color: '#374151', fontSize: '10px', marginTop: '2px' }}>+{item.cantidad} piezas</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onCerrar}
          style={{ width: '100%', backgroundColor: '#facc15', color: '#030712', fontWeight: 700, fontSize: '14px', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
        >
          Listo
        </button>
      </div>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────
export default function ModalPedido({ onClose, onRegistrado }) {
  const { addToast } = useToast()
  const [llantas,  setLlantas]  = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [items, setItems] = useState([])      // [{llanta, cantidad, costo}]
  const [notas,  setNotas]  = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error,    setError]    = useState('')
  const [recibo,   setRecibo]   = useState(null)

  useEffect(() => {
    api.get('/llantas/inventario')
      .then(({ data }) => setLlantas(data))
      .finally(() => setCargando(false))
  }, [])

  // Llantas filtradas que no están ya en el pedido
  const sugerencias = llantas.filter((l) => {
    if (!busqueda.trim()) return false
    if (items.find((i) => i.llanta.id === l.id)) return false
    const marca = l.marca?.nombre_display || l.marca?.nombre || ''
    return `${l.codigo} ${marca} ${l.modelo || ''} ${l.medida}`
      .toLowerCase().includes(busqueda.toLowerCase())
  }).slice(0, 6)

  function agregarLlanta(llanta) {
    setItems([...items, { llanta, cantidad: 1, costo: llanta.costo_compra || '' }])
    setBusqueda('')
  }

  function quitar(id) {
    setItems(items.filter((i) => i.llanta.id !== id))
  }

  function actualizar(id, campo, valor) {
    setItems(items.map((i) => i.llanta.id === id ? { ...i, [campo]: valor } : i))
  }

  const totalPiezas = items.reduce((s, i) => s + (parseInt(i.cantidad) || 0), 0)
  const totalCosto  = items.reduce((s, i) => s + ((parseInt(i.cantidad) || 0) * (parseFloat(i.costo) || 0)), 0)

  async function handleConfirmar() {
    for (const i of items) {
      if (!parseInt(i.cantidad) || parseInt(i.cantidad) < 1) {
        setError(`Cantidad inválida en "${i.llanta.codigo}"`)
        return
      }
    }
    setEnviando(true); setError('')
    try {
      const { data } = await api.post('/llantas/pedido', {
        notas: notas || null,
        items: items.map((i) => ({
          id_llanta: i.llanta.id,
          cantidad: parseInt(i.cantidad),
          costo_unitario: parseFloat(i.costo) || null,
        })),
      })
      onRegistrado(data)
      addToast(`Pedido registrado: ${data.total_piezas} piezas en ${data.items.length} modelos`, 'success')
      setRecibo(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar el pedido')
    } finally { setEnviando(false) }
  }

  if (recibo) {
    return <Recibo resultado={recibo} onCerrar={onClose} />
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div
        style={{ backgroundColor: '#0f1117', border: '1px solid #1f2937', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '680px', margin: 'auto', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Título */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', padding: '6px 8px', display: 'flex' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3 style={{ color: '#ffffff', fontWeight: 800, fontSize: '17px' }}>Recibir pedido</h3>
            </div>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>Agrega las llantas que llegaron y confirma para actualizar el inventario.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '20px', cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Buscador */}
          <div>
            <label style={S.label}>Buscar llanta para agregar al pedido</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Escribe el código, marca, modelo o medida..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ ...S.input, paddingLeft: '34px' }}
                onFocus={(e) => e.target.style.borderColor = '#4ade80'}
                onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                autoFocus
              />
            </div>

            {/* Sugerencias */}
            {busqueda && (
              <div style={{ marginTop: '6px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '10px', overflow: 'hidden' }}>
                {cargando ? (
                  <p style={{ color: '#6b7280', fontSize: '13px', padding: '12px 16px' }}>Cargando...</p>
                ) : sugerencias.length === 0 ? (
                  <p style={{ color: '#374151', fontSize: '13px', padding: '12px 16px' }}>Sin resultados para "{busqueda}"</p>
                ) : sugerencias.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => agregarLlanta(l)}
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
                      <p style={{ color: '#6b7280', fontSize: '11px' }}>{l.stock} en stock</p>
                      <p style={{ color: '#374151', fontSize: '10px' }}>Costo: ${l.costo_compra?.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista del pedido */}
          {items.length === 0 ? (
            <div style={{ border: '1px dashed #1f2937', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
              <p style={{ color: '#374151', fontSize: '28px', marginBottom: '8px' }}>📦</p>
              <p style={{ color: '#374151', fontSize: '14px' }}>Aún no has agregado llantas.</p>
              <p style={{ color: '#1f2937', fontSize: '12px', marginTop: '4px' }}>Usa el buscador de arriba para encontrarlas.</p>
            </div>
          ) : (
            <div>
              <label style={S.label}>Llantas en este pedido ({items.length})</label>

              {/* Encabezado de columnas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 32px', gap: '8px', padding: '0 4px 6px', alignItems: 'center' }}>
                <span style={{ color: '#374151', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Llanta</span>
                <span style={{ color: '#374151', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Piezas</span>
                <span style={{ color: '#374151', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Costo/u</span>
                <span />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map((item) => (
                  <div key={item.llanta.id} style={{ backgroundColor: '#1a1f2e', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 90px 110px 32px', gap: '8px', alignItems: 'center' }}>
                    {/* Info llanta */}
                    <div>
                      <p style={{ color: '#e5e7eb', fontWeight: 600, fontSize: '13px', lineHeight: 1.2 }}>
                        {item.llanta.marca?.nombre_display || item.llanta.marca?.nombre} {item.llanta.modelo || ''}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#facc15', fontFamily: 'monospace', fontSize: '10px' }}>{item.llanta.codigo}</span>
                        <span style={{ color: '#6b7280', fontSize: '10px' }}>{item.llanta.medida}</span>
                        <span style={{ color: '#374151', fontSize: '10px' }}>Stock actual: {item.llanta.stock}</span>
                      </div>
                    </div>

                    {/* Cantidad */}
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => actualizar(item.llanta.id, 'cantidad', e.target.value)}
                      style={{ ...S.input, padding: '7px 8px', fontSize: '14px', fontWeight: 700, textAlign: 'center', color: '#4ade80' }}
                      onFocus={(e) => e.target.style.borderColor = '#4ade80'}
                      onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                    />

                    {/* Costo */}
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '12px', pointerEvents: 'none' }}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.costo}
                        onChange={(e) => actualizar(item.llanta.id, 'costo', e.target.value)}
                        style={{ ...S.input, padding: '7px 8px 7px 18px', fontSize: '13px' }}
                        onFocus={(e) => e.target.style.borderColor = '#facc15'}
                        onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                      />
                    </div>

                    {/* Quitar */}
                    <button
                      onClick={() => quitar(item.llanta.id)}
                      style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: '4px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
                      title="Quitar del pedido"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas del pedido */}
          <div>
            <label style={S.label}>Notas del pedido (opcional)</label>
            <input
              type="text"
              placeholder='Ej: Pedido Bridgestone, factura #4521, proveedor "Llantas del Norte"'
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              style={S.input}
              onFocus={(e) => e.target.style.borderColor = '#facc15'}
              onBlur={(e) => e.target.style.borderColor = '#1f2937'}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #1f2937', paddingTop: '16px', marginTop: '16px' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', color: '#f87171', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Resumen */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '11px' }}>Total piezas</p>
                <p style={{ color: '#4ade80', fontWeight: 800, fontSize: '20px' }}>{totalPiezas}</p>
              </div>
              {totalCosto > 0 && (
                <div>
                  <p style={{ color: '#6b7280', fontSize: '11px' }}>Costo total</p>
                  <p style={{ color: '#facc15', fontWeight: 800, fontSize: '20px' }}>${totalCosto.toFixed(2)}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{ backgroundColor: '#1f2937', color: '#9ca3af', fontWeight: 600, fontSize: '13px', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={enviando || items.length === 0}
                style={{
                  backgroundColor: items.length === 0 ? '#1f2937' : '#4ade80',
                  color: items.length === 0 ? '#6b7280' : '#030712',
                  fontWeight: 700, fontSize: '13px',
                  padding: '10px 24px', borderRadius: '8px',
                  border: 'none', cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'background-color 0.2s',
                }}
              >
                {enviando ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid #030712', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Registrando...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Confirmar entrada
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
