'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import * as XLSX from 'xlsx'
import { confirmar } from './Dialog'
import ModalEnviarFacturas from './ModalEnviarFacturas'

type Hito = {
  id: string
  descripcion: string
  monto: number
  estado_factura: string
  estado_pago: string
  fecha_pago: string | null
  link_factura: string | null
  abonos?: { id: string; monto: number; fecha: string }[]
}

type Costo = {
  id: string
  descripcion: string
  categoria: string
  monto: number
  moneda: string
  estado_pago: string
  fecha_pago: string | null
  created_at: string
  abonos?: { id: string; monto: number; fecha: string }[]
}

type Proyecto = {
  id: string
  nombre: string
  cliente: string
  rut: string
  email: string
  contacto: string
  moneda: string
  monto_base: number
  monto_extra: number
  monto_total: number
  estado: string
}

const fmt = (n: number, m = 'CLP') =>
  m === 'USD' ? 'USD ' + (n||0).toLocaleString('es-CL') : '$' + (n||0).toLocaleString('es-CL')

const bfMap: any = {
  'Pendiente':              { bg:'#fff3cd', c:'#856404' },
  'En Proceso Facturación': { bg:'#cff4fc', c:'#055160' },
  'Facturado':              { bg:'#d1e7dd', c:'#0a3622' },
  'Anulado':                { bg:'#f8d7da', c:'#58151c' },
  'Abonado':                { bg:'#cff4fc', c:'#055160' },
  'Pagado':                 { bg:'#d1e7dd', c:'#0a3622' },
}

function Badge({ text }: { text: string }) {
  const s = bfMap[text] || { bg:'#f0f0f0', c:'#555' }
  return <span style={{ fontSize:'11px', fontWeight:'600', padding:'2px 8px', borderRadius:'10px', background:s.bg, color:s.c, whiteSpace:'nowrap' as const }}>{text}</span>
}

function Separador({ titulo, accion }: { titulo: string, accion?: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'24px 0 14px' }}>
      <div style={{ fontWeight:'700', fontSize:'13px', color:'#003366', whiteSpace:'nowrap' as const }}>{titulo}</div>
      <div style={{ flex:1, height:'1px', background:'#e9ecef' }} />
      {accion}
    </div>
  )
}

