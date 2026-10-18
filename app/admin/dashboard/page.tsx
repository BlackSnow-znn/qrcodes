'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Scanner = dynamic(() => import('@/components/Scanner'), { ssr: false })
const QRCreate = dynamic(() => import('@/components/QRCreate'), { ssr: false })

interface QRCode {
  id: string
  name: string | null
  url: string | null
  created_at: string
}

function QRImage({ value }: { value: string }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    import('@/lib/qr-styled').then(({ generateRoundedQR }) => {
      generateRoundedQR(value, 72).then(setSrc).catch(() => {})
    })
  }, [value])

  if (!src) {
    return <div className="w-14 h-14 bg-zinc-800 rounded-lg animate-pulse flex-shrink-0" />
  }
  return (
    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white p-0.5">
      <img src={src} alt="QR" className="w-full h-full" />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [codes, setCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || ''

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/qr')
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      setCodes(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/admin')
  }

  const configured = codes.filter((c) => c.url).length
  const empty = codes.filter((c) => !c.url).length

  return (
    <div className="min-h-screen flex flex-col">
      {showScanner && <Scanner onClose={() => setShowScanner(false)} />}
      {showCreate && (
        <QRCreate
          onClose={(created) => {
            setShowCreate(false)
            if (created) fetchCodes()
          }}
        />
      )}

      <header className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="font-bold text-white">QR Plaquinha</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          Sair
        </button>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
        {/* Ações */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl p-5 flex flex-col items-center gap-3 transition-all"
          >
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg leading-tight">Escanear</p>
              <p className="text-white/70 text-sm">Configurar plaquinha</p>
            </div>
          </button>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white rounded-2xl p-5 flex flex-col items-center gap-3 transition-all border border-zinc-700"
          >
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg leading-tight">Novo QR</p>
              <p className="text-zinc-400 text-sm">Criar plaquinha</p>
            </div>
          </button>
        </div>

        {/* Estatísticas */}
        {!loading && codes.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900 rounded-xl p-3 text-center border border-zinc-800">
              <p className="text-2xl font-bold text-white">{codes.length}</p>
              <p className="text-zinc-500 text-xs mt-1">Total</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-3 text-center border border-zinc-800">
              <p className="text-2xl font-bold text-emerald-400">{configured}</p>
              <p className="text-zinc-500 text-xs mt-1">Com link</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-3 text-center border border-zinc-800">
              <p className="text-2xl font-bold text-zinc-500">{empty}</p>
              <p className="text-zinc-500 text-xs mt-1">Sem link</p>
            </div>
          </div>
        )}

        {/* Lista */}
        <div>
          <h2 className="text-zinc-400 text-sm font-medium mb-3 px-1">Plaquinhas</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900 rounded-xl h-24 animate-pulse border border-zinc-800" />
              ))}
            </div>
          ) : codes.length === 0 ? (
            <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
              <p className="text-zinc-500">Nenhuma plaquinha ainda.</p>
              <p className="text-zinc-600 text-sm mt-1">Clique em "Novo QR" para criar a primeira.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {codes.map((code) => (
                <button
                  key={code.id}
                  onClick={() => router.push(`/admin/edit/${code.id}`)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex items-center gap-4 transition-all text-left"
                >
                  {/* QR Code thumbnail */}
                  <QRImage value={`${baseUrl}/r/${code.id}`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {code.name || <span className="text-zinc-500 italic">Sem nome</span>}
                    </p>
                    <p className="text-zinc-600 text-xs font-mono mt-0.5">{code.id}</p>
                    {code.url ? (
                      <p className="text-emerald-400 text-xs truncate mt-0.5">{code.url}</p>
                    ) : (
                      <p className="text-zinc-600 text-xs mt-0.5">Sem link configurado</p>
                    )}
                  </div>

                  <svg className="w-4 h-4 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
