'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Scanner = dynamic(() => import('@/components/Scanner'), { ssr: false })
const QRBatch = dynamic(() => import('@/components/QRBatch'), { ssr: false })

interface QRCode {
  id: string
  name: string | null
  google_review: string | null
  instagram: string | null
  whatsapp: string | null
  tiktok: string | null
  facebook: string | null
  website: string | null
  created_at: string
}

function hasLinks(qr: QRCode) {
  return !!(qr.google_review || qr.instagram || qr.whatsapp || qr.tiktok || qr.facebook || qr.website)
}

function countLinks(qr: QRCode) {
  return [qr.google_review, qr.instagram, qr.whatsapp, qr.tiktok, qr.facebook, qr.website].filter(Boolean).length
}

export default function DashboardPage() {
  const router = useRouter()
  const [codes, setCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [showBatch, setShowBatch] = useState(false)

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
      // silently fail
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

  const configured = codes.filter(hasLinks).length
  const unconfigured = codes.filter((c) => !hasLinks(c)).length

  return (
    <div className="min-h-screen flex flex-col">
      {/* Scanner modal */}
      {showScanner && <Scanner onClose={() => setShowScanner(false)} />}
      {showBatch && (
        <QRBatch onClose={() => { setShowBatch(false); fetchCodes() }} />
      )}

      {/* Header */}
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
        {/* Ações principais */}
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
            onClick={() => setShowBatch(true)}
            className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white rounded-2xl p-5 flex flex-col items-center gap-3 transition-all border border-zinc-700"
          >
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg leading-tight">Gerar</p>
              <p className="text-zinc-400 text-sm">Novos QR Codes</p>
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
              <p className="text-zinc-500 text-xs mt-1">Ativos</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-3 text-center border border-zinc-800">
              <p className="text-2xl font-bold text-zinc-500">{unconfigured}</p>
              <p className="text-zinc-500 text-xs mt-1">Vazios</p>
            </div>
          </div>
        )}

        {/* Lista de QR Codes */}
        <div>
          <h2 className="text-zinc-400 text-sm font-medium mb-3 px-1">Plaquinhas</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900 rounded-xl h-20 animate-pulse border border-zinc-800" />
              ))}
            </div>
          ) : codes.length === 0 ? (
            <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
              <p className="text-zinc-500">Nenhuma plaquinha ainda.</p>
              <p className="text-zinc-600 text-sm mt-1">Clique em "Gerar" para criar as primeiras.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {codes.map((code) => (
                <button
                  key={code.id}
                  onClick={() => router.push(`/admin/edit/${code.id}`)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex items-center gap-4 transition-all text-left"
                >
                  {/* Status indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasLinks(code) ? 'bg-emerald-400' : 'bg-zinc-600'}`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {code.name || <span className="text-zinc-500">Sem nome</span>}
                    </p>
                    <p className="text-zinc-500 text-sm font-mono">{code.id}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasLinks(code) ? (
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                        {countLinks(code)} link{countLinks(code) !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg">
                        Vazio
                      </span>
                    )}
                    <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
