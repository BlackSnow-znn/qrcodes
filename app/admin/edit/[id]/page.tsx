'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface QRData {
  id: string
  name: string
  google_review: string
  instagram: string
  whatsapp: string
  tiktok: string
  facebook: string
  website: string
}

const FIELDS = [
  {
    key: 'name',
    label: 'Nome do estabelecimento',
    placeholder: 'Ex: Restaurante da Maria',
    icon: '🏪',
    type: 'text',
    hint: 'Aparece na página que o cliente vê',
  },
  {
    key: 'google_review',
    label: 'Google Avaliações',
    placeholder: 'https://g.page/r/...',
    icon: '⭐',
    type: 'url',
    hint: 'Link direto para deixar avaliação',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    placeholder: 'https://wa.me/5511999999999',
    icon: '💬',
    type: 'url',
    hint: 'wa.me/55 + DDD + número (sem espaços)',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/perfil',
    icon: '📸',
    type: 'url',
    hint: 'Link do perfil',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@perfil',
    icon: '🎵',
    type: 'url',
    hint: 'Link do perfil',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/pagina',
    icon: '👍',
    type: 'url',
    hint: 'Link da página',
  },
  {
    key: 'website',
    label: 'Site / Cardápio / Outro link',
    placeholder: 'https://...',
    icon: '🌐',
    type: 'url',
    hint: 'Qualquer link adicional',
  },
] as const

const empty: QRData = {
  id: '',
  name: '',
  google_review: '',
  instagram: '',
  whatsapp: '',
  tiktok: '',
  facebook: '',
  website: '',
}

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<QRData>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch_ = async () => {
      const res = await fetch(`/api/qr/${id}`)
      if (res.ok) {
        const qr = await res.json()
        setData({
          id: qr.id,
          name: qr.name || '',
          google_review: qr.google_review || '',
          instagram: qr.instagram || '',
          whatsapp: qr.whatsapp || '',
          tiktok: qr.tiktok || '',
          facebook: qr.facebook || '',
          website: qr.website || '',
        })
      }
      setLoading(false)
    }
    fetch_()
  }, [id])

  const handleChange = (key: keyof QRData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/qr/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return

    const res = await fetch(`/api/qr/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin/dashboard')
    }
  }

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || ''

  const publicUrl = `${baseUrl}/r/${id}`

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
            {data.name || 'Plaquinha sem nome'}
          </h1>
          <p className="text-zinc-500 text-xs font-mono">{id}</p>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 pb-32">
        {/* URL pública */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">Link da plaquinha</p>
          <div className="flex items-center gap-2">
            <p className="text-emerald-400 text-sm font-mono truncate flex-1">{publicUrl}</p>
            <button
              onClick={() => navigator.clipboard.writeText(publicUrl)}
              className="text-zinc-500 hover:text-zinc-300 flex-shrink-0 p-1"
              title="Copiar link"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 flex-shrink-0 p-1"
              title="Abrir link"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Campos */}
        <div className="space-y-3">
          {FIELDS.map((field) => (
            <div key={field.key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <span>{field.icon}</span>
                {field.label}
              </label>
              <input
                type={field.type}
                value={data[field.key as keyof QRData]}
                onChange={(e) => handleChange(field.key as keyof QRData, e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder-zinc-600"
              />
              {field.hint && (
                <p className="text-zinc-600 text-xs">{field.hint}</p>
              )}
            </div>
          ))}
        </div>

        {/* Deletar */}
        <button
          onClick={handleDelete}
          className="w-full py-3 text-red-400 hover:text-red-300 text-sm transition-colors"
        >
          Excluir este QR Code
        </button>
      </main>

      {/* Footer fixo com botão salvar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/95 backdrop-blur border-t border-zinc-800">
        {error && (
          <p className="text-red-400 text-sm text-center mb-2">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full max-w-2xl mx-auto block py-4 font-bold rounded-xl text-lg transition-all ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
