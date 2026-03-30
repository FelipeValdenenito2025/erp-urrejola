import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { solicitud, usuarioEmail } = await req.json()

    const montoFmt = new Intl.NumberFormat('es-CL', {
      style: 'currency', currency: 'CLP'
    }).format(solicitud.monto)

    const htmlEmail = `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#003366;padding:24px 28px;border-radius:10px 10px 0 0">
          <h2 style="color:white;margin:0;font-size:20px">📄 Solicitud de Emisión de Documento</h2>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px">ERP Urrejola — Sistema de Gestión</p>
        </div>
        <div style="background:white;padding:28px;border:1px solid #e9ecef;border-top:none">
          <p style="font-size:14px;color:#555;margin-top:0">Se ha recibido una nueva solicitud de emisión de documento tributario.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6c757d;text-transform:uppercase;width:35%">Proyecto</td>
              <td style="padding:10px 14px;font-size:14px;color:#003366;font-weight:600">${solicitud.nombre_proyecto}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6c757d;text-transform:uppercase">Hito</td>
              <td style="padding:10px 14px;font-size:14px;color:#333">${solicitud.descripcion_hito}</td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6c757d;text-transform:uppercase">Cliente</td>
              <td style="padding:10px 14px;font-size:14px;color:#333">${solicitud.cliente}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6c757d;text-transform:uppercase">RUT Cliente</td>
              <td style="padding:10px 14px;font-size:14px;color:#333">${solicitud.rut || '—'}</td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6c757d;text-transform:uppercase">Email Cliente</td>
              <td style="padding:10px 14px;font-size:14px;color:#333">${solicitud.email_cliente || '—'}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6c757d;text-transform:uppercase">Tipo Documento</td>
              <td style="padding:10px 14px;font-size:14px;font-weight:700;color:#003366">${solicitud.tipo_doc}</td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6c757d;text-transform:uppercase">Monto</td>
              <td style="padding:10px 14px;font-size:18px;font-weight:800;color:#003366">${montoFmt}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#6c757d;text-transform:uppercase">Glosa</td>
              <td style="padding:10px 14px;font-size:14px;color:#333">${solicitud.glosa || '—'}</td>
            </tr>
          </table>
          <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;margin-bottom:20px">
            <p style="margin:0;font-size:13px;color:#856404">
              <strong>Solicitado por:</strong> ${usuarioEmail}<br>
              <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
            </p>
          </div>
          <p style="font-size:12px;color:#aaa;margin-bottom:0">
            Generado automáticamente por ERP Urrejola.<br>
            Impulsado por <strong>AA&amp;C Auditores</strong> · <a href="https://aacauditores.cl" style="color:#003366">aacauditores.cl</a>
          </p>
        </div>
      </div>
    `

await resend.emails.send({
  from:    'ERP Urrejola <erp@aacadvisory.cl>',
  to:      'fvaldebenito@aacadvisory.cl',
  cc:      usuarioEmail !== 'fvaldebenito@aacadvisory.cl' ? usuarioEmail : undefined,
  subject: `📄 Solicitud ${solicitud.tipo_doc} — ${solicitud.nombre_proyecto} [HITO: ${solicitud.id_hito}]`,
  html:    htmlEmail,
})

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error API factura:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}