function ModalNuevoHito({ proyectoId, moneda, disponible, onClose, onSave }:
  { proyectoId:string, moneda:string, disponible:number, onClose:()=>void, onSave:()=>void }) {
  const [desc, setDesc] = useState('')
  const [monto, setMonto] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!desc || !monto) { setErr('Completa todos los campos.'); return }
    const n = parseFloat(monto)
    if (n <= 0) { setErr('El monto debe ser mayor a 0.'); return }
    if (n > disponible + 0.01) {
      setErr(`El monto supera el presupuesto disponible (${fmt(disponible, moneda)}). Amplía el presupuesto primero.`)
      return
    }
    setLoading(true)
    const { error } = await supabase.from('hitos').insert({
      proyecto_id: proyectoId, descripcion: desc,
      monto: n, estado_factura:'Pendiente', estado_pago:'Pendiente'
    })
    if (error) { setErr(error.message); setLoading(false); return }
    onSave(); onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'white', borderRadius:'12px', width:'100%', maxWidth:'460px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background:'#003366', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h6 style={{ margin:0, color:'white', fontSize:'15px', fontWeight:'700' }}>📋 Nuevo Hito de Venta</h6>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'18px' }}>
          <div style={{ background:'#e3f2fd', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', display:'flex', justifyContent:'space-between', fontSize:'13px' }}>
            <span style={{ color:'#0d47a1' }}>Presupuesto disponible</span>
            <strong style={{ color:'#003366' }}>{fmt(disponible, moneda)}</strong>
          </div>
          {err && <div style={{ fontSize:'12px', color:'#842029', background:'#fdecea', padding:'8px 12px', borderRadius:'7px', marginBottom:'12px' }}>⚠ {err}</div>}
          <form onSubmit={guardar}>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'4px' }}>Descripción *</label>
              <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ej: Primera cuota, Entrega final..."
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'4px' }}>Monto ({moneda}) *</label>
              <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder={`Máx: ${fmt(disponible, moneda)}`}
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button type="button" onClick={onClose} style={{ padding:'8px 18px', borderRadius:'8px', border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontSize:'13px' }}>Cancelar</button>
              <button type="submit" disabled={loading} style={{ padding:'8px 18px', borderRadius:'8px', border:'none', background:'#003366', color:'white', cursor:'pointer', fontSize:'13px', fontWeight:'600' }}>
                {loading ? 'Guardando...' : 'Agregar Hito'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function ModalAmpliarPresupuesto({ proyecto, onClose, onSave }:
  { proyecto:Proyecto, onClose:()=>void, onSave:()=>void }) {
  const [monto, setMonto] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    const n = parseFloat(monto)
    if (!n || n <= 0) { setErr('Ingresa un monto válido.'); return }
    setLoading(true)
    const nuevoExtra = (proyecto.monto_extra || 0) + n
    const { error } = await supabase.from('proyectos').update({ monto_extra: nuevoExtra }).eq('id', proyecto.id)
    if (error) { setErr(error.message); setLoading(false); return }
    onSave(); onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'white', borderRadius:'12px', width:'100%', maxWidth:'420px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background:'#198754', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h6 style={{ margin:0, color:'white', fontSize:'15px', fontWeight:'700' }}>💼 Ampliar Presupuesto</h6>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'18px' }}>
          <div style={{ background:'#d1e7dd', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'13px' }}>
            <div style={{ color:'#0a3622', marginBottom:'2px' }}>
              Presupuesto actual: <strong>{fmt((proyecto.monto_base||0)+(proyecto.monto_extra||0), proyecto.moneda)}</strong>
            </div>
            <div style={{ color:'#0a3622', fontSize:'12px' }}>El monto se sumará como presupuesto extra.</div>
          </div>
          {err && <div style={{ fontSize:'12px', color:'#842029', background:'#fdecea', padding:'8px 12px', borderRadius:'7px', marginBottom:'12px' }}>⚠ {err}</div>}
          <form onSubmit={guardar}>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'4px' }}>Monto adicional ({proyecto.moneda}) *</label>
              <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0"
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button type="button" onClick={onClose} style={{ padding:'8px 18px', borderRadius:'8px', border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontSize:'13px' }}>Cancelar</button>
              <button type="submit" disabled={loading} style={{ padding:'8px 18px', borderRadius:'8px', border:'none', background:'#198754', color:'white', cursor:'pointer', fontSize:'13px', fontWeight:'600' }}>
                {loading ? 'Guardando...' : 'Ampliar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function ModalAbono({ tipo, item, moneda, onClose, onSave }:
  { tipo:'hito'|'costo', item:any, moneda:string, onClose:()=>void, onSave:()=>void }) {
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const totalAbonado = (item.abonos||[]).reduce((a:number,b:any)=>a+b.monto,0)
  const restante = item.monto - totalAbonado

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    const n = parseFloat(monto)
    if (!n || n <= 0) { setErr('Monto inválido.'); return }
    if (n > restante + 0.01) { setErr(`Máximo: ${fmt(restante, moneda)}`); return }
    setLoading(true)
    if (tipo === 'hito') {
      await supabase.from('abonos').insert({ hito_id: item.id, monto: n, fecha })
      const nuevoTotal = totalAbonado + n
      const estado = nuevoTotal >= item.monto - 0.01 ? 'Pagado' : 'Abonado'
      await supabase.from('hitos').update({ estado_pago: estado, fecha_pago: estado==='Pagado'?fecha:item.fecha_pago }).eq('id', item.id)
    } else {
      await supabase.from('abonos').insert({ costo_id: item.id, monto: n, fecha })
      const nuevoTotal = totalAbonado + n
      const estado = nuevoTotal >= item.monto - 0.01 ? 'Pagado' : 'Abonado'
      await supabase.from('costos').update({ estado_pago: estado, fecha_pago: estado==='Pagado'?fecha:item.fecha_pago }).eq('id', item.id)
    }
    onSave(); onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'white', borderRadius:'12px', width:'100%', maxWidth:'380px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background: tipo==='hito'?'#003366':'#842029', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h6 style={{ margin:0, color:'white', fontSize:'14px', fontWeight:'600' }}>💰 Registrar {tipo==='hito'?'Abono':'Pago'}</h6>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'white', fontSize:'18px', cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'16px' }}>
          <div style={{ background:'#f8f9fa', borderRadius:'8px', padding:'10px 12px', marginBottom:'12px', fontSize:'13px' }}>
            <div style={{ fontWeight:'600', color:'#003366', marginBottom:'3px' }}>{item.descripcion}</div>
            <div style={{ display:'flex', justifyContent:'space-between', color:'#6c757d', fontSize:'12px' }}>
              <span>Total: <strong style={{ color:'#111' }}>{fmt(item.monto, moneda)}</strong></span>
              <span>Restante: <strong style={{ color:'#dc3545' }}>{fmt(restante, moneda)}</strong></span>
            </div>
          </div>
          {err && <div style={{ fontSize:'12px', color:'#842029', background:'#fdecea', padding:'6px 10px', borderRadius:'6px', marginBottom:'10px' }}>⚠ {err}</div>}
          <form onSubmit={guardar}>
            <div style={{ marginBottom:'10px' }}>
              <label style={{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'3px' }}>Monto</label>
              <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0"
                style={{ width:'100%', padding:'8px 10px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'7px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'3px' }}>Fecha</label>
              <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
                style={{ width:'100%', padding:'8px 10px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'7px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button type="button" onClick={onClose} style={{ padding:'7px 14px', borderRadius:'7px', border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontSize:'13px' }}>Cancelar</button>
              <button type="submit" disabled={loading} style={{ padding:'7px 14px', borderRadius:'7px', border:'none', background: tipo==='hito'?'#003366':'#842029', color:'white', cursor:'pointer', fontSize:'13px', fontWeight:'600' }}>
                {loading ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function FormNuevoCosto({ proyectoId, onSave }: { proyectoId:string, onSave:()=>void }) {
  const [form, setForm] = useState({ descripcion:'', categoria:'Servicios', monto:'', moneda:'CLP', proveedor_id:'' })
  const [proveedores, setProveedores] = useState<{id:string,nombre:string}[]>([])

  useEffect(()=>{
    supabase.from('proveedores').select('id,nombre').order('nombre').then(({data})=>{ if(data) setProveedores(data) })
  },[])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [abierto, setAbierto] = useState(false)
  const set = (k:string, v:string) => setForm(f=>({...f,[k]:v}))

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descripcion || !form.monto) { setErr('Completa todos los campos.'); return }
    setLoading(true)
    const { error } = await supabase.from('costos').insert({
      proyecto_id: proyectoId, descripcion: form.descripcion,
      categoria: form.categoria, monto: parseFloat(form.monto),
      moneda: form.moneda, estado_pago:'Pendiente',
      ...(form.proveedor_id ? { proveedor_id: form.proveedor_id } : {})
    })
    if (error) { setErr(error.message); setLoading(false); return }
    setForm({ descripcion:'', categoria:'Servicios', monto:'', moneda:'CLP', proveedor_id:'' })
    setErr(''); setAbierto(false); onSave(); setLoading(false)
  }

  if (!abierto) return (
    <button onClick={()=>setAbierto(true)}
      style={{ fontSize:'12px', padding:'6px 14px', borderRadius:'7px', border:'1px dashed #dc3545', background:'white', color:'#842029', cursor:'pointer', fontWeight:'600', marginBottom:'12px', width:'100%', textAlign:'center' as const }}>
      ➕ Registrar nuevo egreso / costo
    </button>
  )

  return (
    <div style={{ background:'#fff8f8', borderRadius:'10px', padding:'14px', marginBottom:'12px', border:'1px solid #f5c6cb' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
        <div style={{ fontSize:'12px', fontWeight:'700', color:'#842029' }}>➕ Nuevo egreso / costo</div>
        <button onClick={()=>setAbierto(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:'16px' }}>×</button>
      </div>
      {err && <div style={{ fontSize:'12px', color:'#842029', background:'#fdecea', padding:'6px 10px', borderRadius:'6px', marginBottom:'8px' }}>⚠ {err}</div>}
      <form onSubmit={guardar}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 130px 100px 80px', gap:'8px', marginBottom:'10px' }}>
          <div>
            <label style={{ fontSize:'11px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'3px' }}>Descripción *</label>
            <input value={form.descripcion} onChange={e=>set('descripcion',e.target.value)} placeholder="Concepto..."
              style={{ width:'100%', padding:'7px 10px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'7px', outline:'none', boxSizing:'border-box' as const }} />
          </div>
          <div>
            <label style={{ fontSize:'11px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'3px' }}>Categoría</label>
            <select value={form.categoria} onChange={e=>set('categoria',e.target.value)}
              style={{ width:'100%', padding:'7px 8px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'7px', outline:'none' }}>
              {['Servicios','Honorarios','Materiales','Software','Viajes','Otros'].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'11px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'3px' }}>Monto *</label>
            <input type="number" value={form.monto} onChange={e=>set('monto',e.target.value)} placeholder="0"
              style={{ width:'100%', padding:'7px 10px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'7px', outline:'none', boxSizing:'border-box' as const }} />
          </div>
          <div>
            <label style={{ fontSize:'11px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'3px' }}>Moneda</label>
            <select value={form.moneda} onChange={e=>set('moneda',e.target.value)}
              style={{ width:'100%', padding:'7px 8px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'7px', outline:'none' }}>
              <option>CLP</option><option>USD</option><option>UF</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom:'10px' }}>
          <label style={{ fontSize:'11px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'3px' }}>Proveedor (opcional)</label>
          <select value={form.proveedor_id} onChange={e=>set('proveedor_id',e.target.value)}
            style={{ width:'100%', padding:'7px 8px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'7px', outline:'none' }}>
            <option value="">— Sin proveedor —</option>
            {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button type="submit" disabled={loading}
            style={{ padding:'7px 18px', background:'#842029', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontSize:'13px', fontWeight:'600' }}>
            {loading ? 'Guardando...' : 'Registrar Costo'}
          </button>
        </div>
      </form>
    </div>
  )
}

const ADMINS = ['fvaldebenito@aacadvisory.cl', 'vjimenez@aacadvisory.cl']

function ModalComision({ presupuesto, moneda, colaboradores, onClose, onConfirm }:
  { presupuesto: number, moneda: string, colaboradores: {id:string,nombre:string,rut:string}[], onClose: ()=>void, onConfirm: (id:string, nombre:string)=>void }) {
  const comision = Math.round(presupuesto * 0.03)
  const fmt2 = (n: number) => moneda === 'USD' ? 'USD ' + n.toLocaleString('es-CL') : '$' + n.toLocaleString('es-CL')
  const [colaboradorId, setColaboradorId] = useState('')

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'white', borderRadius:'14px', width:'100%', maxWidth:'440px', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ background:'linear-gradient(135deg,#6f42c1,#5a32a3)', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h5 style={{ margin:0, color:'white', fontSize:'15px', fontWeight:'700' }}>💜 Registrar Comisión 3%</h5>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'20px' }}>
          <div style={{ background:'#f3f0ff', borderRadius:'8px', padding:'14px', marginBottom:'18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'6px' }}>
              <span style={{ color:'#6c757d' }}>Presupuesto total</span>
              <span style={{ fontWeight:'600', color:'#374151' }}>{fmt2(presupuesto)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'15px' }}>
              <span style={{ fontWeight:'700', color:'#6f42c1' }}>Comisión (3%)</span>
              <span style={{ fontWeight:'800', color:'#6f42c1' }}>{fmt2(comision)}</span>
            </div>
          </div>
          <div style={{ marginBottom:'18px' }}>
            <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'6px' }}>Asignar a colaborador *</label>
            {colaboradores.length === 0 ? (
              <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#856404' }}>
                ⚠ No hay colaboradores registrados. Ve a Proveedores → Colaboradores para agregar uno.
              </div>
            ) : (
              <select value={colaboradorId} onChange={e=>setColaboradorId(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none' }}>
                <option value="">— Seleccionar colaborador —</option>
                {colaboradores.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}{c.rut ? ` · ${c.rut}` : ''}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <button onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:'8px', border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontSize:'14px', color:'#374151' }}>
              Cancelar
            </button>
            <button onClick={() => {
              if (!colaboradorId) return
              const colab = colaboradores.find(c => c.id === colaboradorId)
              if (colab) onConfirm(colab.id, colab.nombre)
            }} disabled={!colaboradorId}
              style={{ padding:'9px 20px', borderRadius:'8px', border:'none', background: colaboradorId?'#6f42c1':'#aaa', color:'white', cursor: colaboradorId?'pointer':'not-allowed', fontSize:'14px', fontWeight:'700' }}>
              ✓ Registrar comisión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ModalProyecto({ proyecto, onClose, onUpdate, usuarioEmail = '' }:
  { proyecto:Proyecto, onClose:()=>void, onUpdate:()=>void, usuarioEmail?:string }) {
  const [hitos, setHitos] = useState<Hito[]>([])
  const [costos, setCostos] = useState<Costo[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnviarFacturas, setShowEnviarFacturas] = useState(false)
  const [colaboradores, setColaboradores] = useState<{id:string,nombre:string,rut:string}[]>([])
  const [showComision, setShowComision] = useState(false)
  const [abonoItem, setAbonoItem] = useState<{tipo:'hito'|'costo', item:any}|null>(null)
  const [showNuevoHito, setShowNuevoHito] = useState(false)
  const [showAmpliar, setShowAmpliar] = useState(false)
  const [proyectoLocal, setProyectoLocal] = useState<any>(proyecto)

  useEffect(() => { cargar() }, [proyecto.id])

  async function cargar() {
    setLoading(true)
    const [{ data: h }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('hitos').select('*, abonos(*)').eq('proyecto_id', proyecto.id).order('created_at', { ascending:true }),
      supabase.from('costos').select('*, abonos(*)').eq('proyecto_id', proyecto.id).order('created_at', { ascending:true }),
      supabase.from('proyectos').select('*').eq('id', proyecto.id).single(),
    ])
    if (h) setHitos(h)
    if (c) setCostos(c)
    if (p) setProyectoLocal(p)
    setLoading(false)
  }

  async function recargar() {
    await supabase.rpc('actualizar_estado_proyecto', { p_proyecto_id: proyecto.id })
    await cargar()
    onUpdate()
  }

  async function eliminarHito(id:string) {
    const ok = await confirmar({ titulo: 'Eliminar hito', mensaje: '¿Eliminar este hito y todos sus abonos? Esta acción no se puede deshacer.', labelConfirmar: '✕ Eliminar' })
    if (!ok) return
    const { error } = await supabase.from('hitos').delete().eq('id', id)
    if (error) { await confirmar({ titulo: 'Error', mensaje: error.message, labelConfirmar: 'Aceptar' }); return }
    recargar()
  }

  async function eliminarCosto(id:string) {
    const ok2 = await confirmar({ titulo: 'Eliminar costo', mensaje: '¿Eliminar este costo? Esta acción no se puede deshacer.', labelConfirmar: '✕ Eliminar' })
    if (!ok2) return
    await supabase.from('costos').delete().eq('id', id); recargar()
  }

  async function eliminarAbono(abonoId:string, tipo:'hito'|'costo', parentId:string) {
    const ok3 = await confirmar({ titulo: 'Eliminar abono', mensaje: '¿Eliminar este abono? El estado del hito/costo se recalculará.', labelConfirmar: '✕ Eliminar' })
    if (!ok3) return
    await supabase.from('abonos').delete().eq('id', abonoId)
    const col = tipo==='hito'?'hito_id':'costo_id'
    const tabla = tipo==='hito'?'hitos':'costos'
    const { data } = await supabase.from('abonos').select('monto').eq(col, parentId)
    const total = (data||[]).reduce((a:number,b:any)=>a+b.monto,0)
    const parent = tipo==='hito'?hitos.find(h=>h.id===parentId):costos.find(c=>c.id===parentId)
    let estado = 'Pendiente'
    if (total > 0) estado = total >= (parent?.monto||0)-0.01 ? 'Pagado' : 'Abonado'
    await supabase.from(tabla).update({ estado_pago: estado }).eq('id', parentId)
    recargar()
  }

  async function actualizarEstadoFactura(hitoId:string, valor:string) {
    await supabase.from('hitos').update({ estado_factura: valor }).eq('id', hitoId); cargar()
  }

  async function actualizarLink(hitoId:string, link:string) {
    await supabase.from('hitos').update({ link_factura: link||null }).eq('id', hitoId); cargar()
  }

  const presupuesto   = (proyectoLocal.monto_base||0) + (proyectoLocal.monto_extra||0)
  const totalHitos    = hitos.reduce((a,h)=>a+h.monto,0)
  const disponible    = Math.max(presupuesto - totalHitos, 0)
  const totalCobrado  = hitos.reduce((a,h)=>a+(h.abonos||[]).reduce((x,ab)=>x+ab.monto,0),0)
  const totalCostos   = costos.reduce((a,c)=>a+c.monto,0)
  const totalPagado   = costos.reduce((a,c)=>a+(c.abonos||[]).reduce((x,ab)=>x+ab.monto,0),0)
  const utilidad          = totalCobrado - totalPagado
  const utilidadProyectada = totalHitos - totalCostos
  const utilidadReal       = totalCobrado - totalPagado
  const progCobro          = totalHitos>0 ? Math.min((totalCobrado/totalHitos)*100,100) : 0
  const lleno         = disponible <= 0

  function exportarExcelProyecto() {
    try {
      const XLSX_local = XLSX
      const wb = XLSX_local.utils.book_new()
      const presupuesto = (proyectoLocal.monto_base||0) + (proyectoLocal.monto_extra||0)

      // Hoja resumen
      const totalHitosAb = hitos.reduce((a,h)=>a+(h.abonos||[]).reduce((x,ab)=>x+ab.monto,0),0)
      const totalCostosAb = costos.reduce((a,c)=>a+(c.abonos||[]).reduce((x,ab)=>x+ab.monto,0),0)
      const resumenData = [
        ['DETALLE DE PROYECTO - ERP URREJOLA'],
        ['Proyecto:', proyectoLocal.nombre],
        ['Cliente:', proyectoLocal.cliente],
        ['RUT:', proyectoLocal.rut || ''],
        ['Estado:', proyectoLocal.estado],
        ['Presupuesto:', presupuesto],
        [],
        ['RESUMEN FINANCIERO'],
        ['Concepto', 'Monto'],
        ['Total hitos', hitos.reduce((a,h)=>a+h.monto,0)],
        ['Total cobrado', totalHitosAb],
        ['Total costos', costos.reduce((a,c)=>a+c.monto,0)],
        ['Total pagado (costos)', totalCostosAb],
        ['Utilidad neta', totalHitosAb - totalCostosAb],
      ]
      XLSX_local.utils.book_append_sheet(wb, XLSX_local.utils.aoa_to_sheet(resumenData), 'Resumen')

      // Hoja hitos con abonos
      const hitosData: any[][] = [
        ['HITOS DE VENTA'],
        [],
        ['ID', 'Descripción', 'Monto', 'Est. Factura', 'Est. Pago', 'Cobrado', 'Abono', 'Fecha Abono'],
      ]
      hitos.forEach(h => {
        const ab = (h.abonos||[]).reduce((a,b)=>a+b.monto,0)
        hitosData.push([h.id, h.descripcion, h.monto, h.estado_factura, h.estado_pago, ab, '', ''])
        ;(h.abonos||[]).forEach(a => {
          hitosData.push(['', '  ↳ Abono', '', '', '', '', a.monto, a.fecha])
        })
      })
      XLSX_local.utils.book_append_sheet(wb, XLSX_local.utils.aoa_to_sheet(hitosData), 'Hitos')

      // Hoja costos con pagos
      const costosData: any[][] = [
        ['COSTOS Y EGRESOS'],
        [],
        ['ID', 'Descripción', 'Categoría', 'Monto', 'Moneda', 'Est. Pago', 'Pagado', 'Fecha Pago'],
      ]
      costos.forEach(c => {
        const pg = (c.abonos||[]).reduce((a,b)=>a+b.monto,0)
        costosData.push([c.id, c.descripcion, c.categoria, c.monto, c.moneda, c.estado_pago, pg, c.fecha_pago||''])
        ;(c.abonos||[]).forEach(a => {
          costosData.push(['', '  ↳ Pago', '', '', '', '', a.monto, a.fecha])
        })
      })
      XLSX_local.utils.book_append_sheet(wb, XLSX_local.utils.aoa_to_sheet(costosData), 'Costos')

      XLSX_local.writeFile(wb, `Proyecto_${proyectoLocal.nombre.replace(/[^a-zA-Z0-9]/g,'_')}_ERP.xlsx`)
    } catch(e: any) {
      alert('Error al generar Excel: ' + e.message)
    }
  }

  async function registrarComision(colaboradorId: string, colaboradorNombre: string) {
    const presupuesto = (proyectoLocal.monto_base || 0) + (proyectoLocal.monto_extra || 0)
    const comision = Math.round(presupuesto * 0.03)
    const { error } = await supabase.from('costos').insert({
      proyecto_id: proyectoLocal.id,
      descripcion: `Comisión 3% — ${colaboradorNombre}`,
      categoria: 'Honorarios',
      monto: comision,
      moneda: proyectoLocal.moneda,
      estado_pago: 'Pendiente',
      colaborador_id: colaboradorId,
    })
    if (error) { alert('Error al registrar comisión: ' + error.message); return }
    await supabase.rpc('registrar_log', {
      p_usuario: 'sistema',
      p_accion: 'Comisión registrada',
      p_detalles: `3% de ${fmt(presupuesto, proyectoLocal.moneda)} = ${fmt(comision, proyectoLocal.moneda)} — ${colaboradorNombre}`
    })
    recargar()
  }

  function imprimirPDF(incluir: 'ambos' | 'ingresos' | 'costos') {
    const totalHitosAb = hitos.reduce((a,h)=>a+(h.abonos||[]).reduce((x,ab)=>x+ab.monto,0),0)
    const totalCostosAb = costos.reduce((a,c)=>a+(c.abonos||[]).reduce((x,ab)=>x+ab.monto,0),0)
    const presupuesto = (proyectoLocal.monto_base||0) + (proyectoLocal.monto_extra||0)

    const ingRows = incluir !== 'costos' ? hitos.map(h => {
      const ab = (h.abonos||[]).reduce((a,b)=>a+b.monto,0)
      const abonosRows = (h.abonos||[]).length > 0
        ? (h.abonos||[]).map(a => `<tr style="background:#f0f8ff"><td style="padding:3px 8px 3px 24px;color:#555;font-size:10px">↳ Abono ${a.fecha}</td><td></td><td></td><td></td><td style="text-align:right;color:#198754;font-size:10px">${fmt(a.monto,proyectoLocal.moneda)}</td></tr>`).join('')
        : ''
      return `<tr><td>${h.descripcion}</td><td style="text-align:center">${h.estado_factura}</td><td style="text-align:center">${h.estado_pago}</td><td style="text-align:right">${fmt(h.monto,proyectoLocal.moneda)}</td><td style="text-align:right;font-weight:600;color:#198754">${fmt(ab,proyectoLocal.moneda)}</td></tr>${abonosRows}`
    }).join('') : ''

    const egrRows = incluir !== 'ingresos' ? costos.map(c => {
      const pg = (c.abonos||[]).reduce((a,b)=>a+b.monto,0)
      const pagosRows = (c.abonos||[]).length > 0
        ? (c.abonos||[]).map(a => `<tr style="background:#fff5f5"><td style="padding:3px 8px 3px 24px;color:#555;font-size:10px">↳ Pago ${a.fecha}</td><td></td><td></td><td style="text-align:right;color:#842029;font-size:10px">${fmt(a.monto,c.moneda)}</td><td style="text-align:right;color:#842029;font-size:10px">${fmt(a.monto,c.moneda)}</td></tr>`).join('')
        : ''
      return `<tr><td>${c.descripcion}</td><td>${c.categoria}</td><td style="text-align:center">${c.estado_pago}</td><td style="text-align:right">${fmt(c.monto,c.moneda)}</td><td style="text-align:right;font-weight:600;color:#842029">${fmt(pg,c.moneda)}</td></tr>${pagosRows}`
    }).join('') : ''

    const win = window.open('', '_blank')!
    win.document.write(`<html><head><title>Proyecto: ${proyectoLocal.nombre}</title><style>
      body{font-family:'Segoe UI',sans-serif;padding:30px;color:#333;font-size:12px}
      img{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}
      .header{display:flex;align-items:center;gap:16px;margin-bottom:6px}
      .header img{height:40px}
      h1{color:#003366;font-size:18px;margin:0 0 2px}
      .sub{font-size:12px;color:#666;margin-bottom:20px}
      .summary{display:flex;gap:12px;margin-bottom:20px}
      .box{flex:1;padding:10px 14px;border-radius:8px;color:white}
      .box label{font-size:9px;opacity:.8;text-transform:uppercase;display:block}
      .box strong{font-size:15px}
      .box-pres{background:#003366}.box-ing{background:#198754}.box-egr{background:#d9534f}.box-uti{background:${totalHitosAb-totalCostosAb>=0?'#0f6e56':'#a71d2a'}}
      h2{color:#003366;border-left:4px solid #003366;padding-left:8px;font-size:13px;margin:20px 0 8px}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px}
      th{background:#003366;color:white;padding:6px 8px;text-align:left}
      td{padding:5px 8px;border-bottom:1px solid #eee}
      .total-row td{font-weight:700;border-top:2px solid #003366;background:#f0f4ff}
      .footer{margin-top:30px;border-top:1px solid #e0e0e0;padding-top:12px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#999}
      .footer img{height:24px;opacity:0.6}
    </style></head><body>
      <div class="header">
        <img src="https://i.imgur.com/U7FK19x.png" />
        <div><h1>${proyectoLocal.nombre}</h1><div class="sub">Cliente: ${proyectoLocal.cliente}${proyectoLocal.rut?' · RUT: '+proyectoLocal.rut:''} · Estado: ${proyectoLocal.estado}</div></div>
      </div>
      <div class="summary">
        <div class="box box-pres"><label>Presupuesto</label><strong>${fmt(presupuesto,proyectoLocal.moneda)}</strong></div>
        ${incluir!=='costos'?`<div class="box box-ing"><label>Cobrado</label><strong>${fmt(totalHitosAb,proyectoLocal.moneda)}</strong></div>`:''}
        ${incluir!=='ingresos'?`<div class="box box-egr"><label>Pagado en costos</label><strong>${fmt(totalCostosAb,proyectoLocal.moneda)}</strong></div>`:''}
        ${incluir==='ambos'?`<div class="box box-uti"><label>Utilidad neta</label><strong>${fmt(totalHitosAb-totalCostosAb,proyectoLocal.moneda)}</strong></div>`:''}
      </div>
      ${incluir!=='costos'?`<h2>HITOS DE VENTA</h2>
      <table><thead><tr><th>Descripción</th><th style="text-align:center">Est. Factura</th><th style="text-align:center">Est. Pago</th><th style="text-align:right">Monto</th><th style="text-align:right">Cobrado</th></tr></thead>
      <tbody>${ingRows||'<tr><td colspan="5" style="text-align:center;color:#999">Sin hitos</td></tr>'}</tbody>
      <tr class="total-row"><td colspan="3" style="padding:6px 8px">Total hitos</td><td style="padding:6px 8px;text-align:right">${fmt(hitos.reduce((a,h)=>a+h.monto,0),proyectoLocal.moneda)}</td><td style="padding:6px 8px;text-align:right">${fmt(totalHitosAb,proyectoLocal.moneda)}</td></tr>
      <tr style="background:#fff3cd"><td colspan="3" style="padding:6px 8px;color:#856404;font-weight:600">⏳ Por cobrar</td><td style="padding:6px 8px;text-align:right;color:#856404;font-weight:700">${fmt(hitos.reduce((a,h)=>a+h.monto,0)-totalHitosAb,proyectoLocal.moneda)}</td><td></td></tr>
      </table>`:''}
      ${incluir!=='ingresos'?`<h2>COSTOS Y EGRESOS</h2>
      <table><thead><tr><th>Descripción</th><th>Categoría</th><th style="text-align:center">Est. Pago</th><th style="text-align:right">Monto</th><th style="text-align:right">Pagado</th></tr></thead>
      <tbody>${egrRows||'<tr><td colspan="5" style="text-align:center;color:#999">Sin costos</td></tr>'}</tbody>
      <tr class="total-row"><td colspan="3" style="padding:6px 8px">Total costos</td><td style="padding:6px 8px;text-align:right">${fmt(costos.reduce((a,c)=>a+c.monto,0),proyectoLocal.moneda)}</td><td style="padding:6px 8px;text-align:right">${fmt(totalCostosAb,proyectoLocal.moneda)}</td></tr>
      <tr style="background:#fdecea"><td colspan="3" style="padding:6px 8px;color:#842029;font-weight:600">⏳ Por pagar</td><td style="padding:6px 8px;text-align:right;color:#842029;font-weight:700">${fmt(costos.reduce((a,c)=>a+c.monto,0)-totalCostosAb,proyectoLocal.moneda)}</td><td></td></tr>
      </table>`:''}
      <div class="footer">
        <div>Generado el ${new Date().toLocaleDateString('es-CL')}</div>
        <div style="display:flex;align-items:center;gap:8px">Impulsado por <strong style="color:#003366">AA&amp;C Auditores</strong> · <a href="https://aacauditores.cl" style="color:#003366">aacauditores.cl</a></div>
      </div>
      <script>window.onload=()=>{window.print();window.close()}</script>
    </body></html>`)
    win.document.close()
  }

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'16px', overflowY:'auto' }}
        onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
        <div style={{ background:'white', borderRadius:'14px', width:'100%', maxWidth:'900px', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.25)', marginBottom:'24px' }}>

          {/* Header */}
          <div style={{ background:'#003366', padding:'18px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <h4 style={{ margin:'0 0 3px', color:'white', fontSize:'18px', fontWeight:'700' }}>{proyectoLocal.nombre}</h4>
                <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'13px' }}>
                  👤 {proyectoLocal.cliente}{proyectoLocal.rut?` · ${proyectoLocal.rut}`:''}{proyectoLocal.email?` · ${proyectoLocal.email}`:''}
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'10px', background:'rgba(255,255,255,0.2)', color:'white', textTransform:'uppercase' as const }}>{proyectoLocal.estado}</span>
                <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' as const }}>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>PDF:</div>
                  {(['ambos','ingresos','costos'] as const).map(op => (
                    <button key={op} onClick={()=>imprimirPDF(op)}
                      style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.1)', color:'white', cursor:'pointer', fontWeight:'500' }}>
                      {op === 'ambos' ? '📄 Todo' : op === 'ingresos' ? '💰 Ingresos' : '📤 Costos'}
                    </button>
                  ))}
                  <div style={{ width:'1px', height:'20px', background:'rgba(255,255,255,0.2)' }} />
                  <button onClick={exportarExcelProyecto}
                    style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.15)', color:'white', cursor:'pointer', fontWeight:'600' }}>
                    📥 Excel
                  </button>

                  <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'white', width:'30px', height:'30px', borderRadius:'7px', cursor:'pointer', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                </div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px', marginTop:'14px' }}>
              {[
                { label:'Presupuesto', value:fmt(presupuesto,proyectoLocal.moneda) },
                { label:'Total hitos', value:fmt(totalHitos,proyectoLocal.moneda) },
                { label:'Cobrado', value:fmt(totalCobrado,proyectoLocal.moneda) },
                { label:'Costos', value:fmt(totalCostos,proyectoLocal.moneda) },
                { label:'Utilidad neta', value:fmt(utilidad,proyectoLocal.moneda), hl: utilidad>=0 },
              ].map(s=>(
                <div key={s.label} style={{ background: s.hl!==undefined?(s.hl?'rgba(25,135,84,0.3)':'rgba(220,53,69,0.3)'):'rgba(255,255,255,0.1)', borderRadius:'8px', padding:'8px 10px' }}>
                  <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', textTransform:'uppercase' as const, letterSpacing:'0.4px' }}>{s.label}</div>
                  <div style={{ fontSize:'13px', fontWeight:'700', color:'white' }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:'12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>
                <span>Progreso de cobro</span><span>{Math.round(progCobro)}%</span>
              </div>
              <div style={{ height:'6px', background:'rgba(255,255,255,0.2)', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progCobro}%`, background: progCobro>=100?'#198754':'#00d4ff', borderRadius:'3px', transition:'width 0.4s' }} />
              </div>
            </div>
          </div>

          <div style={{ padding:'20px 22px' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'40px', color:'#6c757d' }}>Cargando...</div>
            ) : (
              <>
                {/* Resumen */}
                <Separador titulo="📊 Resumen Financiero" />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                  {[
                    { label:'Ingresos totales (hitos)', value:fmt(totalHitos,proyectoLocal.moneda), color:'#0d47a1', bg:'#e3f2fd' },
                    { label:'Cobrado hasta ahora', value:fmt(totalCobrado,proyectoLocal.moneda), color:'#0a3622', bg:'#d1e7dd' },
                    { label:'Costos / egresos totales', value:fmt(totalCostos,proyectoLocal.moneda), color:'#842029', bg:'#fdecea' },
                    { label:'Costos pagados', value:fmt(totalPagado,proyectoLocal.moneda), color:'#842029', bg:'#f8d7da' },
                  ].map(s=>(
                    <div key={s.label} style={{ background:s.bg, borderRadius:'8px', padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:'12px', color:s.color, fontWeight:'500' }}>{s.label}</span>
                      <span style={{ fontSize:'15px', fontWeight:'700', color:s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div style={{ background: utilidadProyectada>=0?'#e8f5e9':'#fdecea', borderRadius:'8px', padding:'12px 14px', border: '1px dashed ' + (utilidadProyectada>=0?'#a5d6a7':'#ef9a9a') }}>
                    <div style={{ fontSize:'11px', fontWeight:'600', color:'#555', marginBottom:'4px' }}>📈 Utilidad Proyectada</div>
                    <div style={{ fontSize:'16px', fontWeight:'800', color: utilidadProyectada>=0?'#1b5e20':'#842029' }}>{fmt(utilidadProyectada,proyectoLocal.moneda)}</div>
                    <div style={{ fontSize:'10px', color:'#888', marginTop:'2px' }}>Total hitos − total costos</div>
                  </div>
                  <div style={{ background: utilidadReal>=0?'#d1e7dd':'#fdecea', borderRadius:'8px', padding:'12px 14px', border: '2px solid ' + (utilidadReal>=0?'#198754':'#dc3545') }}>
                    <div style={{ fontSize:'11px', fontWeight:'600', color:'#555', marginBottom:'4px' }}>💰 Utilidad Real</div>
                    <div style={{ fontSize:'16px', fontWeight:'800', color: utilidadReal>=0?'#0a3622':'#842029' }}>{fmt(utilidadReal,proyectoLocal.moneda)}</div>
                    <div style={{ fontSize:'10px', color:'#888', marginTop:'2px' }}>Cobrado − costos pagados</div>
                  </div>
                </div>

                {/* Hitos */}
                <Separador titulo="📋 Hitos de Venta" accion={
                  <div style={{ display:'flex', gap:'6px' }}>
                    <button onClick={()=>setShowAmpliar(true)}
                      style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'6px', border:'1px solid #198754', background:'white', color:'#198754', cursor:'pointer', fontWeight:'600', whiteSpace:'nowrap' as const }}>
                      💼 Ampliar presupuesto
                    </button>
                    <button onClick={()=>{ if(lleno){ alert(`Presupuesto completo (${fmt(presupuesto,proyectoLocal.moneda)}). Amplíalo primero.`); return } setShowNuevoHito(true) }}
                      style={{ fontSize:'11px', padding:'4px 12px', borderRadius:'6px', border:'none', background: lleno?'#6c757d':'#003366', color:'white', cursor: lleno?'not-allowed':'pointer', fontWeight:'600', whiteSpace:'nowrap' as const, opacity: lleno?0.7:1 }}>
                      {lleno ? '🔒 Presupuesto completo' : '+ Agregar Hito'}
                    </button>
                  </div>
                } />

                <div style={{ fontSize:'12px', color:'#6c757d', marginBottom:'12px', display:'flex', gap:'16px', flexWrap:'wrap' as const }}>
                  <span>Presupuesto: <strong style={{ color:'#003366' }}>{fmt(presupuesto,proyectoLocal.moneda)}</strong></span>
                  <span>Asignado: <strong style={{ color:'#003366' }}>{fmt(totalHitos,proyectoLocal.moneda)}</strong></span>
                  <span>Disponible: <strong style={{ color: disponible>0?'#198754':'#dc3545' }}>{fmt(disponible,proyectoLocal.moneda)}</strong></span>
                </div>

                {hitos.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'24px', color:'#6c757d', background:'#f8f9fa', borderRadius:'8px', fontSize:'13px' }}>Sin hitos. Usa el botón "Agregar Hito".</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {hitos.map(h => {
                      const ab = (h.abonos||[]).reduce((a,b)=>a+b.monto,0)
                      const pg = h.monto>0?Math.min((ab/h.monto)*100,100):0
                      return (
                        <div key={h.id} style={{ border:'1px solid #e9ecef', borderRadius:'10px', overflow:'hidden' }}>
                          <div style={{ padding:'10px 14px', background:'#fafafa' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'6px' }}>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:'13px', fontWeight:'600', color:'#003366', marginBottom:'4px' }}>{h.descripcion}</div>
                                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' as const }}>
                                  <Badge text={h.estado_factura} /><Badge text={h.estado_pago} />
                                  {h.link_factura && <a href={h.link_factura} target="_blank" rel="noopener noreferrer" style={{ fontSize:'11px', padding:'2px 7px', borderRadius:'8px', background:'#e3f2fd', color:'#0d47a1', textDecoration:'none', fontWeight:'600' }}>📎 Factura</a>}
                                </div>
                              </div>
                              <div style={{ textAlign:'right' as const, flexShrink:0 }}>
                                <div style={{ fontSize:'14px', fontWeight:'700', color:'#003366' }}>{fmt(h.monto,proyectoLocal.moneda)}</div>
                                <div style={{ fontSize:'11px', color:'#aaa' }}>Cobrado: {fmt(ab,proyectoLocal.moneda)}</div>
                              </div>
                            </div>
                            <div style={{ height:'4px', background:'#e9ecef', borderRadius:'2px', overflow:'hidden', marginBottom:'8px' }}>
                              <div style={{ height:'100%', width:`${pg}%`, background: pg>=100?'#198754':'#003366', borderRadius:'2px' }} />
                            </div>
                            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' as const, alignItems:'center' }}>
                              {h.estado_pago!=='Pagado' && <button onClick={()=>setAbonoItem({tipo:'hito',item:h})} style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'6px', border:'1px solid #198754', background:'white', color:'#198754', cursor:'pointer', fontWeight:'600' }}>+ Abonar</button>}
                              <select value={h.estado_factura} onChange={e=>actualizarEstadoFactura(h.id,e.target.value)} style={{ fontSize:'11px', padding:'3px 6px', borderRadius:'6px', border:'1px solid #d1d5db', background:'white', cursor:'pointer' }}>
                                <option>Pendiente</option><option>En Proceso Facturación</option><option>Facturado</option><option>Anulado</option>
                              </select>
                              <input defaultValue={h.link_factura||''} onBlur={e=>actualizarLink(h.id,e.target.value)} placeholder="Link factura..." style={{ fontSize:'11px', padding:'3px 8px', borderRadius:'6px', border:'1px solid #d1d5db', outline:'none', flex:1, minWidth:'130px' }} />
                              <button onClick={()=>eliminarHito(h.id)} style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'6px', border:'none', background:'#dc3545', color:'white', cursor:'pointer', marginLeft:'auto', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px' }}>✕ Eliminar hito</button>
                            </div>
                          </div>
                          {(h.abonos||[]).length>0 && (
                            <div style={{ padding:'6px 14px 10px', background:'white' }}>
                              <div style={{ fontSize:'11px', fontWeight:'700', color:'#6c757d', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'5px' }}>Abonos</div>
                              <table style={{ width:'100%', fontSize:'12px', borderCollapse:'collapse' as const }}>
                                <tbody>
                                  {(h.abonos||[]).map(a=>(
                                    <tr key={a.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                                      <td style={{ padding:'4px 6px', color:'#374151' }}>{a.fecha}</td>
                                      <td style={{ padding:'4px 6px', textAlign:'right' as const, fontWeight:'600', color:'#198754' }}>{fmt(a.monto,proyectoLocal.moneda)}</td>
                                      <td style={{ padding:'4px 6px', textAlign:'center' as const }}><button onClick={()=>eliminarAbono(a.id,'hito',h.id)} style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'5px', border:'none', background:'#dc3545', color:'white', cursor:'pointer', fontWeight:'600' }}>✕</button></td>
                                    </tr>
                                  ))}
                                  <tr style={{ borderTop:'2px solid #e9ecef', fontWeight:'700' }}>
                                    <td style={{ padding:'4px 6px' }}>Total</td>
                                    <td style={{ padding:'4px 6px', textAlign:'right' as const, color:'#198754' }}>{fmt(ab,proyectoLocal.moneda)}</td>
                                    <td />
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Costos */}
                <Separador titulo="📤 Costos y Egresos" accion={
                  <button
                    onClick={() => setShowComision(true)}
                    style={{ fontSize:'11px', padding:'4px 12px', borderRadius:'6px', border:'none', background:'linear-gradient(135deg,#6f42c1,#5a32a3)', color:'white', cursor:'pointer', fontWeight:'600' }}>
                    💜 Comisión 3%
                  </button>
                } />
                <FormNuevoCosto proyectoId={proyectoLocal.id} onSave={recargar} />
                {costos.length===0 ? (
                  <div style={{ textAlign:'center', padding:'24px', color:'#6c757d', background:'#f8f9fa', borderRadius:'8px', fontSize:'13px' }}>Sin costos registrados.</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {costos.map(c => {
                      const pg2 = (c.abonos||[]).reduce((a,b)=>a+b.monto,0)
                      const pr2 = c.monto>0?Math.min((pg2/c.monto)*100,100):0
                      return (
                        <div key={c.id} style={{ border:'1px solid #e9ecef', borderRadius:'10px', overflow:'hidden' }}>
                          <div style={{ padding:'10px 14px', background:'#fff8f8' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'6px' }}>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:'13px', fontWeight:'600', color:'#842029', marginBottom:'4px' }}>{c.descripcion}</div>
                                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' as const }}>
                                  <span style={{ fontSize:'11px', padding:'2px 7px', borderRadius:'8px', background:'#f0f0f0', color:'#555', fontWeight:'500' }}>{c.categoria}</span>
                                  <Badge text={c.estado_pago} />
                                  {c.moneda!==proyectoLocal.moneda && <span style={{ fontSize:'11px', padding:'2px 7px', borderRadius:'8px', background:'#fff3cd', color:'#856404', fontWeight:'500' }}>{c.moneda}</span>}
                                </div>
                              </div>
                              <div style={{ textAlign:'right' as const, flexShrink:0 }}>
                                <div style={{ fontSize:'14px', fontWeight:'700', color:'#842029' }}>{fmt(c.monto,c.moneda)}</div>
                                <div style={{ fontSize:'11px', color:'#aaa' }}>Pagado: {fmt(pg2,c.moneda)}</div>
                              </div>
                            </div>
                            <div style={{ height:'4px', background:'#e9ecef', borderRadius:'2px', overflow:'hidden', marginBottom:'8px' }}>
                              <div style={{ height:'100%', width:`${pr2}%`, background: pr2>=100?'#198754':'#dc3545', borderRadius:'2px' }} />
                            </div>
                            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                              {c.estado_pago!=='Pagado' && <button onClick={()=>setAbonoItem({tipo:'costo',item:c})} style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'6px', border:'1px solid #842029', background:'white', color:'#842029', cursor:'pointer', fontWeight:'600' }}>+ Pagar</button>}
                              <span style={{ fontSize:'11px', color:'#aaa' }}>{c.created_at?.split('T')[0]}</span>
                              <button onClick={()=>eliminarCosto(c.id)} style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'6px', border:'none', background:'#dc3545', color:'white', cursor:'pointer', marginLeft:'auto', fontWeight:'600', display:'flex', alignItems:'center', gap:'4px' }}>✕ Eliminar costo</button>
                            </div>
                          </div>
                          {(c.abonos||[]).length>0 && (
                            <div style={{ padding:'6px 14px 10px', background:'white' }}>
                              <div style={{ fontSize:'11px', fontWeight:'700', color:'#6c757d', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'5px' }}>Pagos</div>
                              <table style={{ width:'100%', fontSize:'12px', borderCollapse:'collapse' as const }}>
                                <tbody>
                                  {(c.abonos||[]).map(a=>(
                                    <tr key={a.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                                      <td style={{ padding:'4px 6px', color:'#374151' }}>{a.fecha}</td>
                                      <td style={{ padding:'4px 6px', textAlign:'right' as const, fontWeight:'600', color:'#842029' }}>{fmt(a.monto,c.moneda)}</td>
                                      <td style={{ padding:'4px 6px', textAlign:'center' as const }}><button onClick={()=>eliminarAbono(a.id,'costo',c.id)} style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'5px', border:'none', background:'#dc3545', color:'white', cursor:'pointer', fontWeight:'600' }}>✕</button></td>
                                    </tr>
                                  ))}
                                  <tr style={{ borderTop:'2px solid #e9ecef', fontWeight:'700' }}>
                                    <td style={{ padding:'4px 6px' }}>Total</td>
                                    <td style={{ padding:'4px 6px', textAlign:'right' as const, color:'#842029' }}>{fmt(pg2,c.moneda)}</td>
                                    <td />
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showComision && proyectoLocal && (
        <ModalComision
          presupuesto={(proyectoLocal.monto_base||0)+(proyectoLocal.monto_extra||0)}
          moneda={proyectoLocal.moneda}
          colaboradores={colaboradores}
          onClose={()=>setShowComision(false)}
          onConfirm={(colabId, colabNombre) => { registrarComision(colabId, colabNombre); setShowComision(false) }}
        />
      )}
      {showNuevoHito && <ModalNuevoHito proyectoId={proyectoLocal.id} moneda={proyectoLocal.moneda} disponible={disponible} onClose={()=>setShowNuevoHito(false)} onSave={recargar} />}
      {showAmpliar && <ModalAmpliarPresupuesto proyecto={proyectoLocal} onClose={()=>setShowAmpliar(false)} onSave={recargar} />}
      {abonoItem && <ModalAbono tipo={abonoItem.tipo} item={abonoItem.item} moneda={proyectoLocal.moneda} onClose={()=>setAbonoItem(null)} onSave={recargar} />}
    </>
    {showEnviarFacturas && proyectoLocal && (
      <ModalEnviarFacturas
        proyecto={{ id: proyectoLocal.id, nombre: proyectoLocal.nombre, cliente: proyectoLocal.cliente, email: proyectoLocal.email || '', moneda: proyectoLocal.moneda }}
        hitos={hitos}
        usuarioEmail={usuarioEmail}
        onClose={() => setShowEnviarFacturas(false)}
      />
    )}
  )
}