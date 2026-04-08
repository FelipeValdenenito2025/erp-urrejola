'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type HitoPendiente = {
  id: string
  descripcion: string
  monto: number
  estado_factura: string
  proyecto_id: string
  nombre_proyecto: string
  cliente: string
  rut: string
  email_cliente: string
  moneda: string
}

type Solicitud = {
  id: string
  hito_id: string
  tipo_doc: string
  monto: number
  glosa: string
  estado: string
  usuario_solicita: string
  created_at: string
  nombre_proyecto?: string
  descripcion_hito?: string
}

const fmt = (n: number, m = 'CLP') =>
  m === 'USD' ? 'USD ' + (n||0).toLocaleString('es-CL') : '$' + (n||0).toLocaleString('es-CL')

function ModalSolicitud({ hito, usuarioEmail, onClose, onSave }:
  { hito: HitoPendiente, usuarioEmail: string, onClose: () => void, onSave: () => void }) {

  const [form, setForm] = useState({
    tipo_doc:     'Factura Electrónica',
    monto:        String(hito.monto),
    glosa:        hito.descripcion,
    cliente:      hito.cliente,
    rut:          hito.rut,
    email_cliente: hito.email_cliente,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function enviar(e: any) {
    e.preventDefault()
    if (!form.monto || parseFloat(form.monto) <= 0) { setError('El monto debe ser mayor a 0.'); return }
    if (!form.glosa) { setError('La glosa es obligatoria.'); return }
    setLoading(true)
    setError('')

    try {
      const { error: dbError } = await supabase.from('facturacion').insert({
        hito_id:          hito.id,
        tipo_doc:         form.tipo_doc,
        monto:            parseFloat(form.monto),
        glosa:            form.glosa,
        estado:           'Solicitado',
        usuario_solicita: usuarioEmail,
      })
      if (dbError) throw new Error(dbError.message)

      await supabase.from('hitos').update({ estado_factura: 'En Proceso Facturación' }).eq('id', hito.id)

      const res = await fetch('/api/enviar-factura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitud: {
            id_hito:          hito.id,
            nombre_proyecto:  hito.nombre_proyecto,
            descripcion_hito: hito.descripcion,
            cliente:          form.cliente,
            rut:              form.rut,
            email_cliente:    form.email_cliente,
            tipo_doc:         form.tipo_doc,
            monto:            parseFloat(form.monto),
            glosa:            form.glosa,
          },
          usuarioEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar email')

      await supabase.rpc('registrar_log', {
        p_usuario: usuarioEmail,
        p_accion: 'Solicitud Facturación',
        p_detalles: `${form.tipo_doc} - ${hito.nombre_proyecto} - ${fmt(parseFloat(form.monto))}`
      })

      onSave()
      onClose()
    } catch(err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', overflowY:'auto' }}>
      <div style={{ background:'white', borderRadius:'14px', width:'100%', maxWidth:'560px', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.25)', margin:'auto' }}>
        <div style={{ background:'#003366', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h5 style={{ margin:0, color:'white', fontSize:'16px', fontWeight:'700' }}>📄 Solicitar Emisión de Documento</h5>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'12px', marginTop:'2px' }}>{hito.nombre_proyecto} · {hito.descripcion}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        <form onSubmit={enviar} style={{ padding:'20px' }}>
          {error && (
            <div style={{ background:'#fdecea', border:'1px solid #f5c6cb', borderRadius:'8px', padding:'10px 14px', color:'#842029', fontSize:'13px', marginBottom:'16px' }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ background:'#e3f2fd', borderRadius:'8px', padding:'12px 14px', marginBottom:'18px' }}>
            <div style={{ fontSize:'12px', fontWeight:'700', color:'#0d47a1', marginBottom:'6px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>Hito a facturar</div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'13px', color:'#003366', fontWeight:'600' }}>{hito.descripcion}</span>
              <span style={{ fontSize:'15px', fontWeight:'800', color:'#003366' }}>{fmt(hito.monto, hito.moneda)}</span>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div style={{ gridColumn:'span 2' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Tipo de Documento *</label>
              <div style={{ display:'flex', gap:'10px' }}>
                {['Factura Electrónica', 'Boleta Electrónica'].map(tipo => (
                  <label key={tipo} style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', border:`2px solid ${form.tipo_doc===tipo?'#003366':'#e9ecef'}`, borderRadius:'8px', cursor:'pointer', background: form.tipo_doc===tipo?'#e3f2fd':'white', transition:'all 0.2s' }}>
                    <input type="radio" name="tipo_doc" value={tipo} checked={form.tipo_doc===tipo} onChange={e=>set('tipo_doc',e.target.value)} style={{ accentColor:'#003366' }} />
                    <div style={{ fontSize:'13px', fontWeight:'600', color: form.tipo_doc===tipo?'#003366':'#374151' }}>{tipo}</div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Monto Bruto/Neto *</label>
              <input type="number" value={form.monto} onChange={e=>set('monto',e.target.value)}
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const, fontWeight:'600' }} />
            </div>

            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Glosa / Descripción *</label>
              <input value={form.glosa} onChange={e=>set('glosa',e.target.value)} placeholder="Descripción del servicio..."
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>

            <div style={{ gridColumn:'span 2', borderTop:'1px solid #e9ecef', paddingTop:'14px', marginTop:'2px' }}>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#6c757d', textTransform:'uppercase' as const, letterSpacing:'0.5px', marginBottom:'12px' }}>Datos del Cliente</div>
            </div>

            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Nombre / Razón Social</label>
              <input value={form.cliente} onChange={e=>set('cliente',e.target.value)}
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>

            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>RUT</label>
              <input value={form.rut} onChange={e=>set('rut',e.target.value)} placeholder="12.345.678-9"
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>

            <div style={{ gridColumn:'span 2' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Email del Cliente</label>
              <input type="email" value={form.email_cliente} onChange={e=>set('email_cliente',e.target.value)} placeholder="cliente@email.com"
                style={{ width:'100%', padding:'9px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
          </div>

          <div style={{ background:'#f8f9fa', borderRadius:'8px', padding:'10px 14px', marginTop:'16px', fontSize:'12px', color:'#6c757d', display:'flex', gap:'8px', alignItems:'flex-start' }}>
            <span style={{ fontSize:'16px' }}>📧</span>
            <div>Se enviará una solicitud a <strong>fvaldebenito@aacadvisory.cl</strong> con copia a <strong>{usuarioEmail}</strong></div>
          </div>

          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px' }}>
            <button type="button" onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:'8px', border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontSize:'14px' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              style={{ padding:'9px 24px', borderRadius:'8px', border:'none', background: loading?'#6b8db5':'#003366', color:'white', cursor: loading?'not-allowed':'pointer', fontSize:'14px', fontWeight:'700' }}>
              {loading ? '⏳ Enviando...' : '📤 Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Facturacion({ usuarioEmail }: { usuarioEmail: string }) {
  const [hitosPendientes, setHitosPendientes] = useState<HitoPendiente[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [hitoSeleccionado, setHitoSeleccionado] = useState<HitoPendiente | null>(null)
  const [tab, setTab] = useState<'pendientes'|'historial'>('pendientes')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)

    const { data: hitos } = await supabase
      .from('hitos')
      .select('*, proyectos(nombre, cliente, rut, email, moneda)')
      .in('estado_factura', ['Pendiente', 'En Proceso Facturación'])
      .order('created_at', { ascending: false })

    if (hitos) {
      setHitosPendientes(hitos.map((h: any) => ({
        id:              h.id,
        descripcion:     h.descripcion,
        monto:           h.monto,
        estado_factura:  h.estado_factura,
        proyecto_id:     h.proyecto_id,
        nombre_proyecto: h.proyectos?.nombre || '',
        cliente:         h.proyectos?.cliente || '',
        rut:             h.proyectos?.rut || '',
        email_cliente:   h.proyectos?.email || '',
        moneda:          h.proyectos?.moneda || 'CLP',
      })))
    }

    const { data: solic } = await supabase
      .from('facturacion')
      .select('*, hitos(descripcion, proyectos(nombre))')
      .order('created_at', { ascending: false })
      .limit(50)

    if (solic) {
      setSolicitudes(solic.map((s: any) => ({
        ...s,
        nombre_proyecto:  s.hitos?.proyectos?.nombre || '',
        descripcion_hito: s.hitos?.descripcion || '',
      })))
    }

    setLoading(false)
  }

  const pendientes = hitosPendientes.filter(h => h.estado_factura === 'Pendiente')
  const enProceso  = hitosPendientes.filter(h => h.estado_factura === 'En Proceso Facturación')

  // Agrupar por proyecto
  const pendientesPorProyecto = pendientes.reduce((acc, h) => {
    if (!acc[h.proyecto_id]) acc[h.proyecto_id] = { nombre: h.nombre_proyecto, cliente: h.cliente, rut: h.rut, moneda: h.moneda, hitos: [] }
    acc[h.proyecto_id].hitos.push(h)
    return acc
  }, {} as Record<string, { nombre: string, cliente: string, rut: string, moneda: string, hitos: HitoPendiente[] }>)

  const enProcesoPorProyecto = enProceso.reduce((acc, h) => {
    if (!acc[h.proyecto_id]) acc[h.proyecto_id] = { nombre: h.nombre_proyecto, cliente: h.cliente, rut: h.rut, moneda: h.moneda, hitos: [] }
    acc[h.proyecto_id].hitos.push(h)
    return acc
  }, {} as Record<string, { nombre: string, cliente: string, rut: string, moneda: string, hitos: HitoPendiente[] }>)

  const estadoBadge: any = {
    'Solicitado': { bg:'#fff3cd', c:'#856404' },
    'En Proceso': { bg:'#cff4fc', c:'#055160' },
    'Emitido':    { bg:'#d1e7dd', c:'#0a3622' },
    'Anulado':    { bg:'#f8d7da', c:'#58151c' },
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'16px', background:'white', borderRadius:'10px', padding:'4px', border:'1px solid #eee', width:'fit-content' }}>
        {[
          { id:'pendientes', label:`📋 Hitos por Facturar (${pendientes.length})` },
          { id:'historial',  label:`📜 Historial (${solicitudes.length})` },
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id as any)} style={{
            padding:'7px 16px', borderRadius:'7px', border:'none', cursor:'pointer',
            fontSize:'13px', fontWeight: tab===t.id?'700':'400',
            background: tab===t.id?'#003366':'transparent',
            color: tab===t.id?'white':'#6c757d',
            transition:'all 0.2s'
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color:'#6c757d' }}>Cargando...</div>
      ) : tab === 'pendientes' ? (
        <>
          {/* En proceso agrupado */}
          {Object.keys(enProcesoPorProyecto).length > 0 && (
            <div style={{ marginBottom:'20px' }}>
              <div style={{ fontSize:'13px', fontWeight:'700', color:'#055160', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ background:'#cff4fc', color:'#055160', padding:'2px 8px', borderRadius:'6px', fontSize:'11px' }}>En proceso</span>
                {enProceso.length} hito{enProceso.length!==1?'s':''} con solicitud enviada
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {Object.entries(enProcesoPorProyecto).map(([pid, grupo]) => (
                  <div key={pid} style={{ background:'white', borderRadius:'12px', border:'1px solid #cff4fc', overflow:'hidden', opacity:0.85 }}>
                    {/* Header tarjeta proyecto */}
                    <div style={{ background:'#e8f9fc', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #cff4fc' }}>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:'700', color:'#055160' }}>📁 {grupo.nombre}</div>
                        <div style={{ fontSize:'11px', color:'#6c757d', marginTop:'1px' }}>👤 {grupo.cliente}{grupo.rut ? ` · ${grupo.rut}` : ''}</div>
                      </div>
                      <div style={{ fontSize:'12px', fontWeight:'700', color:'#055160' }}>
                        {fmt(grupo.hitos.reduce((a, h) => a + h.monto, 0), grupo.moneda)}
                      </div>
                    </div>
                    {/* Hitos del proyecto */}
                    {grupo.hitos.map((h, idx) => (
                      <div key={h.id} style={{ padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: idx < grupo.hitos.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ fontSize:'13px', color:'#055160', fontWeight:'500' }}>{h.descripcion}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <div style={{ fontSize:'13px', fontWeight:'700', color:'#055160' }}>{fmt(h.monto, h.moneda)}</div>
                          <span style={{ fontSize:'11px', color:'#aaa' }}>Solicitud enviada</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pendientes agrupados por proyecto */}
          {Object.keys(pendientesPorProyecto).length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px', background:'white', borderRadius:'12px', border:'1px solid #eee', color:'#6c757d' }}>
              <div style={{ fontSize:'52px', marginBottom:'14px' }}>✅</div>
              <h3 style={{ color:'#003366', marginBottom:'6px' }}>Todo al día</h3>
              <p style={{ fontSize:'13px' }}>No hay hitos pendientes de facturar.</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize:'13px', fontWeight:'700', color:'#003366', marginBottom:'10px' }}>
                {pendientes.length} hito{pendientes.length!==1?'s':''} pendiente{pendientes.length!==1?'s':''} de facturar · {Object.keys(pendientesPorProyecto).length} proyecto{Object.keys(pendientesPorProyecto).length!==1?'s':''}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {Object.entries(pendientesPorProyecto).map(([pid, grupo]) => (
                  <div key={pid} style={{ background:'white', borderRadius:'12px', border:'1px solid #e9ecef', overflow:'hidden', boxShadow:'0 2px 6px rgba(0,0,0,0.04)' }}>
                    {/* Header tarjeta proyecto */}
                    <div style={{ background:'#f0f4ff', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #e2e8f8' }}>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:'700', color:'#003366' }}>📁 {grupo.nombre}</div>
                        <div style={{ fontSize:'11px', color:'#6c757d', marginTop:'1px' }}>👤 {grupo.cliente}{grupo.rut ? ` · ${grupo.rut}` : ''}</div>
                      </div>
                      <div style={{ textAlign:'right' as const }}>
                        <div style={{ fontSize:'13px', fontWeight:'700', color:'#003366' }}>{fmt(grupo.hitos.reduce((a, h) => a + h.monto, 0), grupo.moneda)}</div>
                        <div style={{ fontSize:'11px', color:'#aaa' }}>{grupo.hitos.length} hito{grupo.hitos.length!==1?'s':''}</div>
                      </div>
                    </div>
                    {/* Hitos del proyecto */}
                    {grupo.hitos.map((h, idx) => (
                      <div key={h.id} style={{ padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: idx < grupo.hitos.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='#fafafa')}
                        onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                        <div style={{ fontSize:'13px', color:'#374151', fontWeight:'500' }}>{h.descripcion}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
                          <div style={{ textAlign:'right' as const }}>
                            <div style={{ fontSize:'14px', fontWeight:'800', color:'#003366' }}>{fmt(h.monto, h.moneda)}</div>
                            <div style={{ fontSize:'11px', color:'#aaa' }}>{h.moneda}</div>
                          </div>
                          <button onClick={()=>setHitoSeleccionado(h)}
                            style={{ padding:'7px 14px', background:'#003366', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'700', whiteSpace:'nowrap' as const }}>
                            📄 Solicitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        /* Historial */
        solicitudes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px', background:'white', borderRadius:'12px', border:'1px solid #eee', color:'#6c757d' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>📜</div>
            <p style={{ fontSize:'13px' }}>Sin solicitudes enviadas aún.</p>
          </div>
        ) : (
          <div style={{ background:'white', borderRadius:'12px', border:'1px solid #eee', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', background:'#f8f9fa', padding:'10px 16px', borderBottom:'1px solid #e9ecef' }}>
              {['Proyecto / Hito','Tipo Doc','Monto','Solicitado por','Estado'].map(h=>(
                <div key={h} style={{ fontSize:'11px', fontWeight:'700', color:'#6c757d', textTransform:'uppercase' as const, letterSpacing:'0.4px' }}>{h}</div>
              ))}
            </div>
            {solicitudes.map((s, idx) => {
              const badge = estadoBadge[s.estado] || { bg:'#f0f0f0', c:'#555' }
              return (
                <div key={s.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'12px 16px', borderBottom: idx<solicitudes.length-1?'1px solid #f0f0f0':'none', alignItems:'center' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='#f8f9fa')}
                  onMouseLeave={e=>(e.currentTarget.style.background='white')}>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#003366' }}>{s.nombre_proyecto}</div>
                    <div style={{ fontSize:'11px', color:'#6c757d' }}>{s.descripcion_hito}</div>
                  </div>
                  <div style={{ fontSize:'12px', color:'#374151' }}>{s.tipo_doc}</div>
                  <div style={{ fontSize:'13px', fontWeight:'700', color:'#003366' }}>{fmt(s.monto)}</div>
                  <div style={{ fontSize:'11px', color:'#6c757d' }}>{s.usuario_solicita}<br/>{new Date(s.created_at).toLocaleDateString('es-CL')}</div>
                  <div>
                    <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'10px', background:badge.bg, color:badge.c }}>{s.estado}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {hitoSeleccionado && (
        <ModalSolicitud
          hito={hitoSeleccionado}
          usuarioEmail={usuarioEmail}
          onClose={()=>setHitoSeleccionado(null)}
          onSave={cargar}
        />
      )}
    </div>
  )
}