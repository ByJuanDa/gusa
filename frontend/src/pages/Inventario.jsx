import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ModalPedido from '../components/ModalPedido'
import api from '../services/api'

const ROLES_ADMIN  = ['Sistemas', 'Gerente General']
const ROLES_PRECIO = ['Sistemas', 'Gerente General', 'Encargado']

// ── Shared styles ──────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: '16px', overflowY: 'auto',
  },
  modal: (maxW = '440px') => ({
    backgroundColor: '#0f1117',
    border: '1px solid #1f2937',
    borderRadius: '20px',
    padding: '28px',
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
  btnCerrar: {
    background: 'none', border: 'none',
    color: '#6b7280', fontSize: '16px',
    cursor: 'pointer', padding: '4px 8px',
    borderRadius: '6px', flexShrink: 0,
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

function ModalHeader({ codigo, titulo, onClose }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
      <div>
        {codigo && <p style={{ color: '#facc15', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', marginBottom: '2px' }}>{codigo}</p>}
        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>{titulo}</h3>
      </div>
      <button onClick={onClose} style={S.btnCerrar}>✕</button>
    </div>
  )
}

// ── Modal Precio ──────────────────────────────────────────────
function ModalPrecio({ llanta, onClose, onGuardado }) {
  const { addToast } = useToast()
  const [form, setForm] = useState({ costo_compra: llanta.costo_compra, precio_venta: llanta.precio_venta })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      const { data } = await api.patch(`/llantas/${llanta.id}/precio`, {
        costo_compra: parseFloat(form.costo_compra),
        precio_venta: parseFloat(form.precio_venta),
      })
      onGuardado(data)
      addToast('Precio actualizado correctamente', 'success')
      onClose()
    } catch { setError('No se pudo guardar. Verifica los valores.') }
    finally { setGuardando(false) }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal()} onClick={(e) => e.stopPropagation()}>
        <ModalHeader
          codigo={llanta.codigo}
          titulo={`${llanta.marca?.nombre_display || llanta.marca?.nombre || ''} ${llanta.modelo || ''} · ${llanta.medida}`}
          onClose={onClose}
        />
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[['Costo de compra (lo que pagamos)', 'costo_compra'], ['Precio de venta (al cliente)', 'precio_venta']].map(([label, key]) => (
              <div key={key}>
                <label style={S.label}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '13px' }}>$</span>
                  <input type="number" step="0.01" min="0" required value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ ...S.input, paddingLeft: '24px' }}
                    onFocus={(e) => e.target.style.borderColor = '#facc15'}
                    onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                  />
                </div>
              </div>
            ))}
          </div>
          {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={S.btnSecundario}>Cancelar</button>
            <button type="submit" disabled={guardando} style={S.btnPrimario}>{guardando ? 'Guardando...' : 'Guardar precio'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal Editar ──────────────────────────────────────────────
function ModalEditar({ llanta, marcas, onClose, onGuardado }) {
  const { addToast } = useToast()
  const [form, setForm] = useState({
    medida: llanta.medida,
    id_marca: llanta.marca?.id_marca || '',
    modelo: llanta.modelo || '',
    descripcion: llanta.descripcion || '',
    costo_compra: llanta.costo_compra,
    precio_venta: llanta.precio_venta,
    stock: llanta.stock,
    visible_catalogo: llanta.visible_catalogo,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(llanta.imagen_url || null)
  const [subiendoImg, setSubiendoImg] = useState(false)
  const fileRef = useRef()

  function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      const { data } = await api.patch(`/llantas/${llanta.id}`, {
        ...form,
        id_marca: parseInt(form.id_marca),
        costo_compra: parseFloat(form.costo_compra),
        precio_venta: parseFloat(form.precio_venta),
        stock: parseInt(form.stock),
      })
      let updated = data
      if (imgFile) {
        setSubiendoImg(true)
        const fd = new FormData()
        fd.append('file', imgFile)
        const { data: withImg } = await api.post(`/llantas/${llanta.id}/imagen`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        updated = withImg
      }
      onGuardado(updated)
      addToast('Llanta actualizada correctamente', 'success')
      onClose()
    } catch { setError('No se pudo guardar. Revisa los datos.') }
    finally { setGuardando(false); setSubiendoImg(false) }
  }

  const backendBase = 'http://172.16.20.57:8080'

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal('540px')} onClick={(e) => e.stopPropagation()}>
        <ModalHeader codigo={llanta.codigo} titulo="Editar llanta" onClose={onClose} />
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Marca</label>
              <select value={form.id_marca} onChange={(e) => setForm({ ...form, id_marca: e.target.value })} style={S.input}>
                {marcas.map((m) => <option key={m.id_marca} value={m.id_marca}>{m.nombre_display || m.nombre}</option>)}
              </select>
            </div>

            {[['Medida (ej: 205/65R15)', 'medida', 'text'], ['Modelo', 'modelo', 'text'], ['Costo compra $', 'costo_compra', 'number'], ['Precio venta $', 'precio_venta', 'number'], ['Piezas en stock', 'stock', 'number']].map(([label, key, type]) => (
              <div key={key}>
                <label style={S.label}>{label}</label>
                <input type={type} step={type === 'number' ? '0.01' : undefined} min={type === 'number' ? 0 : undefined}
                  required={['medida', 'costo_compra', 'precio_venta', 'stock'].includes(key)}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={S.input}
                  onFocus={(e) => e.target.style.borderColor = '#facc15'}
                  onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                />
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px' }}>
              <input type="checkbox" id="catalogo" checked={form.visible_catalogo}
                onChange={(e) => setForm({ ...form, visible_catalogo: e.target.checked })}
                style={{ accentColor: '#facc15', width: '16px', height: '16px' }}
              />
              <label htmlFor="catalogo" style={{ color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>
                Mostrar en catálogo público
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={2} placeholder="Descripción opcional de la llanta..."
                style={{ ...S.input, resize: 'vertical', minHeight: '58px' }}
                onFocus={(e) => e.target.style.borderColor = '#facc15'}
                onBlur={(e) => e.target.style.borderColor = '#1f2937'}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Foto de la llanta</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {imgPreview ? (
                  <img
                    src={imgPreview.startsWith('blob:') ? imgPreview : `${backendBase}${imgPreview}`}
                    alt=""
                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #1f2937' }}
                  />
                ) : (
                  <div style={{ width: '72px', height: '72px', borderRadius: '10px', border: '1px dashed #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: '24px' }}>
                    🖼
                  </div>
                )}
                <div>
                  <button type="button" onClick={() => fileRef.current.click()} style={{ ...S.btnSecundario, fontSize: '12px', padding: '7px 14px' }}>
                    {imgPreview ? '📷 Cambiar foto' : '📷 Agregar foto'}
                  </button>
                  <p style={{ color: '#374151', fontSize: '11px', marginTop: '4px' }}>JPG, PNG o WEBP</p>
                </div>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImgChange} style={{ display: 'none' }} />
              </div>
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={S.btnSecundario}>Cancelar</button>
            <button type="submit" disabled={guardando || subiendoImg} style={S.btnPrimario}>
              {subiendoImg ? 'Subiendo foto...' : guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal Nueva Llanta ────────────────────────────────────────
function ModalNuevaLlanta({ marcas, onClose, onCreada }) {
  const { addToast } = useToast()
  const [form, setForm] = useState({
    codigo: '',
    medida: '',
    id_marca: marcas[0]?.id_marca || '',
    modelo: '',
    descripcion: '',
    costo_compra: '',
    precio_venta: '',
    stock: 0,
    visible_catalogo: true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const [subiendoImg, setSubiendoImg] = useState(false)
  const fileRef = useRef()

  function handleImgChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      const { data } = await api.post('/llantas/', {
        ...form,
        id_marca: parseInt(form.id_marca),
        costo_compra: parseFloat(form.costo_compra) || 0,
        precio_venta: parseFloat(form.precio_venta) || 0,
        stock: parseInt(form.stock) || 0,
        entradas: 0,
        salidas: 0,
      })
      let nueva = data
      if (imgFile) {
        setSubiendoImg(true)
        const fd = new FormData()
        fd.append('file', imgFile)
        const { data: conImg } = await api.post(`/llantas/${data.id}/imagen`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        nueva = conImg
      }
      onCreada(nueva)
      addToast(`Llanta ${nueva.codigo} agregada al inventario`, 'success')
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo crear la llanta. Verifica los datos.')
    } finally { setGuardando(false); setSubiendoImg(false) }
  }

  const backendBase = 'http://172.16.20.57:8080'

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal('540px')} onClick={(e) => e.stopPropagation()}>
        <ModalHeader titulo="Agregar nueva llanta" onClose={onClose} />
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>

            <div>
              <label style={S.label}>Código <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" required value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej: BRG-205-65-R15"
                style={S.input}
                onFocus={(e) => e.target.style.borderColor = '#facc15'}
                onBlur={(e) => e.target.style.borderColor = '#1f2937'}
              />
            </div>

            <div>
              <label style={S.label}>Medida <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" required value={form.medida}
                onChange={(e) => setForm({ ...form, medida: e.target.value })}
                placeholder="Ej: 205/65R15"
                style={S.input}
                onFocus={(e) => e.target.style.borderColor = '#facc15'}
                onBlur={(e) => e.target.style.borderColor = '#1f2937'}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Marca <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.id_marca} onChange={(e) => setForm({ ...form, id_marca: e.target.value })} style={S.input}>
                {marcas.map((m) => <option key={m.id_marca} value={m.id_marca}>{m.nombre_display || m.nombre}</option>)}
              </select>
            </div>

            {[['Modelo', 'modelo', 'text', false], ['Costo de compra $', 'costo_compra', 'number', false], ['Precio de venta $', 'precio_venta', 'number', false], ['Piezas iniciales en stock', 'stock', 'number', false]].map(([label, key, type, req]) => (
              <div key={key}>
                <label style={S.label}>{label}</label>
                <input type={type} step={type === 'number' ? '0.01' : undefined} min={type === 'number' ? 0 : undefined}
                  required={req}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={S.input}
                  onFocus={(e) => e.target.style.borderColor = '#facc15'}
                  onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                />
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px' }}>
              <input type="checkbox" id="catalogo-nuevo" checked={form.visible_catalogo}
                onChange={(e) => setForm({ ...form, visible_catalogo: e.target.checked })}
                style={{ accentColor: '#facc15', width: '16px', height: '16px' }}
              />
              <label htmlFor="catalogo-nuevo" style={{ color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>
                Mostrar en catálogo público
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={2} placeholder="Descripción opcional de la llanta..."
                style={{ ...S.input, resize: 'vertical', minHeight: '58px' }}
                onFocus={(e) => e.target.style.borderColor = '#facc15'}
                onBlur={(e) => e.target.style.borderColor = '#1f2937'}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Foto de la llanta</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {imgPreview ? (
                  <img src={imgPreview} alt=""
                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #1f2937' }}
                  />
                ) : (
                  <div style={{ width: '72px', height: '72px', borderRadius: '10px', border: '1px dashed #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: '24px' }}>
                    🖼
                  </div>
                )}
                <div>
                  <button type="button" onClick={() => fileRef.current.click()} style={{ ...S.btnSecundario, fontSize: '12px', padding: '7px 14px' }}>
                    {imgPreview ? '📷 Cambiar foto' : '📷 Agregar foto'}
                  </button>
                  <p style={{ color: '#374151', fontSize: '11px', marginTop: '4px' }}>JPG, PNG o WEBP</p>
                </div>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImgChange} style={{ display: 'none' }} />
              </div>
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={S.btnSecundario}>Cancelar</button>
            <button type="submit" disabled={guardando || subiendoImg} style={S.btnPrimario}>
              {subiendoImg ? 'Subiendo foto...' : guardando ? 'Guardando...' : 'Agregar llanta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal Confirmar Eliminar ──────────────────────────────────
function ModalConfirmar({ llanta, onClose, onConfirmar }) {
  const { addToast } = useToast()
  const [eliminando, setEliminando] = useState(false)
  async function handleEliminar() {
    setEliminando(true)
    await onConfirmar()
    addToast('Llanta eliminada del inventario', 'info')
    setEliminando(false)
  }
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal('380px'), textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>¿Eliminar esta llanta?</h3>
        <p style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
          {llanta.marca?.nombre_display || llanta.marca?.nombre} {llanta.modelo || ''} · {llanta.medida}
        </p>
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>
          Stock actual: <strong style={{ color: '#f87171' }}>{llanta.stock} piezas</strong>
        </p>
        <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '24px' }}>
          Esta acción eliminará el registro permanentemente. No se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onClose} style={S.btnSecundario}>No, cancelar</button>
          <button onClick={handleEliminar} disabled={eliminando}
            style={{ ...S.btnPrimario, backgroundColor: '#ef4444' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Movimiento ──────────────────────────────────────────
function ModalMovimiento({ llanta, onClose, onGuardado }) {
  const { addToast } = useToast()
  const [form, setForm] = useState({ tipo: 'entrada', cantidad: '', costo_unitario: '', notas: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      await api.post('/llantas/movimiento', {
        id_llanta: llanta.id,
        tipo: form.tipo,
        cantidad: parseInt(form.cantidad),
        costo_unitario: form.costo_unitario ? parseFloat(form.costo_unitario) : null,
        notas: form.notas || null,
      })
      const { data } = await api.get(`/llantas/inventario/${llanta.id}`)
      onGuardado(data)
      addToast(`Movimiento registrado — stock actualizado a ${data.stock} piezas`, 'success')
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar movimiento.')
    } finally { setGuardando(false) }
  }

  const tipoInfo = {
    ajuste:  { color: '#60a5fa', label: '⟳ Corrección de conteo',  hint: 'Hiciste conteo físico y el sistema no coincide. Escribe el número real de piezas que tienes.', cantLabel: 'Piezas reales en almacén' },
    entrada: { color: '#4ade80', label: '↑ Entrada extraordinaria', hint: 'Un cliente devolvió una llanta u ocurrió algo fuera de lo normal. Para pedidos de proveedor usa el botón "Recibir pedido".', cantLabel: 'Piezas a agregar' },
    salida:  { color: '#f87171', label: '↓ Baja / merma',           hint: 'Una llanta se dañó, se perdió o hay que darla de baja. Para ventas normales usa la sección "Ventas".', cantLabel: 'Piezas a retirar' },
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal('480px')} onClick={(e) => e.stopPropagation()}>
        <ModalHeader
          codigo={llanta.codigo}
          titulo={`${llanta.marca?.nombre_display || llanta.marca?.nombre || ''} ${llanta.modelo || ''}`}
          onClose={onClose}
        />

        {/* Guía rápida */}
        <div style={{ backgroundColor: '#0a0e17', border: '1px solid #1f2937', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>
          <p style={{ color: '#9ca3af', fontWeight: 600, marginBottom: '6px' }}>¿Cuándo usar esto?</p>
          <p>• <strong style={{ color: '#4ade80' }}>Llegó un pedido del proveedor</strong> → usa el botón <em>Recibir pedido</em></p>
          <p>• <strong style={{ color: '#f87171' }}>El cliente compró llantas</strong> → usa la sección <em>Ventas</em></p>
          <p>• <strong style={{ color: '#60a5fa' }}>El conteo no cuadra / hubo pérdida</strong> → usa esta pantalla</p>
        </div>

        <div style={{ backgroundColor: '#111827', borderRadius: '10px', padding: '12px 16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#6b7280', fontSize: '13px' }}>Stock registrado actualmente</span>
          <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '20px' }}>{llanta.stock} <span style={{ color: '#374151', fontSize: '12px', fontWeight: 400 }}>piezas</span></span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={S.label}>¿Qué necesitas hacer?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(['ajuste', 'entrada', 'salida']).map((t) => {
                const info = tipoInfo[t]
                return (
                  <button key={t} type="button" onClick={() => setForm({ ...form, tipo: t })}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '8px',
                      border: `1px solid ${form.tipo === t ? info.color : '#1f2937'}`,
                      backgroundColor: form.tipo === t ? `${info.color}15` : '#1a1f2e',
                      color: form.tipo === t ? info.color : '#6b7280',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    {info.label}
                  </button>
                )
              })}
            </div>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px', backgroundColor: `${tipoInfo[form.tipo].color}08`, border: `1px solid ${tipoInfo[form.tipo].color}20`, borderRadius: '8px', padding: '8px 12px' }}>
              {tipoInfo[form.tipo].hint}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={S.label}>{tipoInfo[form.tipo].cantLabel}</label>
              <input type="number" min="1" required value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                style={S.input} placeholder="0"
                onFocus={(e) => e.target.style.borderColor = '#facc15'}
                onBlur={(e) => e.target.style.borderColor = '#1f2937'}
              />
            </div>
            <div>
              <label style={S.label}>Costo por pieza (opcional)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '13px' }}>$</span>
                <input type="number" step="0.01" min="0" value={form.costo_unitario}
                  onChange={(e) => setForm({ ...form, costo_unitario: e.target.value })}
                  style={{ ...S.input, paddingLeft: '24px' }} placeholder="0.00"
                  onFocus={(e) => e.target.style.borderColor = '#facc15'}
                  onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={S.label}>Motivo / notas</label>
            <input type="text" value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Ej: Conteo físico marzo, llanta rayada, devolución cliente..."
              style={S.input}
              onFocus={(e) => e.target.style.borderColor = '#facc15'}
              onBlur={(e) => e.target.style.borderColor = '#1f2937'}
            />
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={S.btnSecundario}>Cancelar</button>
            <button type="submit" disabled={guardando}
              style={{ ...S.btnPrimario, backgroundColor: tipoInfo[form.tipo].color, color: form.tipo === 'ajuste' ? '#030712' : '#030712' }}
            >
              {guardando ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal Historial ───────────────────────────────────────────
function ModalHistorial({ llanta, onClose }) {
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get(`/llantas/${llanta.id}/movimientos`)
      .then(({ data }) => setMovimientos(data))
      .finally(() => setCargando(false))
  }, [llanta.id])

  const tipoInfo = {
    entrada: { color: '#4ade80', label: '↑ Entrada' },
    salida:  { color: '#f87171', label: '↓ Salida' },
    ajuste:  { color: '#60a5fa', label: '⟳ Ajuste' },
  }

  function formatFecha(fecha) {
    return new Date(fecha).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal('560px')} onClick={(e) => e.stopPropagation()}>
        <ModalHeader
          codigo={llanta.codigo}
          titulo={`Historial · ${llanta.marca?.nombre_display || llanta.marca?.nombre || ''} ${llanta.medida}`}
          onClose={onClose}
        />

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: '28px', height: '28px', border: '2px solid #facc15', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: '13px' }}>Cargando historial...</p>
          </div>
        ) : movimientos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#374151', fontSize: '14px' }}>Sin movimientos registrados.</p>
            <p style={{ color: '#1f2937', fontSize: '12px', marginTop: '6px' }}>Los movimientos aparecen aquí cuando registras entradas, salidas o ventas.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {movimientos.map((m) => {
              const info = tipoInfo[m.tipo] || tipoInfo.ajuste
              return (
                <div key={m.id} style={{ backgroundColor: '#1a1f2e', border: '1px solid #1f2937', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: info.color, fontWeight: 700, fontSize: '12px', backgroundColor: `${info.color}15`, padding: '3px 10px', borderRadius: '6px' }}>
                        {info.label}
                      </span>
                      <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>
                        {m.tipo === 'ajuste' ? `→ ${m.cantidad} pzas` : `${m.cantidad} pzas`}
                      </span>
                      {m.costo_unitario && (
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>a ${m.costo_unitario.toFixed(2)}/u</span>
                      )}
                    </div>
                    <span style={{ color: '#374151', fontSize: '11px' }}>{formatFecha(m.fecha)}</span>
                  </div>
                  {(m.notas || m.usuario_nombre) && (
                    <div style={{ marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {m.usuario_nombre && <span style={{ color: '#4b5563', fontSize: '11px' }}>👤 {m.usuario_nombre}</span>}
                      {m.notas && <span style={{ color: '#6b7280', fontSize: '12px' }}>{m.notas}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={S.btnSecundario}>Cerrar</button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function Inventario() {
  const { usuario } = useAuth()
  const [llantas,  setLlantas]  = useState([])
  const [marcas,   setMarcas]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const [modalPrecio,     setModalPrecio]     = useState(null)
  const [modalEditar,     setModalEditar]     = useState(null)
  const [modalEliminar,   setModalEliminar]   = useState(null)
  const [modalMovimiento, setModalMovimiento] = useState(null)
  const [modalHistorial,  setModalHistorial]  = useState(null)
  const [modalPedido,     setModalPedido]     = useState(false)
  const [modalNueva,      setModalNueva]      = useState(false)

  const puesto      = usuario?.puesto_nombre || ''
  const esAdmin     = ROLES_ADMIN.includes(puesto)
  const puedePrecio = ROLES_PRECIO.includes(puesto)

  useEffect(() => {
    Promise.all([
      api.get('/llantas/inventario'),
      api.get('/llantas/marcas'),
    ]).then(([inv, mrc]) => {
      setLlantas(inv.data)
      setMarcas(mrc.data)
    }).finally(() => setCargando(false))
  }, [])

  const filtradas = llantas.filter((l) => {
    const marcaNombre = l.marca?.nombre_display || l.marca?.nombre || ''
    return `${marcaNombre} ${l.modelo || ''} ${l.medida} ${l.codigo}`
      .toLowerCase().includes(busqueda.toLowerCase())
  })

  const totalStock = llantas.reduce((s, l) => s + l.stock, 0)
  const stockBajo  = llantas.filter((l) => l.stock <= 3).length

  function actualizarLlanta(nueva) {
    setLlantas((prev) => prev.map((l) => l.id === nueva.id ? nueva : l))
  }

  function agregarLlanta(nueva) {
    setLlantas((prev) => [nueva, ...prev])
  }

  async function eliminarLlanta(id) {
    await api.delete(`/llantas/${id}`)
    setLlantas((prev) => prev.filter((l) => l.id !== id))
    setModalEliminar(null)
  }

  if (cargando) {
    return (
      <div style={{ backgroundColor: '#030712', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '2px solid #facc15', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ color: '#6b7280', fontSize: '13px' }}>Cargando inventario...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#030712', color: '#ffffff', minHeight: '100dvh' }}>

      {/* Cabecera */}
      <div style={{ backgroundColor: '#06080f', borderBottom: '1px solid #111827', padding: '20px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
                Inventario <span style={{ color: '#facc15' }}>de Llantas</span>
              </h2>
              <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                Aquí puedes ver y gestionar todas las llantas del almacén.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Modelos distintos', value: llantas.length, color: '#ffffff' },
                { label: 'Piezas en total',   value: totalStock,     color: '#4ade80' },
                { label: 'Con stock bajo',     value: stockBajo,      color: stockBajo > 0 ? '#f87171' : '#6b7280' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ backgroundColor: '#0f1117', border: `1px solid ${label === 'Con stock bajo' && stockBajo > 0 ? 'rgba(248,113,113,0.2)' : '#1f2937'}`, borderRadius: '10px', padding: '10px 16px', textAlign: 'center', minWidth: '80px' }}>
                  <p style={{ color, fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>{value}</p>
                  <p style={{ color: '#6b7280', fontSize: '10px', marginTop: '3px', maxWidth: '80px' }}>{label}</p>
                </div>
              ))}

              {/* Botón nueva llanta — solo admins */}
              {esAdmin && (
                <button
                  onClick={() => setModalNueva(true)}
                  style={{ backgroundColor: '#facc15', color: '#030712', fontWeight: 700, fontSize: '13px', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde047'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#facc15'}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Nueva llanta
                </button>
              )}

              {/* Botón recibir pedido */}
              <button
                onClick={() => setModalPedido(true)}
                style={{ backgroundColor: '#4ade80', color: '#030712', fontWeight: 700, fontSize: '13px', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#86efac'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4ade80'}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                Recibir pedido
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador + leyenda */}
      <div style={{ padding: '16px 20px 0', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por código, marca, modelo o medida..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ ...S.input, maxWidth: '380px', backgroundColor: '#0a0e17' }}
            onFocus={(e) => e.target.style.borderColor = '#facc15'}
            onBlur={(e) => e.target.style.borderColor = '#1f2937'}
          />

          {/* Leyenda de botones */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {esAdmin && (
              <span style={{ color: '#6b7280', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ backgroundColor: '#1f2937', color: '#e5e7eb', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600 }}>Editar</span>
                edita todos los datos
              </span>
            )}
            {!esAdmin && puedePrecio && (
              <span style={{ color: '#6b7280', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ backgroundColor: 'rgba(250,204,21,0.08)', color: '#facc15', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600 }}>Precio</span>
                edita el precio
              </span>
            )}
            {puedePrecio && (
              <span style={{ color: '#6b7280', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600 }}>⚙️ Ajuste</span>
                corrige stock (conteo físico, merma)
              </span>
            )}
            {puedePrecio && (
              <span style={{ color: '#6b7280', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ backgroundColor: '#111827', color: '#6b7280', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600 }}>🕐</span>
                historial
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabla — escritorio */}
      <div style={{ padding: '16px 20px 8px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ border: '1px solid #111827', borderRadius: '14px', overflow: 'hidden' }} className="tabla-inventario">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#06080f' }}>
                  {['#', 'Código', 'Marca', 'Modelo', 'Medida', 'Costo', 'Precio venta', 'Stock', 'Catálogo', 'Acciones'].map((h, i) => (
                    <th key={h} style={{ padding: '11px 12px', color: '#6b7280', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', textAlign: i >= 5 ? 'right' : 'left', whiteSpace: 'nowrap', borderBottom: '1px solid #111827' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '60px', color: '#374151' }}>
                      {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay llantas en el inventario.'}
                    </td>
                  </tr>
                ) : filtradas.map((llanta, i) => (
                  <tr key={llanta.id}
                    style={{ borderTop: '1px solid #0d1117', backgroundColor: i % 2 === 0 ? '#030712' : '#06080f', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0a0e17'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#030712' : '#06080f'}
                  >
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', color: '#facc15', fontWeight: 700, fontFamily: 'monospace' }}>{llanta.codigo}</td>
                    <td style={{ padding: '10px 12px', color: '#e5e7eb', fontWeight: 600 }}>{llanta.marca?.nombre_display || llanta.marca?.nombre || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{llanta.modelo || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ backgroundColor: '#111827', border: '1px solid #1f2937', color: '#9ca3af', fontFamily: 'monospace', fontSize: '11px', padding: '2px 7px', borderRadius: '5px' }}>
                        {llanta.medida}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#6b7280' }}>${(llanta.costo_compra ?? 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4ade80', fontWeight: 600 }}>${(llanta.precio_venta ?? 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span style={{ color: llanta.stock === 0 ? '#ef4444' : llanta.stock <= 3 ? '#f97316' : '#ffffff', fontWeight: 700 }}>{llanta.stock}</span>
                      {llanta.stock === 0 && <span style={{ color: '#ef4444', fontSize: '9px', marginLeft: '3px', backgroundColor: 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: '4px' }}>AGOTADO</span>}
                      {llanta.stock > 0 && llanta.stock <= 3 && <span style={{ color: '#f97316', fontSize: '9px', marginLeft: '3px' }}>bajo</span>}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span title={llanta.visible_catalogo ? 'Visible en catálogo' : 'Oculto del catálogo'} style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: llanta.visible_catalogo ? '#4ade80' : '#374151' }} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {esAdmin && (
                          <button onClick={() => setModalEditar(llanta)}
                            style={{ backgroundColor: '#1f2937', color: '#e5e7eb', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Editar todos los datos de esta llanta"
                          >
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                            Editar
                          </button>
                        )}
                        {!esAdmin && puedePrecio && (
                          <button onClick={() => setModalPrecio(llanta)}
                            style={{ backgroundColor: 'rgba(250,204,21,0.08)', color: '#facc15', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Editar precios"
                          >
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" /></svg>
                            Precio
                          </button>
                        )}
                        {puedePrecio && (
                          <button onClick={() => setModalMovimiento(llanta)}
                            style={{ backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'none', borderRadius: '6px', padding: '5px 9px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                            title="Registrar entrada o salida de stock"
                          >↑↓</button>
                        )}
                        {puedePrecio && (
                          <button onClick={() => setModalHistorial(llanta)}
                            style={{ backgroundColor: '#111827', color: '#6b7280', border: 'none', borderRadius: '6px', padding: '5px 9px', fontSize: '12px', cursor: 'pointer' }}
                            title="Ver historial de movimientos"
                          >🕐</button>
                        )}
                        {esAdmin && (
                          <button onClick={() => setModalEliminar(llanta)}
                            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: '6px', padding: '5px 9px', fontSize: '12px', cursor: 'pointer' }}
                            title="Eliminar esta llanta del inventario"
                          >
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                          </button>
                        )}
                        {!puedePrecio && <span style={{ color: '#374151', fontSize: '11px' }}>—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {busqueda && (
          <p style={{ color: '#374151', fontSize: '12px', marginTop: '10px' }}>
            {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''} para "{busqueda}"
          </p>
        )}
      </div>

      {/* Vista tarjetas para móvil */}
      <div style={{ padding: '0 20px 40px', maxWidth: '1280px', margin: '0 auto' }} className="cards-inventario">
        {filtradas.map((llanta) => (
          <div key={`card-${llanta.id}`} style={{ backgroundColor: '#06080f', border: '1px solid #111827', borderRadius: '12px', padding: '14px 16px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <p style={{ color: '#facc15', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700 }}>{llanta.codigo}</p>
                <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px' }}>
                  {llanta.marca?.nombre_display || llanta.marca?.nombre} {llanta.modelo || ''}
                </p>
                <p style={{ color: '#6b7280', fontSize: '12px' }}>{llanta.medida}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#4ade80', fontWeight: 800, fontSize: '16px' }}>${(llanta.precio_venta ?? 0).toFixed(2)}</p>
                <p style={{ color: llanta.stock <= 3 ? '#f97316' : '#9ca3af', fontSize: '12px' }}>
                  {llanta.stock} piezas
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {esAdmin && (
                <button onClick={() => setModalEditar(llanta)} style={{ flex: 1, backgroundColor: '#1f2937', color: '#e5e7eb', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', minWidth: '70px' }}>
                  ✏️ Editar
                </button>
              )}
              {!esAdmin && puedePrecio && (
                <button onClick={() => setModalPrecio(llanta)} style={{ flex: 1, backgroundColor: 'rgba(250,204,21,0.08)', color: '#facc15', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  💲 Precio
                </button>
              )}
              {puedePrecio && (
                <button onClick={() => setModalMovimiento(llanta)} title="Corrección de stock: para conteos físicos, mermas o devoluciones" style={{ flex: 1, backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', minWidth: '80px' }}>
                  ⚙️ Ajuste
                </button>
              )}
              {puedePrecio && (
                <button onClick={() => setModalHistorial(llanta)} style={{ backgroundColor: '#111827', color: '#6b7280', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
                  🕐
                </button>
              )}
              {esAdmin && (
                <button onClick={() => setModalEliminar(llanta)} style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modales */}
      {modalPrecio     && <ModalPrecio     llanta={modalPrecio}    onClose={() => setModalPrecio(null)}    onGuardado={actualizarLlanta} />}
      {modalEditar     && <ModalEditar     llanta={modalEditar}    marcas={marcas} onClose={() => setModalEditar(null)}    onGuardado={actualizarLlanta} />}
      {modalEliminar   && <ModalConfirmar  llanta={modalEliminar}  onClose={() => setModalEliminar(null)}  onConfirmar={() => eliminarLlanta(modalEliminar.id)} />}
      {modalMovimiento && <ModalMovimiento llanta={modalMovimiento} onClose={() => setModalMovimiento(null)} onGuardado={actualizarLlanta} />}
      {modalHistorial  && <ModalHistorial  llanta={modalHistorial}  onClose={() => setModalHistorial(null)} />}
      {modalNueva && marcas.length > 0 && (
        <ModalNuevaLlanta marcas={marcas} onClose={() => setModalNueva(false)} onCreada={agregarLlanta} />
      )}
      {modalPedido && (
        <ModalPedido
          onClose={() => setModalPedido(false)}
          onRegistrado={(resultado) => {
            // Actualizar stock de las llantas que llegaron en el pedido
            setLlantas((prev) => prev.map((l) => {
              const item = resultado.items.find((r) => r.id_llanta === l.id)
              return item ? { ...l, stock: item.stock_nuevo, entradas: l.entradas + item.cantidad } : l
            }))
          }}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .tabla-inventario { display: block; }
        .cards-inventario { display: none; }
        @media (max-width: 700px) {
          .tabla-inventario { display: none; }
          .cards-inventario { display: block; }
        }
      `}</style>
    </div>
  )
}
