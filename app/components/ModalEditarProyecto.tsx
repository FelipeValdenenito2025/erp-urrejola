'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

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
  estado: string
}

export default function ModalEditarProyecto({ proyecto, onClose, onSave }:
  { proyecto: Proyecto, onClose: () => void, onSave: () => void }) {

  const [form, setForm] = useState({
    nombre:    proyecto.nombre    || '',
    cliente:   proyecto.cliente   || '',
    rut:       proyecto.rut       || '',
    email:     proyecto.email     || '',
    contacto:  proyecto.contacto  || '',
    moneda:    proyecto.moneda    || 'CLP',
    monto_base: String(proyecto.monto_base || 0),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: any) {
    e.preventDefault()
    if (!form.nombre || !form.cliente) { setError('Nombre y cliente son obligatorios.'); return }
    setLoading(true)
    const { error } = await supabase.from('proyectos').update({
      nombre:     form.nombre,
      cliente:    form.cliente,
      rut:        form.rut,
      email:      form.email,
      contacto:   form.contacto,
      moneda:     form.moneda,
      monto_base: parseFloat(form.monto_base) || 0,
    }).eq('id', proyecto.id)

    if (error) { setError('Error: ' + error.message); setLoading(false); return }
    onSave(); onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'white', borderRadius:'12px', width:'100%', maxWidth:'540px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ background:'#003366', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h5 style={{ margin:0, color:'white', fontSize:'16px', fontWeight:'600' }}>✏ Editar Proyecto</h5>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px' }}>
          {error && (
            <div style={{ background:'#fdecea', border:'1px solid #f5c6cb', borderRadius:'8px', padding:'10px 14px', color:'#842029', fontSize:'13px', marginBottom:'16px' }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            {[
              { label:'Nombre del proyecto *', key:'nombre',   span:2 },
              { label:'Cliente *',             key:'cliente'          },
              { label:'RUT',                   key:'rut'              },
              { label:'Email',                 key:'email',   type:'email' },
              { label:'Contacto',              key:'contacto'         },
            ].map((f: any) => (
              <div key={f.key} style={{ gridColumn: f.span === 2 ? 'span 2' : undefined }}>
                <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>{f.label}</label>
                <input
                  type={f.type || 'text'}
                  value={(form as any)[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  style={{ width:'100%', padding:'8px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }}
                />
              </div>
            ))}

            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Moneda</label>
              <select value={form.moneda} onChange={e => set('moneda', e.target.value)}
                style={{ width:'100%', padding:'8px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none' }}>
                <option>CLP</option><option>USD</option><option>UF</option>
              </select>
            </div>

            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Monto Base</label>
              <input type="number" value={form.monto_base} onChange={e => set('monto_base', e.target.value)}
                style={{ width:'100%', padding:'8px 12px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
            </div>
          </div>

          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px' }}>
            <button type="button" onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:'8px', border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontSize:'14px' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              style={{ padding:'9px 20px', borderRadius:'8px', border:'none', background:'#003366', color:'white', cursor:'pointer', fontSize:'14px', fontWeight:'600' }}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
