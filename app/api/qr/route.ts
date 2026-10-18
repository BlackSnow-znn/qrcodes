import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { generateId } from '@/lib/generate-id'

export async function GET() {
  try {
    const snapshot = await db.collection('qr_codes').orderBy('created_at', 'desc').get()
    const codes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(codes)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = generateId()
    const data = {
      name: body.name?.trim() || null,
      url: body.url?.trim() || null,
      type: body.type || 'url',
      created_at: new Date().toISOString(),
    }
    await db.collection('qr_codes').doc(id).set(data)
    return NextResponse.json({ id, ...data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
