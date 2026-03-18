import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente con permisos de admin (service role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = 'fvaldebenito@aacadvisory.cl'

export async function GET(req: NextRequest) {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error

    const lista = users.map(u => ({
      id:            u.id,
      email:         u.email,
      created_at:    u.created_at,
      last_sign_in:  u.last_sign_in_at,
      confirmed:     !!u.confirmed_at,
      banned:        u.banned_until ? new Date(u.banned_until) > new Date() : false,
    }))

    return NextResponse.json({ users: lista })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, email, userId } = await req.json()

    if (action === 'invite') {
  // Invitar usuario — Supabase manda email automático
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://erp-02-two.vercel.app/reset-password'
  })
  if (error) throw error
  return NextResponse.json({ success: true, user: data.user })
}

    if (action === 'delete') {
      if (email === ADMIN_EMAIL) {
        return NextResponse.json({ error: 'No puedes eliminar al administrador principal.' }, { status: 400 })
      }
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === 'ban') {
      if (email === ADMIN_EMAIL) {
        return NextResponse.json({ error: 'No puedes desactivar al administrador principal.' }, { status: 400 })
      }
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '87600h' // 10 años = desactivado
      })
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === 'unban') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      })
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}