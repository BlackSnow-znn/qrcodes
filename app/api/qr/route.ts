import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { generateId } from '@/lib/generate-id'

// GET /api/qr — lista todos os QR Codes
export async function GET() {
  try {
    const snapshot = await db
      .collection('qr_codes')
      .orderBy('created_at', 'desc')
      .get()

    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/qr — gera N QR Codes novos (em lote)
export async function POST(request: Request) {
  try {
    const { count = 1 } = await request.json()

    if (count < 1 || count > 100) {
      return NextResponse.json({ error: 'Quantidade inválida (1–100)' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seu-projeto.vercel.app'
    const now = new Date().toISOString()

    const batch = db.batch()
    const result: { id: string; url: string }[] = []

    for (let i = 0; i < count; i++) {
      const id = generateId(8)
      const ref = db.collection('qr_codes').doc(id)
      const data = {
        name: null,
        google_review: null,
        instagram: null,
        whatsapp: null,
        tiktok: null,
        facebook: null,
        website: null,
        created_at: now,
        updated_at: now,
      }
      batch.set(ref, data)
      result.push({ id, url: `${baseUrl}/r/${id}` })
    }

    await batch.commit()
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
