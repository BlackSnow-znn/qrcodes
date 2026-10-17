import { NextResponse } from 'next/server'

// POST /api/auth — faz login
export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin_token', process.env.ADMIN_SECRET!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/auth — faz logout
export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('admin_token')
  return response
}
