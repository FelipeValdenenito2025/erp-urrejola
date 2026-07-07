import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Verificar cron secret para evitar ejecuciones no autorizadas
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  return await enviarAlerta()
}

export async function POST(req: NextRequest) {
  // Permite ejecución manual desde el ERP (sin verificación de cron)
  return await enviarAlerta()
}

async function enviarAlerta() {
  try {
    // Buscar proyectos con 100% cobrado pero con hitos sin facturar
    const { data: proyectos, error } = await supabaseAdmin
      .from('proyectos')
      .select(`
        id, nombre, cliente, rut, moneda, monto_base, monto_extra,
        hitos (
          id, descripcion, monto, estado_pago, estado_factura,
          abonos (monto)
        )
      `)
      .eq('estado', 'Abierto')

    if (error) throw error

    // Filtrar proyectos con 100% cobrado y hitos pendientes de facturar
    const proyectosAlerta = (proyectos || []).filter((p: any) => {
      const hitos = p.hitos || []
      if (hitos.length === 0) return false

      // Total cobrado (suma de abonos)
      const totalCobrado = hitos.reduce((sum: number, h: any) => {
        return sum + (h.abonos || []).reduce((s: number, a: any) => s + a.monto, 0)
      }, 0)

      // Total hitos
      const totalHitos = hitos.reduce((sum: number, h: any) => sum + h.monto, 0)

      // 100% cobrado
      const cobradoTotal = totalHitos > 0 && totalCobrado >= totalHitos

      // Tiene hitos pendientes de facturar
      const hitosSinFacturar = hitos.filter((h: any) =>
        h.estado_factura === 'Pendiente' || h.estado_factura === 'En Proceso Facturación'
      )

      return cobradoTotal && hitosSinFacturar.length > 0
    }).map((p: any) => {
      const hitos = p.hitos || []
      const totalCobrado = hitos.reduce((sum: number, h: any) =>
        sum + (h.abonos || []).reduce((s: number, a: any) => s + a.monto, 0), 0)
      const hitosSinFacturar = hitos.filter((h: any) =>
        h.estado_factura === 'Pendiente' || h.estado_factura === 'En Proceso Facturación'
      )
      return { ...p, totalCobrado, hitosSinFacturar }
    })

    if (proyectosAlerta.length === 0) {
      return NextResponse.json({ success: true, mensaje: 'Sin alertas pendientes', proyectos: 0 })
    }

    const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CL')

    const filasProyectos = proyectosAlerta.map((p: any) => {
      const filas = p.hitosSinFacturar.map((h: any) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#374151">${h.descripcion}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-weight:600;color:#003366">${fmt(h.monto)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;text-align:center">
            <span style="background:${h.estado_factura==='Pendiente'?'#fff3cd':'#cff4fc'};color:${h.estado_factura==='Pendiente'?'#856404':'#055160'};padding:2px 8px;border-radius:6px;font-weight:600">
              ${h.estado_factura}
            </span>
          </td>
        </tr>
      `).join('')

      return `
        <div style="margin-bottom:24px;border:1px solid #e9ecef;border-radius:10px;overflow:hidden">
          <div style="background:#003366;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="color:white;font-weight:700;font-size:14px">${p.nombre}</div>
              <div style="color:rgba(255,255,255,0.7);font-size:12px">${p.cliente}${p.rut ? ' · RUT: ' + p.rut : ''}</div>
            </div>
            <div style="text-align:right">
              <div style="color:#4fc3f7;font-size:12px">Total cobrado</div>
              <div style="color:white;font-weight:800;font-size:16px">${fmt(p.totalCobrado)}</div>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f8f9fa">
                <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#6c757d;text-align:left;text-transform:uppercase">Hito</th>
                <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#6c757d;text-align:right;text-transform:uppercase">Monto</th>
                <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#6c757d;text-align:center;text-transform:uppercase">Estado Factura</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      `
    }).join('')

    const html = `
      <div style="font-family:'Segoe UI',sans-serif;max-width:640px;margin:0 auto;color:#333">
        <div style="background:#003366;padding:24px 28px;border-radius:12px 12px 0 0">
          <h2 style="color:white;margin:0;font-size:20px">⚠️ Alerta: Proyectos Cobrados sin Facturar</h2>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px">ERP Urrejola — Revisión automática</p>
        </div>
        <div style="background:white;padding:24px 28px;border:1px solid #e9ecef;border-top:none">
          <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;margin-bottom:20px">
            <p style="margin:0;font-size:13px;color:#856404">
              <strong>${proyectosAlerta.length} proyecto${proyectosAlerta.length !== 1 ? 's' : ''}</strong> 
              ${proyectosAlerta.length !== 1 ? 'tienen' : 'tiene'} el 100% del monto cobrado pero 
              aún ${proyectosAlerta.length !== 1 ? 'tienen' : 'tiene'} hitos pendientes de facturar.
            </p>
          </div>
          ${filasProyectos}
          <p style="font-size:12px;color:#aaa;margin-top:20px;margin-bottom:0">
            Generado el ${new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}<br>
            Impulsado por <strong>AA&amp;C Auditores</strong> · <a href="https://aacauditores.cl" style="color:#003366">aacauditores.cl</a>
          </p>
        </div>
      </div>
    `

    await resend.emails.send({
      from:    'ERP Urrejola <erp@aacadvisory.cl>',
     to:  'fvaldebenito@aacadvisory.cl',
cc:  ['fvaldebenito@aacadvisory.cl', 'fvaldebenito@aacadvisory.cl'],
      subject: `⚠️ ${proyectosAlerta.length} proyecto${proyectosAlerta.length !== 1 ? 's' : ''} cobrado${proyectosAlerta.length !== 1 ? 's' : ''} sin facturar — ERP Urrejola`,
      html,
    })

    return NextResponse.json({
      success: true,
      proyectos: proyectosAlerta.length,
      nombres: proyectosAlerta.map((p: any) => p.nombre)
    })

  } catch (error: any) {
    console.error('Error alerta facturas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
