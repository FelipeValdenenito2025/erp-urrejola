'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ModalProyecto from './components/ModalProyecto'
import ModalEditarProyecto from './components/ModalEditarProyecto'
import Reporteria from './components/Reporteria'
import Proveedores from './components/Proveedores'
import Facturacion from './components/Facturacion'
import GestionUsuarios from './components/GestionUsuarios'
import BotonConsulta from './components/BotonConsulta'
import * as XLSX from 'xlsx'

type Proyecto = {
  id: string
  nombre: string
  cliente: string
  rut: string
  moneda: string
  monto_base: number
  monto_extra: number
  monto_total: number
  total_cobrado: number
  total_costos: number
  estado: string
  created_at: string
}

const fmt = (n: number, moneda = 'CLP') =>
  moneda === 'USD' ? 'USD ' + (n || 0).toLocaleString('es-CL') : '$' + (n || 0).toLocaleString('es-CL')

function getSalud(p: Proyecto) {
  if (!p.monto_total) return 'good'
  const ratio = (p.total_costos || 0) / p.monto_total
  if (ratio > 0.9) return 'danger'
  if (ratio > 0.7) return 'warning'
  return 'good'
}

const saludColor: any = { good: '#198754', warning: '#ffc107', danger: '#dc3545' }
const saludLabel: any = { good: '✓ Saludable', warning: '⚠ Atención', danger: '✗ En riesgo' }
const saludBg: any    = { good: '#e8f5e9', warning: '#fff8e1', danger: '#fdecea' }
const saludText: any  = { good: '#1b5e20', warning: '#856404', danger: '#842029' }

