import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { mensaje, usuarioEmail } = await req.json()

    if (!mensaje || !usuarioEmail) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    await resend.emails.send({
      from:     'ERP Urrejola <onboarding@resend.dev>',
      to:       'fvaldebenito@aacadvisory.cl',
      replyTo:  usuarioEmail,
      subject:  `💬 Consulta ERP — ${usuarioEmail}`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#333">
          <div style="background:#003366;padding:20px 24px;border-radius:10px 10px 0 0">
            <h2 style="color:white;margin:0;font-size:18px">💬 Nueva Consulta desde el ERP</h2>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e9ecef;border-top:none">
            <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:20px;font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap">${mensaje}</div>
            <div style="background:#e3f2fd;border-radius:8px;padding:12px 16px;font-size:13px;color:#0d47a1">
              <strong>Enviado por:</strong> ${usuarioEmail}<br>
              <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}<br>
              <strong>Responder a:</strong> <a href="mailto:${usuarioEmail}" style="color:#003366">${usuarioEmail}</a>
            </div>
            <p style="font-size:12px;color:#aaa;margin-top:16px;margin-bottom:0">
              ERP Urrejola · Impulsado por <strong>AA&amp;C Auditores</strong>
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}