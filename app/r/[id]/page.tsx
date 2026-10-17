import { notFound, redirect } from 'next/navigation'
import { db, type QRCode } from '@/lib/firebase'

export const revalidate = 60

export default async function PublicPage({ params }: { params: { id: string } }) {
  const doc = await db.collection('qr_codes').doc(params.id).get()

  if (!doc.exists) {
    notFound()
  }

  const qr = { id: doc.id, ...doc.data() } as QRCode

  if (!qr.url) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
        <div className="text-5xl mb-4">🔧</div>
        <h1 className="text-white font-bold text-xl">Em breve</h1>
        <p className="text-zinc-400 mt-2">Esta plaquinha ainda está sendo configurada.</p>
        {qr.name && <p className="text-zinc-500 text-sm mt-1">{qr.name}</p>}
      </div>
    )
  }

  redirect(qr.url)
}