function ModalNuevoProyecto({ onClose, onSave }: { onClose: () => void, onSave: () => void }) {
  const [form, setForm] = useState({ nombre: '', cliente: '', rut: '', email: '', contacto: '', moneda: 'CLP', monto_base: '', estado: 'Abierto' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: any) {
    e.preventDefault()
    if (!form.nombre || !form.cliente) { setError('Nombre y cliente son obligatorios.'); return }
    setLoading(true)
    const { error } = await supabase.from('proyectos').insert({
      nombre: form.nombre, cliente: form.cliente, rut: form.rut,
      email: form.email, contacto: form.contacto, moneda: form.moneda,
      monto_base: parseFloat(form.monto_base) || 0, estado: form.estado
    })
    if (error) { setError('Error: ' + error.message); setLoading(false); return }
    onSave(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '540px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background: '#003366', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: '600' }}>➕ Nuevo Proyecto</h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '10px 14px', color: '#842029', fontSize: '13px', marginBottom: '16px' }}>⚠ {error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { label: 'Nombre del proyecto *', key: 'nombre', span: 2 },
              { label: 'Cliente *', key: 'cliente' },
              { label: 'RUT', key: 'rut' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Contacto', key: 'contacto' },
            ].map((f: any) => (
              <div key={f.key} style={{ gridColumn: f.span === 2 ? 'span 2' : undefined }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{f.label}</label>
                <input type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#111' }} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Moneda</label>
              <select value={form.moneda} onChange={e => set('moneda', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', color: '#111' }}>
                <option>CLP</option><option>USD</option><option>UF</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Monto Base</label>
              <input type="number" value={form.monto_base} onChange={e => set('monto_base', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#111' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#003366', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              {loading ? 'Guardando...' : 'Guardar Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<any>(null)
  const [proyectoEditar, setProyectoEditar] = useState<any>(null)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [excelSeleccionados, setExcelSeleccionados] = useState<string[]>([])
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [tab, setTab] = useState('proyectos')

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    setUser(session.user)
    await cargar()
    setLoading(false)
  }

  async function cargar() {
    const { data } = await supabase.from('vista_proyectos_resumen').select('*').order('created_at', { ascending: false })
    if (data) setProyectos(data)
  }

  async function exportarExcelMultiple() {
    try {
      const { data: hitos } = await supabase.from('hitos').select('*, abonos(*)').in('proyecto_id', excelSeleccionados)
      const { data: costos } = await supabase.from('costos').select('*, abonos(*)').in('proyecto_id', excelSeleccionados)
      const wb = XLSX.utils.book_new()
      const proySelec = proyectos.filter(p => excelSeleccionados.includes(p.id))

      // Hoja resumen global
      const resData = [
        ['REPORTE MULTI-PROYECTO - ERP URREJOLA'],
        [`Generado: ${new Date().toLocaleDateString('es-CL')}`],
        [],
        ['Proyecto', 'Cliente', 'Estado', 'Presupuesto', 'Total Hitos', 'Cobrado', 'Total Costos', 'Utilidad'],
        ...proySelec.map(p => {
          const hP = (hitos||[]).filter((h:any) => h.proyecto_id === p.id)
          const cP = (costos||[]).filter((c:any) => c.proyecto_id === p.id)
          const cobrado = hP.reduce((a:number,h:any) => a+(h.abonos||[]).reduce((x:number,ab:any)=>x+ab.monto,0),0)
          const pagado = cP.reduce((a:number,c:any) => a+(c.abonos||[]).reduce((x:number,ab:any)=>x+ab.monto,0),0)
          const presup = (p.monto_base||0)+(p.monto_extra||0)
          const totalH = hP.reduce((a:number,h:any)=>a+h.monto,0)
          const totalC = cP.reduce((a:number,c:any)=>a+c.monto,0)
          return [p.nombre, p.cliente, p.estado, presup, totalH, cobrado, totalC, cobrado-pagado]
        })
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resData), 'Resumen')

      // Una hoja por proyecto
      proySelec.forEach(p => {
        const hP = (hitos||[]).filter((h:any) => h.proyecto_id === p.id)
        const cP = (costos||[]).filter((c:any) => c.proyecto_id === p.id)
        const sheetData: any[][] = [
          [p.nombre], [`Cliente: ${p.cliente}`], [`RUT: ${p.rut||''}`], [],
          ['HITOS DE VENTA'],
          ['Descripción', 'Monto', 'Est. Factura', 'Est. Pago', 'Cobrado'],
        ]
        hP.forEach((h:any) => {
          const ab = (h.abonos||[]).reduce((a:number,b:any)=>a+b.monto,0)
          sheetData.push([h.descripcion, h.monto, h.estado_factura, h.estado_pago, ab])
          ;(h.abonos||[]).forEach((a:any) => sheetData.push(['  ↳ Abono', '', '', a.fecha, a.monto]))
        })
        sheetData.push([], ['COSTOS Y EGRESOS'], ['Descripción', 'Categoría', 'Monto', 'Estado Pago', 'Pagado'])
        cP.forEach((c:any) => {
          const pg = (c.abonos||[]).reduce((a:number,b:any)=>a+b.monto,0)
          sheetData.push([c.descripcion, c.categoria, c.monto, c.estado_pago, pg])
          ;(c.abonos||[]).forEach((a:any) => sheetData.push(['  ↳ Pago', '', '', a.fecha, a.monto]))
        })
        const sheetName = p.nombre.substring(0,30).replace(/[:\\/\?\*\[\]]/g,'')
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetData), sheetName)
      })

      XLSX.writeFile(wb, `Proyectos_ERP_${new Date().getTime()}.xlsx`)
      setShowExcelModal(false)
    } catch(e: any) {
      alert('Error: ' + e.message)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const proyectosFiltrados = proyectos.filter(p => {
    const matchFiltro = filtro === 'todos' || p.estado.toLowerCase() === filtro
    const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.cliente.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusqueda
  })

  const totalVentas = proyectos.reduce((a, p) => a + (p.total_cobrado || 0), 0)
  const totalCostos = proyectos.reduce((a, p) => a + (p.total_costos  || 0), 0)
  const utilidad    = totalVentas - totalCostos
  const abiertos    = proyectos.filter(p => p.estado === 'Abierto').length
  const cerrados    = proyectos.filter(p => p.estado === 'Cerrado').length

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f9', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', border: '4px solid #e0e0e0', borderTopColor: '#003366', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#003366', fontWeight: '600', margin: 0 }}>Cargando ERP Urrejola...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e9ecef', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="https://i.imgur.com/U7FK19x.png" alt="Logo" style={{ height: '42px', objectFit: 'contain' as const }} />
          <div style={{ width: '1px', height: '32px', background: '#e9ecef' }} />
          <div>
            <div style={{ color: '#003366', fontWeight: '700', fontSize: '15px', lineHeight: 1.2 }}>ERP Urrejola</div>
            <div style={{ color: '#aaa', fontSize: '11px' }}>Sistema de Gestión</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[
            { id: 'proyectos',    label: '📁 Proyectos' },
            { id: 'facturacion',  label: '📄 Facturación' },
            { id: 'proveedores',  label: '🏢 Proveedores' },
            { id: 'reportes',     label: '📊 Reportería' },
            ...(user?.email === 'fvaldebenito@aacadvisory.cl' ? [{ id: 'usuarios', label: '👥 Usuarios' }] : []),
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'transparent', border: 'none',
              color: tab === t.id ? '#003366' : '#6c757d',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', fontWeight: tab === t.id ? '700' : '400',
              borderBottom: tab === t.id ? '3px solid #003366' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#6c757d', fontSize: '12px' }}>{user?.email}</span>
          <button onClick={handleLogout}
            style={{ background: '#f8f9fa', border: '1px solid #dee2e6', color: '#003366', padding: '6px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e9ecef')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f8f9fa')}>
            → Salir
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '22px 16px' }}>

        {/* Tarjetas resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Ventas Cobradas',    value: fmt(totalVentas), bg: 'linear-gradient(135deg,#003366,#00509d)', icon: '💰' },
            { label: 'Costos Registrados', value: fmt(totalCostos), bg: 'linear-gradient(135deg,#d9534f,#c9302c)', icon: '📤' },
            { label: 'Utilidad Neta',      value: fmt(utilidad),    bg: `linear-gradient(135deg,${utilidad >= 0 ? '#198754,#146c43' : '#dc3545,#a71d2a'})`, icon: utilidad >= 0 ? '📈' : '📉' },
            { label: 'Proyectos Abiertos', value: String(abiertos), bg: 'linear-gradient(135deg,#0f6e56,#1D9E75)', icon: '📂' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: '12px', padding: '16px 18px', color: 'white', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '5px' }}>{c.label}</div>
                  <div style={{ fontSize: '21px', fontWeight: '700' }}>{c.value}</div>
                </div>
                <span style={{ fontSize: '22px', opacity: 0.65 }}>{c.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {tab === 'proyectos' && (
          <>
            {/* Filtros */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', border: '1px solid #eee', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
              <input placeholder="🔍 Buscar proyecto o cliente..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                style={{ flex: 1, minWidth: '180px', padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none', color: '#111' }} />
              <div style={{ display: 'flex', gap: '5px' }}>
                {['todos', 'abierto', 'cerrado'].map(f => (
                  <button key={f} onClick={() => setFiltro(f)} style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: filtro === f ? '600' : '400', background: filtro === f ? '#003366' : '#f0f0f0', color: filtro === f ? 'white' : '#555', transition: 'all 0.2s' }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'todos' ? proyectos.length : f === 'abierto' ? abiertos : cerrados})
                  </button>
                ))}
              </div>
              <button onClick={() => { setExcelSeleccionados(proyectos.map(p=>p.id)); setShowExcelModal(true) }}
                style={{ background:'#198754', color:'white', border:'none', padding:'7px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'600', whiteSpace:'nowrap' as const }}>
                📥 Excel
              </button>
              <button onClick={() => setShowModal(true)} style={{ background: '#003366', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' as const }}>
                + Nuevo Proyecto
              </button>
            </div>

            {/* Lista proyectos */}
            {proyectosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 20px', background: 'white', borderRadius: '12px', color: '#6c757d', border: '1px solid #eee' }}>
                <div style={{ fontSize: '48px', marginBottom: '14px' }}>📁</div>
                <h3 style={{ color: '#003366', marginBottom: '6px' }}>{busqueda || filtro !== 'todos' ? 'Sin resultados' : 'Sin proyectos aún'}</h3>
                <p style={{ fontSize: '13px' }}>{busqueda || filtro !== 'todos' ? 'Intenta con otro filtro.' : 'Crea tu primer proyecto para comenzar.'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {proyectosFiltrados.map(p => {
                  const salud = getSalud(p)
                  const progreso = p.monto_total > 0 ? Math.min(((p.total_cobrado || 0) / p.monto_total) * 100, 100) : 0
                  const utilP = (p.total_cobrado || 0) - (p.total_costos || 0)

                  return (
                    <div key={p.id}
                      onClick={() => setProyectoSeleccionado(p)}
                      style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #f0f0f0' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(0,0,0,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}
                    >
                      <div style={{ width: '5px', background: saludColor[salud], flexShrink: 0 }} />
                      <div style={{ padding: '14px 18px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
                              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#003366' }}>{p.nombre}</h3>
                              <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', textTransform: 'uppercase' as const, background: p.estado === 'Abierto' ? '#e3f2fd' : '#e8f5e9', color: p.estado === 'Abierto' ? '#0d47a1' : '#1b5e20' }}>{p.estado}</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>👤 {p.cliente}{p.rut ? ` · ${p.rut}` : ''}</span>
                          </div>
                          <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#003366' }}>{fmt(p.monto_total, p.moneda)}</div>
                            <div style={{ fontSize: '11px', color: '#aaa' }}>Presupuesto total</div>
                          </div>
                        </div>

                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6c757d', marginBottom: '3px' }}>
                            <span>Cobrado {Math.round(progreso)}%</span>
                            <span>{fmt(p.total_cobrado, p.moneda)} / {fmt(p.monto_total, p.moneda)}</span>
                          </div>
                          <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progreso}%`, background: '#003366', borderRadius: '3px' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
                          <button onClick={e => { e.stopPropagation(); setProyectoEditar(p) }}
                            style={{ fontSize:'11px', padding:'2px 9px', borderRadius:'5px', border:'1px solid #003366', background:'white', color:'#003366', cursor:'pointer', fontWeight:'600' }}>
                            ✏ Editar
                          </button>

                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: '#e3f2fd', color: '#0d47a1', fontWeight: '500' }}>💰 {fmt(p.total_cobrado, p.moneda)}</span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: '#fdecea', color: '#842029', fontWeight: '500' }}>📤 {fmt(p.total_costos, p.moneda)}</span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: saludBg[salud], color: saludText[salud], fontWeight: '600' }}>{saludLabel[salud]}</span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: utilP >= 0 ? '#e8f5e9' : '#fdecea', color: utilP >= 0 ? '#1b5e20' : '#842029', fontWeight: '600', marginLeft: 'auto' }}>
                            Utilidad: {fmt(utilP, p.moneda)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'facturacion' && <Facturacion usuarioEmail={user?.email || ''} />}
        {tab === 'usuarios' && <GestionUsuarios usuarioEmail={user?.email || ''} />}
        {tab === 'proveedores' && <Proveedores />}
        {tab === 'reportes' && <Reporteria />}
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '20px', marginTop: '10px', fontSize: '12px', color: '#aaa', borderTop: '1px solid #eee' }}>
        ERP Urrejola © {new Date().getFullYear()} · Impulsado por{' '}
        <a href="https://aacauditores.cl/" target="_blank" rel="noopener noreferrer"
          style={{ color: '#003366', fontWeight: '600', textDecoration: 'none' }}>
          AA&C Auditores
        </a>
      </footer>

      {/* Modales */}
      {showModal && <ModalNuevoProyecto onClose={() => setShowModal(false)} onSave={cargar} />}
      {/* CSS Responsive */}
      <style>{`
        @media (max-width: 768px) {
          nav { padding: 0 12px !important; height: auto !important; flex-wrap: wrap; gap: 8px; padding-top: 10px !important; padding-bottom: 10px !important; }
          nav img { height: 32px !important; }
          nav > div:nth-child(2) { order: 3; width: 100%; overflow-x: auto; padding-bottom: 4px; }
          nav > div:nth-child(3) { gap: 6px !important; }
          nav span { display: none; }
          .erp-container { padding: 12px 10px !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .filter-bar { flex-direction: column !important; }
          .filter-bar input { min-width: unset !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {showExcelModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:'white', borderRadius:'12px', width:'100%', maxWidth:'500px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ background:'#198754', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h5 style={{ margin:0, color:'white', fontSize:'15px', fontWeight:'700' }}>📥 Exportar Proyectos a Excel</h5>
              <button onClick={()=>setShowExcelModal(false)} style={{ background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer' }}>×</button>
            </div>
            <div style={{ padding:'18px' }}>
              <div style={{ fontSize:'12px', color:'#6c757d', marginBottom:'12px' }}>Selecciona los proyectos a exportar. Cada proyecto tendrá su propia hoja con hitos, abonos, costos y pagos.</div>
              <div style={{ display:'flex', gap:'8px', marginBottom:'10px' }}>
                <button onClick={()=>setExcelSeleccionados(proyectos.map(p=>p.id))} style={{ fontSize:'12px', padding:'4px 10px', borderRadius:'6px', border:'1px solid #198754', background:'white', color:'#198754', cursor:'pointer', fontWeight:'600' }}>Todos</button>
                <button onClick={()=>setExcelSeleccionados([])} style={{ fontSize:'12px', padding:'4px 10px', borderRadius:'6px', border:'1px solid #6c757d', background:'white', color:'#6c757d', cursor:'pointer' }}>Ninguno</button>
              </div>
              <div style={{ maxHeight:'280px', overflowY:'auto' as const, border:'1px solid #e9ecef', borderRadius:'8px' }}>
                {proyectos.map(p => (
                  <label key={p.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', borderBottom:'1px solid #f0f0f0', cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='#f8f9fa')}
                    onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                    <input type="checkbox" checked={excelSeleccionados.includes(p.id)}
                      onChange={e => setExcelSeleccionados(prev => e.target.checked ? [...prev, p.id] : prev.filter(x=>x!==p.id))}
                      style={{ width:'16px', height:'16px', cursor:'pointer' }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:'600', color:'#003366' }}>{p.nombre}</div>
                      <div style={{ fontSize:'11px', color:'#6c757d' }}>{p.cliente} · {p.estado}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'16px' }}>
                <button onClick={()=>setShowExcelModal(false)} style={{ padding:'8px 18px', borderRadius:'8px', border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontSize:'13px' }}>Cancelar</button>
                <button onClick={exportarExcelMultiple} disabled={excelSeleccionados.length===0}
                  style={{ padding:'8px 18px', borderRadius:'8px', border:'none', background: excelSeleccionados.length===0?'#aaa':'#198754', color:'white', cursor: excelSeleccionados.length===0?'not-allowed':'pointer', fontSize:'13px', fontWeight:'600' }}>
                  📥 Descargar ({excelSeleccionados.length} proyectos)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {proyectoEditar && (
        <ModalEditarProyecto
          proyecto={proyectoEditar}
          onClose={() => setProyectoEditar(null)}
          onSave={cargar}
        />
      )}
      {proyectoSeleccionado && (
        <ModalProyecto
          proyecto={proyectoSeleccionado}
          onClose={() => setProyectoSeleccionado(null)}
          onUpdate={cargar}
        />
      )}
      <BotonConsulta usuarioEmail={user?.email || ''} />
    </div>
  )
}
