'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { confirmar, alertar } from './Dialog'

type Proveedor = {
  id: string
  nombre: string
  rut: string
  contacto: string
  email: string
  created_at: string
}

type Colaborador = {
  id: string
  nombre: string
  rut: string
  email: string
  created_at: string
}

// ── Modal Proveedor ───────────────────────────────────────
function ModalProveedor({ proveedor, onClose, onSave }:
  { proveedor?: Proveedor | null, onClose: () => void, onSave: () => void }) {
  const [form, setForm] = useState({
    nombre:   proveedor?.nombre   || '',
    rut:      proveedor?.rut      || '',
    contacto: proveedor?.contacto || '',
    email:    proveedor?.email    || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre) { setError('El nombre es obligatorio.'); return }
    setLoading(true)
    if (proveedor) {
      const { error } = await supabase.from('proveedores').update(form).eq('id', proveedor.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('proveedores').insert(form)
      if (error) { setError(error.message); setLoading(false); return }
    }
    onSave(); onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'white', borderRadius:'12px', width:'100%', maxWidth:'480px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background:'#003366', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h5 style={{ margin:0, color:'white', fontSize:'15px', fontWeight:'700' }}>
            {proveedor ? '✏ Editar Proveedor' : '➕ Nuevo Proveedor'}
          </h5>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer' }}>×</button>
        </div>
        <form onSubmit={guardar} style={{ padding:'20px' }}>
          {error && <div style={{ background:'#fdecea', border:'1px solid #f5c6cb', borderRadius:'8px', padding:'10px 14px', color:'#842029', fontSize:'13px', marginBottom:'16px' }}>⚠ {error}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div style={{ gridColumn:'span 2' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Nombre / Razón Social *</label>
              <input value={form.nombre} onChange={e=>set('nombre',e.target.value)} placeholder="Nombre del proveedor"
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>RUT</label>
              <input value={form.rut} onChange={e=>set('rut',e.target.value)} placeholder="12.345.678-9"
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Contacto</label>
              <input value={form.contacto} onChange={e=>set('contacto',e.target.value)} placeholder="Nombre contacto"
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ gridColumn:'span 2' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Email</label>
              <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="proveedor@email.com"
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
          </div>
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px' }}>
            <button type="button" onClick={onClose} style={{ padding:'9px 20px', borderRadius:'8px', border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontSize:'13px', color:'#374151' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ padding:'9px 20px', borderRadius:'8px', border:'none', background:'#003366', color:'white', cursor:'pointer', fontSize:'14px', fontWeight:'600' }}>
              {loading ? 'Guardando...' : proveedor ? 'Guardar Cambios' : 'Crear Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal Colaborador ─────────────────────────────────────
function ModalColaborador({ colaborador, onClose, onSave }:
  { colaborador?: Colaborador | null, onClose: () => void, onSave: () => void }) {
  const [form, setForm] = useState({
    nombre: colaborador?.nombre || '',
    rut:    colaborador?.rut    || '',
    email:  colaborador?.email  || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre) { setError('El nombre es obligatorio.'); return }
    setLoading(true)
    if (colaborador) {
      const { error } = await supabase.from('colaboradores').update(form).eq('id', colaborador.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('colaboradores').insert(form)
      if (error) { setError(error.message); setLoading(false); return }
    }
    onSave(); onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'white', borderRadius:'12px', width:'100%', maxWidth:'440px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background:'#6f42c1', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h5 style={{ margin:0, color:'white', fontSize:'15px', fontWeight:'700' }}>
            {colaborador ? '✏ Editar Colaborador' : '➕ Nuevo Colaborador'}
          </h5>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer' }}>×</button>
        </div>
        <form onSubmit={guardar} style={{ padding:'20px' }}>
          {error && <div style={{ background:'#fdecea', border:'1px solid #f5c6cb', borderRadius:'8px', padding:'10px 14px', color:'#842029', fontSize:'13px', marginBottom:'16px' }}>⚠ {error}</div>}
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Nombre completo *</label>
              <input value={form.nombre} onChange={e=>set('nombre',e.target.value)} placeholder="Nombre del colaborador"
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>RUT</label>
              <input value={form.rut} onChange={e=>set('rut',e.target.value)} placeholder="12.345.678-9"
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Email</label>
              <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="colaborador@email.com"
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
          </div>
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px' }}>
            <button type="button" onClick={onClose} style={{ padding:'9px 20px', borderRadius:'8px', border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontSize:'13px', color:'#374151' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ padding:'9px 20px', borderRadius:'8px', border:'none', background:'#6f42c1', color:'white', cursor:'pointer', fontSize:'14px', fontWeight:'600' }}>
              {loading ? 'Guardando...' : colaborador ? 'Guardar Cambios' : 'Crear Colaborador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────
export default function Proveedores() {
  const [tab, setTab] = useState<'proveedores'|'colaboradores'>('proveedores')
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('proveedores').select('*').order('nombre'),
      supabase.from('colaboradores').select('*').order('nombre'),
    ])
    if (p) setProveedores(p)
    if (c) setColaboradores(c)
    setLoading(false)
  }

  async function eliminarProveedor(id: string, nombre: string) {
    const ok = await confirmar({ titulo:'Eliminar proveedor', mensaje:`¿Eliminar el proveedor "${nombre}"? Esta acción no se puede deshacer.`, labelConfirmar:'✕ Eliminar' })
    if (!ok) return
    const { error } = await supabase.from('proveedores').delete().eq('id', id)
    if (error) { await alertar({ titulo:'Error', mensaje: error.message, tipo:'error' }); return }
    cargar()
  }

  async function eliminarColaborador(id: string, nombre: string) {
    const ok = await confirmar({ titulo:'Eliminar colaborador', mensaje:`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`, labelConfirmar:'✕ Eliminar' })
    if (!ok) return
    const { error } = await supabase.from('colaboradores').delete().eq('id', id)
    if (error) { await alertar({ titulo:'Error', mensaje: error.message, tipo:'error' }); return }
    cargar()
  }

  const provFiltrados = proveedores.filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.rut||'').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.email||'').toLowerCase().includes(busqueda.toLowerCase())
  )

  const colabFiltrados = colaboradores.filter(c =>
    !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.rut||'').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'14px', background:'white', borderRadius:'10px', padding:'4px', border:'1px solid #eee', width:'fit-content' }}>
        {[
          { id:'proveedores', label:`🏢 Proveedores (${proveedores.length})` },
          { id:'colaboradores', label:`👤 Colaboradores (${colaboradores.length})` },
        ].map(t => (
          <button key={t.id} onClick={()=>{ setTab(t.id as any); setBusqueda(''); setEditando(null) }}
            style={{ padding:'7px 16px', borderRadius:'7px', border:'none', cursor:'pointer', fontSize:'13px',
              fontWeight: tab===t.id?'700':'400',
              background: tab===t.id ? (t.id==='colaboradores'?'#6f42c1':'#003366') : 'transparent',
              color: tab===t.id?'white':'#6c757d', transition:'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Controles */}
      <div style={{ background:'white', borderRadius:'12px', padding:'12px 14px', marginBottom:'14px', border:'1px solid #eee', display:'flex', gap:'10px', alignItems:'center' }}>
        <input placeholder={`🔍 Buscar ${tab === 'proveedores' ? 'proveedor, RUT o email' : 'colaborador o RUT'}...`}
          value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          style={{ flex:1, padding:'7px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'13px', outline:'none' }} />
        <button onClick={()=>{ setEditando(null); setShowModal(true) }}
          style={{ background: tab==='colaboradores'?'#6f42c1':'#003366', color:'white', border:'none', padding:'7px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'600', whiteSpace:'nowrap' as const }}>
          + {tab === 'proveedores' ? 'Nuevo Proveedor' : 'Nuevo Colaborador'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#6c757d' }}>Cargando...</div>
      ) : tab === 'proveedores' ? (
        // ── Lista Proveedores ──
        provFiltrados.length === 0 ? (
          <div style={{ textAlign:'center', padding:'56px', background:'white', borderRadius:'12px', color:'#6c757d', border:'1px solid #eee' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>🏢</div>
            <h3 style={{ color:'#003366', marginBottom:'6px' }}>{busqueda ? 'Sin resultados' : 'Sin proveedores aún'}</h3>
          </div>
        ) : (
          <div style={{ background:'white', borderRadius:'12px', border:'1px solid #eee', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', background:'#f8f9fa', borderBottom:'1px solid #e9ecef', padding:'10px 16px' }}>
              {['Nombre / Razón Social','RUT','Contacto','Email',''].map((h,i) => (
                <div key={i} style={{ fontSize:'11px', fontWeight:'700', color:'#6c757d', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>{h}</div>
              ))}
            </div>
            {provFiltrados.map((p, idx) => (
              <div key={p.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', padding:'12px 16px', borderBottom: idx < provFiltrados.length-1 ? '1px solid #f0f0f0' : 'none', alignItems:'center', transition:'background 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#f8f9fa')}
                onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:'600', color:'#003366' }}>{p.nombre}</div>
                  <div style={{ fontSize:'11px', color:'#aaa', marginTop:'1px' }}>Agregado {new Date(p.created_at).toLocaleDateString('es-CL')}</div>
                </div>
                <div style={{ fontSize:'13px', color:'#374151' }}>{p.rut || <span style={{ color:'#ccc' }}>—</span>}</div>
                <div style={{ fontSize:'13px', color:'#374151' }}>{p.contacto || <span style={{ color:'#ccc' }}>—</span>}</div>
                <div style={{ fontSize:'13px', color:'#374151' }}>
                  {p.email ? <a href={`mailto:${p.email}`} style={{ color:'#003366', textDecoration:'none' }}>{p.email}</a> : <span style={{ color:'#ccc' }}>—</span>}
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={()=>{ setEditando(p); setShowModal(true) }}
                    style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'6px', border:'1px solid #003366', background:'white', color:'#003366', cursor:'pointer', fontWeight:'600' }}>✏ Editar</button>
                  <button onClick={()=>eliminarProveedor(p.id, p.nombre)}
                    style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'6px', border:'none', background:'#dc3545', color:'white', cursor:'pointer', fontWeight:'600' }}>✕ Eliminar</button>
                </div>
              </div>
            ))}
            <div style={{ padding:'10px 16px', background:'#f8f9fa', borderTop:'1px solid #e9ecef', fontSize:'12px', color:'#6c757d' }}>
              {provFiltrados.length} proveedor{provFiltrados.length !== 1 ? 'es' : ''} registrado{provFiltrados.length !== 1 ? 's' : ''}
            </div>
          </div>
        )
      ) : (
        // ── Lista Colaboradores ──
        colabFiltrados.length === 0 ? (
          <div style={{ textAlign:'center', padding:'56px', background:'white', borderRadius:'12px', color:'#6c757d', border:'1px solid #eee' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>👤</div>
            <h3 style={{ color:'#6f42c1', marginBottom:'6px' }}>{busqueda ? 'Sin resultados' : 'Sin colaboradores aún'}</h3>
            <p style={{ fontSize:'13px' }}>Agrega colaboradores para asignarles comisiones en los proyectos.</p>
          </div>
        ) : (
          <div style={{ background:'white', borderRadius:'12px', border:'1px solid #eee', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', background:'#f3f0ff', borderBottom:'1px solid #e9ecef', padding:'10px 16px' }}>
              {['Nombre Completo','RUT','Email',''].map((h,i) => (
                <div key={i} style={{ fontSize:'11px', fontWeight:'700', color:'#6f42c1', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>{h}</div>
              ))}
            </div>
            {colabFiltrados.map((c, idx) => (
              <div key={c.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', padding:'12px 16px', borderBottom: idx < colabFiltrados.length-1 ? '1px solid #f0f0f0' : 'none', alignItems:'center', transition:'background 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='#faf8ff')}
                onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#6f42c1', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:'14px', fontWeight:'700', color:'white' }}>{c.nombre[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:'600', color:'#6f42c1' }}>{c.nombre}</div>
                    <div style={{ fontSize:'11px', color:'#aaa' }}>Agregado {new Date(c.created_at).toLocaleDateString('es-CL')}</div>
                  </div>
                </div>
                <div style={{ fontSize:'13px', color:'#374151' }}>{c.rut || <span style={{ color:'#ccc' }}>—</span>}</div>
                <div style={{ fontSize:'13px', color:'#374151' }}>
                  {c.email ? <a href={`mailto:${c.email}`} style={{ color:'#6f42c1', textDecoration:'none' }}>{c.email}</a> : <span style={{ color:'#ccc' }}>—</span>}
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={()=>{ setEditando(c); setShowModal(true) }}
                    style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'6px', border:'1px solid #6f42c1', background:'white', color:'#6f42c1', cursor:'pointer', fontWeight:'600' }}>✏ Editar</button>
                  <button onClick={()=>eliminarColaborador(c.id, c.nombre)}
                    style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'6px', border:'none', background:'#dc3545', color:'white', cursor:'pointer', fontWeight:'600' }}>✕ Eliminar</button>
                </div>
              </div>
            ))}
            <div style={{ padding:'10px 16px', background:'#f3f0ff', borderTop:'1px solid #e9ecef', fontSize:'12px', color:'#6f42c1' }}>
              {colabFiltrados.length} colaborador{colabFiltrados.length !== 1 ? 'es' : ''} registrado{colabFiltrados.length !== 1 ? 's' : ''}
            </div>
          </div>
        )
      )}

      {showModal && tab === 'proveedores' && (
        <ModalProveedor proveedor={editando} onClose={()=>{ setShowModal(false); setEditando(null) }} onSave={cargar} />
      )}
      {showModal && tab === 'colaboradores' && (
        <ModalColaborador colaborador={editando} onClose={()=>{ setShowModal(false); setEditando(null) }} onSave={cargar} />
      )}
    </div>
  )
}
