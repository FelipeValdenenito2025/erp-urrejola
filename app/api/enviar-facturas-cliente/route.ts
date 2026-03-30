import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { proyecto, hitos, emailDestino, nombreDestino } = await req.json()

    const hitosRows = hitos.map((h: any) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px;color:#333">${h.descripcion}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px;color:#003366;font-weight:700;text-align:right">
          ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(h.monto)}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center">
          <a href="${h.link_factura}" target="_blank"
            style="background:#003366;color:white;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600">
            📄 Ver Factura
          </a>
        </td>
      </tr>
    `).join('')

    const totalMonto = hitos.reduce((a: number, h: any) => a + h.monto, 0)
    const montoFmt = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(totalMonto)

    const html = `
      <div style="font-family:'Segoe UI',sans-serif;max-width:620px;margin:0 auto;color:#333">

        <!-- Header -->
        <div style="background:white;padding:20px 32px;border-radius:12px 12px 0 0;text-align:center;border:1px solid #e9ecef;border-bottom:none">
          <img src="https://i.imgur.com/U7FK19x.png" alt="Urrejola" style="height:44px;object-fit:contain;display:block;margin:0 auto" />
        </div>
        <div style="background:#003366;padding:20px 32px;text-align:center">
          <h1 style="color:white;margin:0;font-size:20px;font-weight:700">Documentos Tributarios</h1>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px">${proyecto.nombre}</p>
        </div>

        <!-- Cuerpo -->
        <div style="background:white;padding:28px 32px;border:1px solid #e9ecef;border-top:none">
          <p style="font-size:14px;color:#555;margin-top:0">
            Estimado/a <strong>${nombreDestino || emailDestino}</strong>,
          </p>
          <p style="font-size:14px;color:#555;line-height:1.6">
            Le informamos que ${hitos.length === 1 ? 'el siguiente documento tributario ha sido' : 'los siguientes documentos tributarios han sido'} emitido${hitos.length === 1 ? '' : 's'} y ${hitos.length === 1 ? 'está disponible' : 'están disponibles'} para su descarga:
          </p>

          <!-- Tabla de hitos -->
          <table style="width:100%;border-collapse:collapse;margin:20px 0;border-radius:8px;overflow:hidden;border:1px solid #e9ecef">
            <thead>
              <tr style="background:#003366">
                <th style="padding:10px 14px;color:white;font-size:12px;text-align:left;font-weight:600;text-transform:uppercase">Concepto</th>
                <th style="padding:10px 14px;color:white;font-size:12px;text-align:right;font-weight:600;text-transform:uppercase">Monto</th>
                <th style="padding:10px 14px;color:white;font-size:12px;text-align:center;font-weight:600;text-transform:uppercase">Documento</th>
              </tr>
            </thead>
            <tbody>
              ${hitosRows}
              <tr style="background:#f0f4ff">
                <td style="padding:10px 14px;font-weight:700;color:#003366;font-size:13px">Total</td>
                <td style="padding:10px 14px;font-weight:800;color:#003366;font-size:15px;text-align:right">${montoFmt}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <p style="font-size:13px;color:#6c757d;line-height:1.6">
            Si tiene alguna consulta sobre estos documentos, no dude en contactarnos respondiendo a este correo.
          </p>

          <div style="background:#e3f2fd;border-radius:8px;padding:14px 18px;margin-top:20px;font-size:12px;color:#0d47a1">
            <strong>Proyecto:</strong> ${proyecto.nombre}<br>
            <strong>Cliente:</strong> ${proyecto.cliente}<br>
            <strong>Fecha de envío:</strong> ${new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' })}
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8f9fa;padding:16px 32px;border:1px solid #e9ecef;border-top:none;border-radius:0 0 12px 12px;text-align:center">
          <p style="font-size:11px;color:#aaa;margin:0">
            Este correo fue enviado desde el sistema ERP Urrejola.<br>
            Impulsado por <strong style="color:#003366">AA&amp;C Auditores</strong> · 
            <a href="https://aacauditores.cl" style="color:#003366">aacauditores.cl</a>
          </p>
        </div>
      </div>
    `

    await resend.emails.send({
      from:    'AA&C Auditores <erp@aacadvisory.cl>',
      to:      emailDestino,
      cc:      ['fvaldebenito@aacadvisory.cl', 'vjimenez@aacadvisory.cl'],
      subject: `📄 Documentos Tributarios — ${proyecto.nombre}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error enviar facturas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}