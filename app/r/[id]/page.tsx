import { notFound, redirect } from 'next/navigation'
import { db, type QRCode } from '@/lib/firebase'

export const revalidate = 60

function parseWifi(str: string) {
  const ssid = str.match(/S:([^;]*)/)?.[1] || ''
  const password = str.match(/P:([^;]*)/)?.[1] || ''
  const security = str.match(/T:([^;]*)/)?.[1] || 'WPA'
  return { ssid, password, security }
}

export default async function PublicPage({ params }: { params: { id: string } }) {
  const doc = await db.collection('qr_codes').doc(params.id).get()

  if (!doc.exists) notFound()

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

  // Wi-Fi: show credentials page instead of redirect
  if (qr.url.startsWith('WIFI:')) {
    const { ssid, password, security } = parseWifi(qr.url)
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">📶</div>
            <h1 className="text-white font-bold text-2xl">{qr.name || 'Wi-Fi'}</h1>
            <p className="text-zinc-400 mt-1 text-sm">Conecte-se à rede abaixo</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
            <div className="p-5">
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium mb-2">Rede</p>
              <p className="text-white text-xl font-bold">{ssid}</p>
            </div>

            {security !== 'nopass' && (
              <div className="p-5">
                <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium mb-2">Senha</p>
                <p className="text-white text-xl font-mono font-bold tracking-wider">{password || '—'}</p>
              </div>
            )}

            {security === 'nopass' && (
              <div className="p-5 flex items-center gap-2">
                <span className="text-emerald-400 text-sm">✓</span>
                <p className="text-emerald-400 text-sm font-medium">Rede aberta — sem senha</p>
              </div>
            )}
          </div>

          <p className="text-zinc-600 text-xs text-center leading-relaxed">
            Vá em <span className="text-zinc-400">Configurações → Wi-Fi</span> no seu celular<br />
            e selecione a rede acima
          </p>
        </div>
      </div>
    )
  }

  redirect(qr.url)
}
