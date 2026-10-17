import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'

// GET /api/qr/[id] — busca um QR Code específico
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const doc = await db.collection('qr_codes').doc(params.id).get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'QR Code não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ id: doc.id, ...doc.data() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT /api/qr/[id] — atualiza os links de um QR Code
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    const allowed = ['name', 'google_review', 'instagram', 'whatsapp', 'tiktok', 'facebook', 'website']
    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    }

    for (const key of allowed) {
      if (key in body) {
        updates[key] = body[key]?.trim() || null
      }
    }

    await db.collection('qr_codes').doc(params.id).update(updates)

    const updated = await db.collection('qr_codes').doc(params.id).get()
    return NextResponse.json({ id: updated.id, ...updated.data() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/qr/[id] — remove um QR Code
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await db.collection('qr_codes').doc(params.id).delete()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
