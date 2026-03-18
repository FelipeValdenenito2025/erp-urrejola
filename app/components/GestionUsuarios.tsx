'use client'

import { useEffect, useState } from 'react'
import { confirmar } from './Dialog'

const ADMIN_EMAIL = 'fvaldebenito@aacadvisory.cl'

type Usuario = {
  id: string
  email: string
  created_at: string
  last_sign_in: string | null
  confirmed: boolean
  banned: boolean
}

export default function GestionUsuarios({ usuarioEmail }: { usuarioEmail: string }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [emailInvitar, setEmailInvitar] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)

  // Solo el admin puede acceder
  const esAdmin = usuarioEmail === ADMIN_EMAIL

  useEffect(() => {
    if (esAdmin) cargar()
  }, [esAdmin])

  async function cargar() {
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUsuarios(data.users)
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message })
    }
    setLoading(false)
  }

  async function invitar(e: any) {
    e.preventDefault()
    if (!emailInvitar) return
    setEnviando(true)
    setMensaje(null)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', email: emailInvitar }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMensaje({ tipo: 'success', texto: `Invitación enviada a ${emailInvitar}` })
      setEmailInvitar('')
      cargar()
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message })
    }
    setEnviando(false)
  }

  async function accion(tipo: 'delete' | 'ban' | 'unban', usuario: Usuario) {
    const mensajes: any = {
      delete: `¿Eliminar permanentemente a ${usuario.email}? Esta acción no se puede deshacer.`,
      ban:    `¿Desactivar el acceso de ${usuario.email}?`,
      unban:  `¿Reactivar el acceso de ${usuario.email}?`,
    }
    const ok = await confirmar({ titulo: tipo === 'delete' ? 'Eliminar usuario' : tipo === 'ban' ? 'Desactivar usuario' : 'Reactivar usuario', mensaje: mensajes[tipo], labelConfirmar: tipo === 'delete' ? '✕ Eliminar' : tipo === 'ban' ? '⊘ Desactivar' : '✓ Reactivar' })
    if (!ok) return

    setMensaje(null)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: tipo, email: usuario.email, userId: usuario.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const textos: any = { delete: 'eliminado', ban: 'desactivado', unban: 'reactivado' }
      setMensaje({ tipo: 'success', texto: `Usuario ${textos[tipo]} correctamente.` })
      cargar()
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message })
    }
  }

  function formatFecha(fecha: string | null) {
    if (!fecha) return '—'
    const d = new Date(fecha)
    return d.toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' }) +
           ' · ' + d.toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' })
  }

  // Si no es admin mostrar acceso denegado
  if (!esAdmin) return (
    <div style={{ textAlign:'center', padding:'80px 20px', background:'white', borderRadius:'12px', border:'1px solid #eee' }}>
      <div style={{ fontSize:'52px', marginBottom:'16px' }}>🔒</div>
      <h3 style={{ color:'#003366', marginBottom:'8px' }}>Acceso restringido</h3>
      <p style={{ color:'#6c757d', fontSize:'14px' }}>Solo el administrador puede gestionar usuarios.</p>
    </div>
  )

  return (
    <div>
      {/* Invitar usuario */}
      <div style={{ background:'white', borderRadius:'12px', padding:'20px', marginBottom:'16px', border:'1px solid #eee' }}>
        <div style={{ fontSize:'14px', fontWeight:'700', color:'#003366', marginBottom:'14px' }}>
          ✉ Invitar nuevo usuario
        </div>
        <div style={{ fontSize:'13px', color:'#6c757d', marginBottom:'14px' }}>
          Supabase enviará un email de invitación automáticamente. El usuario podrá crear su contraseña desde el link del correo.
        </div>

        {mensaje && (
          <div style={{ background: mensaje.tipo==='success'?'#d1e7dd':'#fdecea', border: `1px solid ${mensaje.tipo==='success'?'#a3cfbb':'#f5c6cb'}`, borderRadius:'8px', padding:'10px 14px', color: mensaje.tipo==='success'?'#0a3622':'#842029', fontSize:'13px', marginBottom:'14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>{mensaje.tipo==='success'?'✅':'⚠'} {mensaje.texto}</span>
            <button onClick={()=>setMensaje(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:'inherit', opacity:0.6 }}>×</button>
          </div>
        )}

        <form onSubmit={invitar} style={{ display:'flex', gap:'10px' }}>
          <input
            type="email"
            value={emailInvitar}
            onChange={e=>setEmailInvitar(e.target.value)}
            placeholder="correo@empresa.com"
            required
            style={{ flex:1, padding:'9px 14px', fontSize:'14px', border:'1px solid #d1d5db', borderRadius:'8px', outline:'none' }}
          />
          <button type="submit" disabled={enviando}
            style={{ padding:'9px 24px', background: enviando?'#6b8db5':'#003366', color:'white', border:'none', borderRadius:'8px', cursor: enviando?'not-allowed':'pointer', fontSize:'14px', fontWeight:'600', whiteSpace:'nowrap' as const }}>
            {enviando ? '⏳ Enviando...' : '📨 Invitar'}
          </button>
        </form>
      </div>

      {/* Lista usuarios */}
      <div style={{ background:'white', borderRadius:'12px', border:'1px solid #eee', overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:'14px', fontWeight:'700', color:'#003366' }}>
            👥 Usuarios del sistema
          </div>
          <div style={{ fontSize:'12px', color:'#6c757d' }}>
            {usuarios.length} usuario{usuarios.length!==1?'s':''}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#6c757d' }}>Cargando usuarios...</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', background:'#f8f9fa', padding:'10px 18px', borderBottom:'1px solid #e9ecef' }}>
              {['Email', 'Estado', 'Creado', 'Último acceso', ''].map((h,i) => (
                <div key={i} style={{ fontSize:'11px', fontWeight:'700', color:'#6c757d', textTransform:'uppercase' as const, letterSpacing:'0.4px' }}>{h}</div>
              ))}
            </div>

            {usuarios.map((u, idx) => {
              const esElAdmin = u.email === ADMIN_EMAIL
              return (
                <div key={u.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', padding:'14px 18px', borderBottom: idx<usuarios.length-1?'1px solid #f0f0f0':'none', alignItems:'center', transition:'background 0.15s' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='#f8f9fa')}
                  onMouseLeave={e=>(e.currentTarget.style.background='white')}>

                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'34px', height:'34px', borderRadius:'50%', background: esElAdmin?'#003366':'#e3f2fd', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:'14px', fontWeight:'700', color: esElAdmin?'white':'#0d47a1' }}>
                        {(u.email||'?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:'600', color:'#003366' }}>{u.email}</div>
                      {esElAdmin && <div style={{ fontSize:'11px', color:'#198754', fontWeight:'600' }}>Administrador</div>}
                    </div>
                  </div>

                  <div>
                    {u.banned ? (
                      <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 8px', borderRadius:'10px', background:'#f8d7da', color:'#58151c' }}>Desactivado</span>
                    ) : u.confirmed ? (
                      <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 8px', borderRadius:'10px', background:'#d1e7dd', color:'#0a3622' }}>Activo</span>
                    ) : (
                      <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 8px', borderRadius:'10px', background:'#fff3cd', color:'#856404' }}>Invitado</span>
                    )}
                  </div>

                  <div style={{ fontSize:'12px', color:'#6c757d' }}>
                    {formatFecha(u.created_at)}
                  </div>

                  <div style={{ fontSize:'12px', color: u.last_sign_in?'#374151':'#aaa' }}>
                    {formatFecha(u.last_sign_in)}
                  </div>

                  <div style={{ display:'flex', gap:'6px' }}>
                    {!esElAdmin && (
                      <>
                        {u.banned ? (
                          <button onClick={()=>accion('unban', u)}
                            style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'6px', border:'1px solid #198754', background:'white', color:'#198754', cursor:'pointer', fontWeight:'600' }}>
                            ✓ Reactivar
                          </button>
                        ) : (
                          <button onClick={()=>accion('ban', u)}
                            style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'6px', border:'1px solid #856404', background:'white', color:'#856404', cursor:'pointer', fontWeight:'600' }}>
                            ⊘ Desactivar
                          </button>
                        )}
                        <button onClick={()=>accion('delete', u)}
                          style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'6px', border:'none', background:'#dc3545', color:'white', cursor:'pointer', fontWeight:'600' }}>
                          ✕ Eliminar
                        </button>
                      </>
                    )}
                    {esElAdmin && (
                      <span style={{ fontSize:'11px', color:'#aaa', padding:'4px 0' }}>—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
