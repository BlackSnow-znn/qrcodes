'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface QRData {
  id: string
  name: string
  url: string
}

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<QRData>({ id: '', name: '', url: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || ''
  const publicUrl = `${baseUrl}/r/${id}`

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/qr/${id}`)
      if (res.ok) {
        const qr = await res.json()
        setData({ id: qr.id, name: qr.name || '', url: qr.url || '' })
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/qr/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, url: data.url }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erro ao salvar')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Excluir este QR Code? Esta ação não pode ser desfeita.')) return
    const res = await fetch(`/api/qr/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/admin/dashboard')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800 flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold truncate">
            {data.name || <span className="text-zinc-500">Sem nome</span>}
          </h1>
          <p className="text-zinc-600 text-xs font-mono">{id}</p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pb-32">
        {/* Link da plaquinha */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-2 uppercase tracking-wide font-medium">Link da plaquinha</p>
          <div className="flex items-center gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 text-sm font-mono truncate flex-1 hover:text-emerald-300 transition-colors"
            >
              {publicUrl}
            </a>
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Campos */}
        <div className="space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <span>🏪</span> Nome do estabelecimento
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => { setData((p) => ({ ...p, name: e.target.value })); setSaved(false) }}
              placeholder="Ex: Restaurante da Maria"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder-zinc-600"
            />
            <p className="text-zinc-600 text-xs">Aparece na tela quando não há link configurado</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <span>🔗</span> URL de destino
            </label>
            <input
              type="url"
              value={data.url}
              onChange={(e) => { setData((p) => ({ ...p, url: e.target.value })); setSaved(false) }}
              placeholder="https://..."
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder-zinc-600"
            />
            <p className="text-zinc-600 text-xs">
              O QR Code vai redirecionar direto para esta URL — Google Maps, Instagram, WhatsApp, cardápio, qualquer coisa
            </p>
          </div>
        </div>

        {/* Deletar */}
        <button
          onClick={handleDelete}
          className="w-full py-3 text-red-400 hover:text-red-300 text-sm transition-colors"
        >
          Excluir este QR Code
        </button>
      </main>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/95 backdrop-blur border-t border-zinc-800">
        {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full max-w-2xl mx-auto block py-4 font-bold rounded-xl text-lg transition-all ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white'
          }`}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Salvando...
            </span>
          ) : saved ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Salvo!
            </span>
          ) : (
            'Salvar'
          )}
        </button>
      </div>
    </div>
  )
}
