'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modo, setModo] = useState('login') // 'login' | 'reset'
  const [resetEnviado, setResetEnviado] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos.')
    } else {
      router.replace('/')
    }
    setLoading(false)
  }

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      setError('No se pudo enviar el correo. Verifica el email ingresado.')
    } else {
      setResetEnviado(true)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f4f6f9 0%, #e8ecf0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 20px' }}>

        {/* Logo y título */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px',
            background: '#003366', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>U</span>
          </div>
          <h1 style={{ color: '#003366', fontSize: '24px', fontWeight: '700', margin: '0 0 4px' }}>
            ERP Urrejola
          </h1>
          <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
            {modo === 'login' ? 'Inicia sesión para continuar' : 'Recuperar contraseña'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef'
        }}>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fed7d7',
              borderRadius: '8px', padding: '12px 16px',
              color: '#c53030', fontSize: '14px', marginBottom: '20px'
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Reset enviado */}
          {resetEnviado ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h3 style={{ color: '#003366', marginBottom: '8px' }}>Correo enviado</h3>
              <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '24px' }}>
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>
              <button
                onClick={() => { setModo('login'); setResetEnviado(false) }}
                style={{
                  background: 'none', border: 'none',
                  color: '#003366', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                }}
              >
                ← Volver al login
              </button>
            </div>

          ) : modo === 'login' ? (
            /* Formulario Login */
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: '14px',
                    border: '1px solid #d1d5db', borderRadius: '8px',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s', color: '#111'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: '14px',
                    border: '1px solid #d1d5db', borderRadius: '8px',
                    outline: 'none', boxSizing: 'border-box', color: '#111'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: loading ? '#6b8db5' : '#003366',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => { setModo('reset'); setError('') }}
                  style={{
                    background: 'none', border: 'none',
                    color: '#003366', cursor: 'pointer',
                    fontSize: '13px', textDecoration: 'underline'
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>

          ) : (
            /* Formulario Reset */
            <form onSubmit={handleReset}>
              <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: '14px',
                    border: '1px solid #d1d5db', borderRadius: '8px',
                    outline: 'none', boxSizing: 'border-box', color: '#111'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: loading ? '#6b8db5' : '#003366',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => { setModo('login'); setError('') }}
                  style={{
                    background: 'none', border: 'none',
                    color: '#003366', cursor: 'pointer',
                    fontSize: '13px', textDecoration: 'underline'
                  }}
                >
                  ← Volver al login
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '24px' }}>
          ERP Urrejola © {new Date().getFullYear()} · Impulsado por <a href="https://aacauditores.cl/" target="_blank" rel="noopener noreferrer" style={{ color: "#003366", fontWeight: "600", textDecoration: "none" }}>AA&amp;C</a>
        </p>
      </div>
    </div>
  )
}
