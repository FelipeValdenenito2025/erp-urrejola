'use client'

import { useState } from 'react'

const ADMINS = ['fvaldebenito@aacadvisory.cl', 'vjimenez@aacadvisory.cl']

type Hito = {
  id: string
  descripcion: string
  monto: number
  estado_factura: string
  link_factura: string | null
}

type Proyecto = {
  id: string
  nombre: string
  cliente: string
  email: string
  moneda: string
}

type Props = {
  proyecto: Proyecto
  hitos: Hito[]
  usuarioEmail: string
  onClose: () => void
}

const fmt = (n: number) => '$' + (n || 0).toLocaleString('es-CL')

export default function ModalEnviarFacturas({ proyecto, hitos, usuarioEmail, onClose }: Props) {
  // Solo hitos con link de factura cargado
  const hitosDisponibles = hitos.filter(h => h.link_factura && h.link_factura.trim() !== '')

  const [seleccionados, setSeleccionados] = useState<string[]>(hitosDisponibles.map(h => h.id))
  const [emailDestino, setEmailDestino] = useState(proyecto.email || '')
  const [nombreDestino, setNombreDestino] = useState(proyecto.cliente || '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  // Solo admin puede usar esto
  if (!ADMINS.includes(usuarioEmail)) return null

  function toggleSeleccion(id: string) {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function enviar() {
    if (seleccionados.length === 0) { setError('Selecciona al menos un documento.'); return }
    if (!emailDestino) { setError('El email del destinatario es obligatorio.'); return }
    setEnviando(true)
    setError('')

    try {
      const hitosEnviar = hitosDisponibles
        .filter(h => seleccionados.includes(h.id))
        .map(h => ({ descripcion: h.descripcion, monto: h.monto, link_factura: h.link_factura }))

      const res = await fetch('/api/enviar-facturas-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proyecto: { nombre: proyecto.nombre, cliente: proyecto.cliente },
          hitos: hitosEnviar,
          emailDestino,
          nombreDestino,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      setEnviado(true)
      setTimeout(() => onClose(), 3000)
    } catch (e: any) {
      setError(e.message)
    }
    setEnviando(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'white', borderRadius:'14px', width:'100%', maxWidth:'560px', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ background:'#003366', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h5 style={{ margin:0, color:'white', fontSize:'15px', fontWeight:'700' }}>📨 Enviar Facturas al Cliente</h5>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'12px', marginTop:'2px' }}>{proyecto.nombre} · {proyecto.cliente}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer' }}>×</button>
        </div>

        <div style={{ padding:'20px' }}>
          {enviado ? (
            <div style={{ textAlign:'center', padding:'30px 20px' }}>
              <div style={{ fontSize:'48px', marginBottom:'12px' }}>✅</div>
              <div style={{ fontSize:'15px', fontWeight:'700', color:'#003366', marginBottom:'6px' }}>¡Documentos enviados!</div>
              <div style={{ fontSize:'13px', color:'#6c757d' }}>El correo fue enviado a <strong>{emailDestino}</strong></div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background:'#fdecea', border:'1px solid #f5c6cb', borderRadius:'8px', padding:'10px 14px', color:'#842029', fontSize:'13px', marginBottom:'16px' }}>
                  ⚠ {error}
                </div>
              )}

              {hitosDisponibles.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px', color:'#6c757d', fontSize:'13px' }}>
                  <div style={{ fontSize:'36px', marginBottom:'12px' }}>📭</div>
                  No hay hitos con link de factura cargado en este proyecto.
                </div>
              ) : (
                <>
                  {/* Selección de documentos */}
                  <div style={{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'8px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>
                    Seleccionar documentos a enviar
                  </div>
                  <div style={{ border:'1px solid #e9ecef', borderRadius:'8px', overflow:'hidden', marginBottom:'16px' }}>
                    {hitosDisponibles.map((h, idx) => (
                      <label key={h.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderBottom: idx < hitosDisponibles.length-1 ? '1px solid #f0f0f0' : 'none', cursor:'pointer', background: seleccionados.includes(h.id) ? '#f0f4ff' : 'white', transition:'background 0.15s' }}>
                        <input type="checkbox" checked={seleccionados.includes(h.id)} onChange={() => toggleSeleccion(h.id)}
                          style={{ width:'16px', height:'16px', accentColor:'#003366', cursor:'pointer', flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'13px', fontWeight:'600', color:'#003366' }}>{h.descripcion}</div>
                          <div style={{ fontSize:'11px', color:'#6c757d', marginTop:'2px' }}>
                            {fmt(h.monto)} ·
                            <a href={h.link_factura!} target="_blank" rel="noreferrer"
                              style={{ color:'#003366', textDecoration:'none', marginLeft:'4px' }}>
                              📎 Ver link
                            </a>
                          </div>
                        </div>
                        <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:'#d1e7dd', color:'#0a3622', fontWeight:'600', flexShrink:0 }}>
                          {h.estado_factura}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Total seleccionado */}
                  {seleccionados.length > 0 && (
                    <div style={{ background:'#e3f2fd', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', display:'flex', justifyContent:'space-between', fontSize:'13px' }}>
                      <span style={{ color:'#0d47a1' }}><strong>{seleccionados.length}</strong> documento{seleccionados.length !== 1 ? 's' : ''} seleccionado{seleccionados.length !== 1 ? 's' : ''}</span>
                      <span style={{ fontWeight:'700', color:'#003366' }}>
                        {fmt(hitosDisponibles.filter(h => seleccionados.includes(h.id)).reduce((a, h) => a + h.monto, 0))}
                      </span>
                    </div>
                  )}

                  {/* Datos del destinatario */}
                  <div style={{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'8px', textTransform:'uppercase' as const, letterSpacing:'0.5px' }}>
                    Datos del destinatario
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Nombre</label>
                      <input value={nombreDestino} onChange={e => setNombreDestino(e.target.value)}
                        placeholder="Nombre del destinatario"
                        style={{ width:'100%', padding:'8px 12px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#374151', marginBottom:'4px' }}>Email *</label>
                      <input type="email" value={emailDestino} onChange={e => setEmailDestino(e.target.value)}
                        placeholder="cliente@email.com"
                        style={{ width:'100%', padding:'8px 12px', fontSize:'13px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none', boxSizing:'border-box' as const }} />
                    </div>
                  </div>

                  {/* Aviso */}
                  <div style={{ background:'#f8f9fa', borderRadius:'8px', padding:'10px 14px', fontSize:'12px', color:'#6c757d', marginBottom:'16px' }}>
                    📧 El correo saldrá desde <strong>erp@aacadvisory.cl</strong> con copia a <strong>fvaldebenito@aacadvisory.cl</strong>
                  </div>

                  {/* Botones */}
                  <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                    <button onClick={onClose}
                      style={{ padding:'9px 20px', borderRadius:'8px', border:'1px solid #d1d5db', background:'white', cursor:'pointer', fontSize:'14px', color:'#374151' }}>
                      Cancelar
                    </button>
                    <button onClick={enviar} disabled={enviando || seleccionados.length === 0}
                      style={{ padding:'9px 24px', borderRadius:'8px', border:'none', background: enviando || seleccionados.length === 0 ? '#9db4cc' : '#003366', color:'white', cursor: enviando || seleccionados.length === 0 ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:'700' }}>
                      {enviando ? '⏳ Enviando...' : `📨 Enviar ${seleccionados.length > 0 ? `(${seleccionados.length})` : ''}`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
