'use client'

import { useState } from 'react'

export default function BotonConsulta({ usuarioEmail }: { usuarioEmail: string }) {
  const [abierto, setAbierto] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!mensaje.trim()) return
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, usuarioEmail }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEnviado(true)
      setMensaje('')
      setTimeout(() => { setEnviado(false); setAbierto(false) }, 3000)
    } catch (e: any) {
      setError(e.message)
    }
    setEnviando(false)
  }

  return (
    <>
      {/* Chat box */}
      {abierto && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '20px',
          width: '300px', background: 'white', borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 999,
          border: '1px solid #e9ecef', overflow: 'hidden',
          animation: 'fadeUp 0.2s ease'
        }}>
          <style>{`
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{ background: '#003366', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>💬 Consultar soporte</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>Te responderemos al correo</div>
            </div>
            <button onClick={() => setAbierto(false)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          {/* Cuerpo */}
          <div style={{ padding: '14px' }}>
            {enviado ? (
              <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#003366' }}>¡Consulta enviada!</div>
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>Te responderemos a {usuarioEmail}</div>
              </div>
            ) : (
              <form onSubmit={enviar}>
                {error && (
                  <div style={{ background: '#fdecea', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#842029', marginBottom: '10px' }}>
                    ⚠ {error}
                  </div>
                )}
                <textarea
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  placeholder="Escribe tu consulta o duda..."
                  rows={4}
                  required
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: '13px',
                    border: '1px solid #d1d5db', borderRadius: '8px',
                    outline: 'none', resize: 'none', boxSizing: 'border-box' as const,
                    fontFamily: "'Segoe UI', sans-serif", lineHeight: '1.5'
                  }}
                />
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>
                  Se enviará desde {usuarioEmail}
                </div>
                <button type="submit" disabled={enviando || !mensaje.trim()}
                  style={{
                    width: '100%', padding: '9px', background: enviando || !mensaje.trim() ? '#9db4cc' : '#003366',
                    color: 'white', border: 'none', borderRadius: '8px',
                    cursor: enviando || !mensaje.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '13px', fontWeight: '700'
                  }}>
                  {enviando ? '⏳ Enviando...' : '📤 Enviar consulta'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '52px', height: '52px', borderRadius: '50%',
          background: abierto ? '#6c757d' : '#003366',
          color: 'white', border: 'none',
          boxShadow: '0 4px 16px rgba(0,0,51,0.3)',
          cursor: 'pointer', fontSize: '22px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, transition: 'all 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        title="Consultar soporte"
      >
        {abierto ? '×' : '💬'}
      </button>
    </>
  )
}
