'use client'

import { useState, useCallback } from 'react'

type DialogConfig = {
  titulo: string
  mensaje: string
  tipo: 'confirmar' | 'alerta' | 'exito' | 'error'
  labelConfirmar?: string
  labelCancelar?: string
}

type DialogResult = boolean

let resolveDialog: ((val: DialogResult) => void) | null = null

// Estado global del diálogo
let setDialogGlobal: ((config: DialogConfig | null) => void) | null = null

// Función para mostrar confirmación — úsala en vez de confirm()
export function confirmar(config: Omit<DialogConfig, 'tipo'>): Promise<boolean> {
  return new Promise(resolve => {
    resolveDialog = resolve
    setDialogGlobal?.({ ...config, tipo: 'confirmar' })
  })
}

// Función para mostrar alerta — úsala en vez de alert()
export function alertar(config: Omit<DialogConfig, 'tipo' | 'labelCancelar'> & { tipo?: 'alerta' | 'exito' | 'error' }): Promise<void> {
  return new Promise(resolve => {
    resolveDialog = () => resolve()
    setDialogGlobal?.({ ...config, tipo: config.tipo || 'alerta' })
  })
}

const iconos = {
  confirmar: '❓',
  alerta:    '⚠️',
  exito:     '✅',
  error:     '❌',
}

const colores = {
  confirmar: { header: '#003366', btn: '#003366' },
  alerta:    { header: '#856404', btn: '#856404' },
  exito:     { header: '#198754', btn: '#198754' },
  error:     { header: '#842029', btn: '#842029' },
}

export default function DialogProvider() {
  const [config, setConfig] = useState<DialogConfig | null>(null)

  // Registrar el setter global
  if (setDialogGlobal !== setConfig) {
    setDialogGlobal = setConfig
  }

  if (!config) return null

  const col = colores[config.tipo]

  function handleConfirm() {
    setConfig(null)
    resolveDialog?.(true)
    resolveDialog = null
  }

  function handleCancel() {
    setConfig(null)
    resolveDialog?.(false)
    resolveDialog = null
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', animation: 'fadeIn 0.15s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
      `}</style>
      <div style={{
        background: 'white', borderRadius: '14px', width: '100%', maxWidth: '400px',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{ background: col.header, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{iconos[config.tipo]}</span>
          <h5 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: '700' }}>{config.titulo}</h5>
        </div>

        {/* Mensaje */}
        <div style={{ padding: '20px', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
          {config.mensaje}
        </div>

        {/* Botones */}
        <div style={{ padding: '0 20px 18px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          {config.tipo === 'confirmar' && (
            <button onClick={handleCancel}
              style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
              {config.labelCancelar || 'Cancelar'}
            </button>
          )}
          <button onClick={handleConfirm}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: col.btn, color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            {config.labelConfirmar || (config.tipo === 'confirmar' ? 'Confirmar' : 'Aceptar')}
          </button>
        </div>
      </div>
    </div>
  )
}
