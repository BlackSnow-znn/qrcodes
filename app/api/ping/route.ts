import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'

// Firebase não pausa como o Supabase, mas este endpoint fica disponível
// para verificar se o banco está respondendo
export async function GET() {
  try {
    const snapshot = await db
      .collection('qr_codes')
      .limit(1)
      .get()

    return NextResponse.json({
      ok: true,
      ts: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
